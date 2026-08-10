from datetime import datetime, timezone
from fastapi import APIRouter, Request, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List
from bson import ObjectId

from auth import get_current_user, require_role, require_approved_admin, ROLE_SUPER_ADMIN

router = APIRouter()


class ShopUpsert(BaseModel):
    shop_name: str
    owner_name: Optional[str] = ""
    mobile: Optional[str] = ""
    email: Optional[str] = ""
    gst_number: Optional[str] = ""
    address: Optional[str] = ""
    city: Optional[str] = ""
    pincode: Optional[str] = ""
    state: Optional[str] = ""
    category: Optional[str] = "Grocery"
    shop_timing: Optional[str] = "9:00 AM - 9:00 PM"
    delivery_radius: Optional[float] = 5.0
    logo_url: Optional[str] = ""
    banner_url: Optional[str] = ""
    description: Optional[str] = ""
    whatsapp: Optional[str] = ""
    instagram: Optional[str] = ""
    facebook: Optional[str] = ""
    website: Optional[str] = ""
    photos: Optional[List[str]] = []


def _shop_out(s: dict) -> dict:
    return {
        "id": str(s["_id"]),
        "owner_id": s.get("owner_id"),
        "shop_name": s.get("shop_name", ""),
        "owner_name": s.get("owner_name", ""),
        "mobile": s.get("mobile", ""),
        "email": s.get("email", ""),
        "gst_number": s.get("gst_number", ""),
        "address": s.get("address", ""),
        "city": s.get("city", ""),
        "pincode": s.get("pincode", ""),
        "state": s.get("state", ""),
        "category": s.get("category", ""),
        "shop_timing": s.get("shop_timing", ""),
        "delivery_radius": s.get("delivery_radius", 5.0),
        "logo_url": s.get("logo_url", ""),
        "banner_url": s.get("banner_url", ""),
        "description": s.get("description", ""),
        "whatsapp": s.get("whatsapp", ""),
        "instagram": s.get("instagram", ""),
        "facebook": s.get("facebook", ""),
        "website": s.get("website", ""),
        "photos": s.get("photos", []),
        "status": s.get("status", "pending"),  # pending | approved | suspended
        "rating": s.get("rating", 4.5),
        "created_at": s.get("created_at"),
    }


@router.get("/mine")
async def my_shop(request: Request, user: dict = Depends(require_role("admin", "super_admin"))):
    db = request.app.state.db
    shop = await db.shops.find_one({})
    if not shop:
        return {"shop": None}
    return {"shop": _shop_out(shop)}


@router.post("/mine")
async def upsert_my_shop(payload: ShopUpsert, request: Request, user: dict = Depends(require_approved_admin())):
    db = request.app.state.db
    existing = await db.shops.find_one({"owner_id": user["id"]})
    data = payload.model_dump()
    if existing:
        await db.shops.update_one({"_id": existing["_id"]}, {"$set": data})
        shop = await db.shops.find_one({"_id": existing["_id"]})
    else:
        data["owner_id"] = user["id"]
        data["status"] = "approved"  # auto-approve for MVP; admin can suspend
        data["rating"] = 4.5
        data["created_at"] = datetime.now(timezone.utc).isoformat()
        result = await db.shops.insert_one(data)
        shop = await db.shops.find_one({"_id": result.inserted_id})
    return {"shop": _shop_out(shop)}


@router.get("/")
async def list_shops(request: Request, city: Optional[str] = None, q: Optional[str] = None):
    db = request.app.state.db
    query = {"status": "approved"}
    if city:
        query["city"] = {"$regex": f"^{city}$", "$options": "i"}
    if q:
        query["$or"] = [
            {"shop_name": {"$regex": q, "$options": "i"}},
            {"category": {"$regex": q, "$options": "i"}},
        ]
    shops = await db.shops.find(query).to_list(200)
    return {"shops": [_shop_out(s) for s in shops]}


@router.get("/{shop_id}")
async def get_shop(shop_id: str, request: Request):
    db = request.app.state.db
    try:
        shop = await db.shops.find_one({"_id": ObjectId(shop_id)})
    except Exception:
        raise HTTPException(status_code=404, detail="Shop not found")
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")
    return {"shop": _shop_out(shop)}
