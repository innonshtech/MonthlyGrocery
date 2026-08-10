"""
Banner (hero carousel) management routes.

- Public:  GET /api/banners/active  → enabled banners in-schedule, ordered.
- Super Admin CRUD under the /api/admin/banners prefix (registered via admin router
  in server.py — see below).
"""
from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, Request, HTTPException, Depends
from pydantic import BaseModel, Field
from bson import ObjectId

from auth import require_role, ROLE_SUPER_ADMIN
from audit import log_activity

router = APIRouter()
admin_router = APIRouter()


class BannerCreate(BaseModel):
    title: str
    subtitle: Optional[str] = ""
    tag: Optional[str] = ""
    image_url: Optional[str] = ""
    gradient: Optional[str] = ""     # CSS gradient fallback when no image
    icon: Optional[str] = ""         # single emoji shown on the banner
    cta_label: Optional[str] = ""
    cta_url: Optional[str] = ""
    order: int = 0
    enabled: bool = True
    start_at: Optional[str] = ""     # ISO string, empty = no start bound
    end_at: Optional[str] = ""       # ISO string, empty = no end bound


class BannerUpdate(BannerCreate):
    pass


class ReorderRequest(BaseModel):
    ids: List[str] = Field(default_factory=list)  # ordered list of banner ids (top-first)


def _banner_out(b: dict, include_internal: bool = False) -> dict:
    out = {
        "id": str(b["_id"]),
        "title": b.get("title", ""),
        "subtitle": b.get("subtitle", ""),
        "tag": b.get("tag", ""),
        "image_url": b.get("image_url", ""),
        "gradient": b.get("gradient", ""),
        "icon": b.get("icon", ""),
        "cta_label": b.get("cta_label", ""),
        "cta_url": b.get("cta_url", ""),
        "order": int(b.get("order", 0)),
        "enabled": bool(b.get("enabled", True)),
        "start_at": b.get("start_at", ""),
        "end_at": b.get("end_at", ""),
    }
    if include_internal:
        out["created_at"] = b.get("created_at", "")
        out["updated_at"] = b.get("updated_at", "")
    return out


def _in_schedule(b: dict) -> bool:
    now = datetime.now(timezone.utc).isoformat()
    start = (b.get("start_at") or "").strip()
    end = (b.get("end_at") or "").strip()
    if start and now < start:
        return False
    if end and now > end:
        return False
    return True


# ---------- Public ----------

@router.get("/active")
async def active_banners(request: Request):
    """Public feed of banners for the consumer carousel."""
    db = request.app.state.db
    docs = await db.banners.find({"enabled": True}).sort("order", 1).to_list(50)
    active = [d for d in docs if _in_schedule(d)]
    return {"banners": [_banner_out(d) for d in active]}


# ---------- Super Admin CRUD ----------

@admin_router.get("/banners")
async def list_all_banners(request: Request, user: dict = Depends(require_role(ROLE_SUPER_ADMIN))):
    db = request.app.state.db
    docs = await db.banners.find({}).sort("order", 1).to_list(200)
    return {"banners": [_banner_out(d, include_internal=True) for d in docs]}


@admin_router.post("/banners")
async def create_banner(payload: BannerCreate, request: Request, user: dict = Depends(require_role(ROLE_SUPER_ADMIN))):
    db = request.app.state.db
    now = datetime.now(timezone.utc).isoformat()
    # Determine order = next slot at the end unless explicit non-zero passed
    if not payload.order:
        last = await db.banners.find({}).sort("order", -1).limit(1).to_list(1)
        next_order = int(last[0].get("order", 0)) + 1 if last else 1
    else:
        next_order = int(payload.order)
    doc = {
        **payload.model_dump(),
        "order": next_order,
        "created_at": now,
        "updated_at": now,
        "created_by": user["id"],
    }
    result = await db.banners.insert_one(doc)
    doc["_id"] = result.inserted_id
    await log_activity(db, user, action="banner.create", resource_type="banner",
                       resource_id=str(result.inserted_id), resource_name=payload.title)
    return {"banner": _banner_out(doc, include_internal=True)}


@admin_router.put("/banners/{banner_id}")
async def update_banner(banner_id: str, payload: BannerUpdate, request: Request, user: dict = Depends(require_role(ROLE_SUPER_ADMIN))):
    db = request.app.state.db
    try:
        _id = ObjectId(banner_id)
    except Exception:
        raise HTTPException(status_code=404, detail="Banner not found")
    existing = await db.banners.find_one({"_id": _id})
    if not existing:
        raise HTTPException(status_code=404, detail="Banner not found")
    update = payload.model_dump()
    update["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.banners.update_one({"_id": _id}, {"$set": update})
    doc = await db.banners.find_one({"_id": _id})
    await log_activity(db, user, action="banner.update", resource_type="banner",
                       resource_id=banner_id, resource_name=payload.title)
    return {"banner": _banner_out(doc, include_internal=True)}


@admin_router.delete("/banners/{banner_id}")
async def delete_banner(banner_id: str, request: Request, user: dict = Depends(require_role(ROLE_SUPER_ADMIN))):
    db = request.app.state.db
    try:
        _id = ObjectId(banner_id)
    except Exception:
        raise HTTPException(status_code=404, detail="Banner not found")
    existing = await db.banners.find_one({"_id": _id})
    if not existing:
        raise HTTPException(status_code=404, detail="Banner not found")
    await db.banners.delete_one({"_id": _id})
    await log_activity(db, user, action="banner.delete", resource_type="banner",
                       resource_id=banner_id, resource_name=existing.get("title", ""))
    return {"success": True}


@admin_router.post("/banners/reorder")
async def reorder_banners(payload: ReorderRequest, request: Request, user: dict = Depends(require_role(ROLE_SUPER_ADMIN))):
    """Persist a new ordering. Ids are top-first; index 0 gets order=1."""
    db = request.app.state.db
    for idx, bid in enumerate(payload.ids):
        try:
            _id = ObjectId(bid)
        except Exception:
            continue
        await db.banners.update_one({"_id": _id}, {"$set": {"order": idx + 1}})
    await log_activity(db, user, action="banner.reorder", resource_type="banner",
                       resource_id="-", resource_name=f"{len(payload.ids)} items")
    return {"success": True}
