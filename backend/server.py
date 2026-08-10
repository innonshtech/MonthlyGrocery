from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import os
import logging
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient

from auth import seed_super_admin
from routes.auth_routes import router as auth_router
from routes.shop_routes import router as shop_router
from routes.product_routes import router as product_router
from routes.category_routes import router as category_router
from routes.order_routes import router as order_router
from routes.cart_routes import router as cart_router
from routes.admin_routes import router as admin_router
from routes.ai_routes import router as ai_router
from routes.upload_routes import router as upload_router
from routes.banner_routes import router as banner_router, admin_router as banner_admin_router

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI(title="MonthlyGrocery API")

# CORS — support both the primary FRONTEND_URL and a comma-separated CORS_ORIGINS list,
# so preview + production + custom domain all work.
frontend_url = os.environ.get("FRONTEND_URL", "")
cors_env = os.environ.get("CORS_ORIGINS", "*")
if cors_env.strip() == "*":
    allow_origins = ["*"]
    allow_credentials = False  # cannot mix "*" with credentials
else:
    allow_origins = [o.strip() for o in cors_env.split(",") if o.strip()]
    if frontend_url and frontend_url not in allow_origins:
        allow_origins.append(frontend_url)
    allow_credentials = True

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_origin_regex=r"^https://([a-z0-9-]+\.)*(monthlygrocery\.in|emergent\.host|emergentagent\.com)$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Attach db to app.state so routers can access it
app.state.db = db

# Include routers
app.include_router(auth_router, prefix="/api/auth", tags=["auth"])
app.include_router(shop_router, prefix="/api/shops", tags=["shops"])
app.include_router(product_router, prefix="/api/products", tags=["products"])
app.include_router(category_router, prefix="/api/categories", tags=["categories"])
app.include_router(order_router, prefix="/api/orders", tags=["orders"])
app.include_router(cart_router, prefix="/api/cart", tags=["cart"])
app.include_router(admin_router, prefix="/api/admin", tags=["admin"])
app.include_router(ai_router, prefix="/api/ai", tags=["ai"])
app.include_router(upload_router, prefix="/api/upload", tags=["upload"])
app.include_router(banner_router, prefix="/api/banners", tags=["banners"])
app.include_router(banner_admin_router, prefix="/api/admin", tags=["admin"])

# Serve uploaded product photos as static files. Doing this at /api/uploads keeps
# the ingress /api prefix rule (all /api/* traffic → backend port 8001) so the
# frontend never needs a separate host/CORS rule for images.
UPLOAD_DIR = os.environ.get("UPLOAD_DIR", "/app/backend/uploaded_images")
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/api/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")


@app.get("/api/")
async def root():
    return {"message": "MonthlyGrocery API is live", "version": "1.0"}


logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


@app.on_event("startup")
async def startup():
    # Drop legacy indexes from the pre-OTP schema (email-based auth)
    for legacy in ("email_1", "mobile_1"):
        try:
            await db.users.drop_index(legacy)
        except Exception:
            pass
    try:
        await db.password_reset_tokens.drop_indexes()
    except Exception:
        pass

    # Clean any legacy documents that have no mobile field (they came from email-based auth
    # and would collide with the new unique index on mobile). Only wipe users with NO mobile —
    # never touch valid users.
    await db.users.delete_many({"$or": [{"mobile": None}, {"mobile": ""}, {"mobile": {"$exists": False}}]})

    # Seed super admin FIRST so at least one valid document exists before we build the unique index
    await seed_super_admin(db)

    # Now build indexes
    await db.users.create_index("mobile", unique=True)
    await db.otp_attempts.create_index("created_at")
    await db.shops.create_index("owner_id")
    await db.products.create_index("shop_id")
    await db.orders.create_index("consumer_id")

    # Perf indexes — hot query paths on the guest storefront (Feb 2026).
    # These accelerate /products/all, /products/tree filters and /orders/mine sort.
    await db.products.create_index("available")
    await db.products.create_index("primary_category")
    await db.products.create_index("secondary_category")
    await db.products.create_index([("available", 1), ("primary_category", 1)])
    await db.orders.create_index([("created_at", -1)])
    await db.orders.create_index([("consumer_id", 1), ("created_at", -1)])
    await db.banners.create_index([("enabled", 1), ("order", 1)])

    # Write test credentials file
    memory_dir = Path("/app/memory")
    memory_dir.mkdir(parents=True, exist_ok=True)
    creds_path = memory_dir / "test_credentials.md"
    creds_content = f"""# MonthlyGrocery Test Credentials

## Super Admin (pre-seeded)
- Mobile: `{os.environ.get('SUPER_ADMIN_MOBILE', '+919833833498')}`
- Name: `{os.environ.get('SUPER_ADMIN_NAME', 'Shashank Mohore')}`
- Role: `super_admin`
- Only this mobile can approve/suspend admins.

## Admin (self-signup, requires super admin approval)
- Any mobile can request admin access by choosing "Admin" during login and verifying OTP.
- Account starts with status="pending" and can't add/delete SKUs until Super Admin approves.

## Consumer (self-signup)
- Any mobile can sign up as consumer, auto-approved.

## Auth flow (OTP only, no passwords)
- POST /api/auth/send-otp {{mobile, role: "consumer"|"admin"}}
- POST /api/auth/verify-otp {{mobile, code, name?}}
- GET  /api/auth/me
- POST /api/auth/logout

## Base URL
- Backend: http://localhost:8001/api
- Frontend: {os.environ.get('FRONTEND_URL')}
"""
    creds_path.write_text(creds_content)
    logging.getLogger(__name__).info("MonthlyGrocery startup complete.")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
