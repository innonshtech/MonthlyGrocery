import os
import re
import jwt
from datetime import datetime, timezone, timedelta
from fastapi import Request, HTTPException, Depends
from bson import ObjectId

JWT_ALGORITHM = "HS256"

# Roles
ROLE_CONSUMER = "consumer"
ROLE_ADMIN = "admin"
ROLE_SUPER_ADMIN = "super_admin"

# Status
STATUS_PENDING = "pending"
STATUS_APPROVED = "approved"
STATUS_SUSPENDED = "suspended"


def get_jwt_secret() -> str:
    return os.environ["JWT_SECRET"]


def normalize_mobile(raw: str) -> str:
    """Normalize a mobile number to E.164 (+91XXXXXXXXXX for India default)."""
    if not raw:
        raise HTTPException(status_code=400, detail="Mobile number required")
    s = re.sub(r"\s|-", "", raw.strip())
    if s.startswith("+"):
        digits = re.sub(r"\D", "", s)
        return "+" + digits
    digits = re.sub(r"\D", "", s)
    if len(digits) == 10:  # bare 10-digit → assume India
        return "+91" + digits
    if digits.startswith("91") and len(digits) == 12:
        return "+" + digits
    if digits.startswith("0") and len(digits) == 11:
        return "+91" + digits[1:]
    return "+" + digits


def create_access_token(user_id: str, mobile: str, role: str, status: str) -> str:
    payload = {
        "sub": user_id,
        "mobile": mobile,
        "role": role,
        "status": status,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=60 * 24),
        "type": "access",
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)


def set_auth_cookie(response, access_token: str):
    response.set_cookie(
        key="access_token", value=access_token,
        httponly=True, secure=True, samesite="none",
        max_age=60 * 60 * 24, path="/",
    )


def clear_auth_cookie(response):
    response.delete_cookie("access_token", path="/")


async def get_current_user(request: Request) -> dict:
    db = request.app.state.db
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        user["id"] = str(user.pop("_id"))
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Session expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


def require_role(*roles):
    async def checker(user: dict = Depends(get_current_user)):
        if user.get("role") not in roles:
            raise HTTPException(status_code=403, detail="Not authorized")
        return user
    return checker


def require_approved_admin():
    """Admin OR super_admin, and status must be approved."""
    async def checker(user: dict = Depends(get_current_user)):
        role = user.get("role")
        if role not in (ROLE_ADMIN, ROLE_SUPER_ADMIN):
            raise HTTPException(status_code=403, detail="Admin access required")
        if user.get("status") != STATUS_APPROVED:
            raise HTTPException(status_code=403, detail="Your admin account is pending Super Admin approval.")
        return user
    return checker


async def seed_super_admin(db):
    """Seed the single Super Admin (Shashank Mohore) and ensure the MonthlyGrocery storefront is owned by them."""
    from datetime import datetime, timezone
    sa_mobile = os.environ.get("SUPER_ADMIN_MOBILE", "+919833833498")
    sa_name = os.environ.get("SUPER_ADMIN_NAME", "Shashank Mohore")

    existing = await db.users.find_one({"mobile": sa_mobile})
    if existing is None:
        result = await db.users.insert_one({
            "mobile": sa_mobile,
            "name": sa_name,
            "role": ROLE_SUPER_ADMIN,
            "status": STATUS_APPROVED,
            "address": "",
            "city": "",
            "pincode": "",
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        sa_id = str(result.inserted_id)
    else:
        sa_id = str(existing["_id"])
        # Ensure role/status/name stay correct
        await db.users.update_one(
            {"_id": existing["_id"]},
            {"$set": {"role": ROLE_SUPER_ADMIN, "status": STATUS_APPROVED, "name": sa_name}},
        )

    # Ensure a single storefront exists and is owned by super admin
    any_shop = await db.shops.find_one({})
    if any_shop:
        if any_shop.get("owner_id") != sa_id:
            await db.shops.update_one(
                {"_id": any_shop["_id"]},
                {"$set": {"owner_id": sa_id, "status": "approved", "shop_name": "MonthlyGrocery"}},
            )
    else:
        await db.shops.insert_one({
            "owner_id": sa_id,
            "shop_name": "MonthlyGrocery",
            "owner_name": sa_name,
            "mobile": sa_mobile,
            "email": "",
            "gst_number": "",
            "address": "",
            "city": "",
            "pincode": "",
            "state": "",
            "category": "Grocery",
            "shop_timing": "9:00 AM - 9:00 PM",
            "delivery_radius": 25.0,
            "logo_url": "",
            "banner_url": "https://images.unsplash.com/photo-1580913428023-02c695666d61?w=1200&q=80",
            "description": "Monthly groceries delivered home within 4 hours. Save upto 20%. Minimum order ₹2,500.",
            "whatsapp": "",
            "instagram": "",
            "facebook": "",
            "website": "",
            "photos": [],
            "status": "approved",
            "rating": 4.8,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
