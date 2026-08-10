from fastapi import APIRouter, Request, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from bson import ObjectId

from auth import require_role

router = APIRouter()


class CategoryCreate(BaseModel):
    name: str
    parent: Optional[str] = ""
    icon_url: Optional[str] = ""
    display_order: Optional[int] = 0
    enabled: Optional[bool] = True


def _cat_out(c: dict) -> dict:
    return {
        "id": str(c["_id"]),
        "name": c.get("name", ""),
        "parent": c.get("parent", ""),
        "icon_url": c.get("icon_url", ""),
        "display_order": c.get("display_order", 0),
        "enabled": c.get("enabled", True),
        "shop_id": c.get("shop_id", ""),
    }


@router.get("/mine")
async def list_my_categories(request: Request, user: dict = Depends(require_role("merchant"))):
    db = request.app.state.db
    shop = await db.shops.find_one({"owner_id": user["id"]})
    if not shop:
        return {"categories": []}
    cats = await db.categories.find({"shop_id": str(shop["_id"])}).sort("display_order", 1).to_list(500)
    return {"categories": [_cat_out(c) for c in cats]}


@router.post("/mine")
async def create_category(payload: CategoryCreate, request: Request, user: dict = Depends(require_role("merchant"))):
    db = request.app.state.db
    shop = await db.shops.find_one({"owner_id": user["id"]})
    if not shop:
        raise HTTPException(status_code=400, detail="Create shop profile first")
    data = payload.model_dump()
    data["shop_id"] = str(shop["_id"])
    result = await db.categories.insert_one(data)
    doc = await db.categories.find_one({"_id": result.inserted_id})
    return {"category": _cat_out(doc)}


@router.delete("/mine/{cat_id}")
async def delete_category(cat_id: str, request: Request, user: dict = Depends(require_role("merchant"))):
    db = request.app.state.db
    shop = await db.shops.find_one({"owner_id": user["id"]})
    try:
        _id = ObjectId(cat_id)
    except Exception:
        raise HTTPException(status_code=404, detail="Category not found")
    result = await db.categories.delete_one({"_id": _id, "shop_id": str(shop["_id"])})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Category not found")
    return {"success": True}


# Public: platform-wide top categories (aggregate)
@router.get("/platform")
async def platform_categories(request: Request):
    db = request.app.state.db
    pipeline = [
        {"$match": {"available": True}},
        {"$group": {"_id": "$category", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 12},
    ]
    docs = await db.products.aggregate(pipeline).to_list(20)
    return {"categories": [{"name": d["_id"] or "General", "count": d["count"]} for d in docs if d["_id"]]}
