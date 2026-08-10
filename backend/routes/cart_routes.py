from fastapi import APIRouter, Request, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List
from bson import ObjectId

from auth import require_role, ROLE_CONSUMER

router = APIRouter()


class CartAddItem(BaseModel):
    product_id: str
    quantity: int = 1
    city: Optional[str] = None


class CartUpdateItem(BaseModel):
    product_id: str
    quantity: int
    city: Optional[str] = None


class CartCityUpdate(BaseModel):
    city: str


class GuestCartItem(BaseModel):
    product_id: str
    quantity: int = 1


class GuestCartHydrate(BaseModel):
    items: List[GuestCartItem] = []
    city: Optional[str] = ""


class GuestCartMerge(BaseModel):
    items: List[GuestCartItem] = []
    city: Optional[str] = ""


async def _get_cart(db, user_id: str):
    cart = await db.carts.find_one({"user_id": user_id})
    if not cart:
        cart = {"user_id": user_id, "items": [], "city": ""}
        await db.carts.insert_one(cart)
    return cart


async def _apply_city(db, cart: dict, city: Optional[str]):
    """If the caller passed a city, persist it. If it changed, wipe cart items to avoid mixed-city pricing."""
    if city is None:
        return cart
    incoming = str(city).strip()
    if not incoming:
        return cart
    if cart.get("city") != incoming:
        await db.carts.update_one(
            {"user_id": cart["user_id"]},
            {"$set": {"city": incoming, "items": []}},
            upsert=True,
        )
        cart["city"] = incoming
        cart["items"] = []
    return cart


async def _hydrate_cart(db, cart: dict):
    hydrated = []
    subtotal = 0.0
    mrp_total = 0.0
    city = (cart.get("city") or "").strip()
    items = cart.get("items", [])
    # Batch fetch products to avoid N+1 queries.
    product_object_ids = []
    for item in items:
        try:
            product_object_ids.append(ObjectId(item["product_id"]))
        except Exception:
            continue
    products_by_id = {}
    if product_object_ids:
        cursor = db.products.find(
            {"_id": {"$in": product_object_ids}},
            {
                "name": 1, "image_url": 1, "unit": 1, "brand": 1,
                "primary_category": 1, "secondary_category": 1,
                "price": 1, "mrp": 1, "city_prices": 1,
            },
        )
        async for p in cursor:
            products_by_id[str(p["_id"])] = p
    for item in items:
        p = products_by_id.get(str(item.get("product_id", "")))
        if not p:
            continue
        # Prefer city-specific pricing when the user has a city set.
        city_prices = p.get("city_prices", {}) or {}
        cp = city_prices.get(city) if city else None
        if cp and cp.get("is_live", True):
            price = float(cp.get("price", 0) or 0)
            mrp = float(cp.get("mrp", 0) or 0) or price
        else:
            price = float(p.get("price", 0) or 0)
            mrp = float(p.get("mrp", 0) or 0) or price
        qty = int(item["quantity"])
        line_total = price * qty
        line_mrp = mrp * qty
        subtotal += line_total
        mrp_total += line_mrp
        hydrated.append({
            "product_id": str(p["_id"]),
            "name": p.get("name", ""),
            "image_url": p.get("image_url", ""),
            "unit": p.get("unit", ""),
            "brand": p.get("brand", ""),
            "primary_category": p.get("primary_category", ""),
            "secondary_category": p.get("secondary_category", ""),
            "price": price,
            "mrp": mrp,
            "quantity": qty,
            "line_total": line_total,
            "line_mrp": line_mrp,
            "line_savings": round(line_mrp - line_total, 2),
        })
    savings = round(mrp_total - subtotal, 2)
    delivery_fee = 0.0
    platform_fee = 0.0
    total = subtotal + delivery_fee + platform_fee
    return {
        "items": hydrated,
        "city": city,
        "mrp_total": round(mrp_total, 2),
        "subtotal": round(subtotal, 2),
        "savings": savings,
        "savings_percent": round((savings / mrp_total) * 100) if mrp_total > 0 else 0,
        "delivery_fee": delivery_fee,
        "platform_fee": platform_fee,
        "total": round(total, 2),
        "min_order": 2500.0,
    }


@router.get("/")
async def get_cart(request: Request, city: Optional[str] = None, user: dict = Depends(require_role(ROLE_CONSUMER))):
    db = request.app.state.db
    cart = await _get_cart(db, user["id"])
    cart = await _apply_city(db, cart, city)
    return await _hydrate_cart(db, cart)


@router.post("/set-city")
async def set_city(payload: CartCityUpdate, request: Request, user: dict = Depends(require_role(ROLE_CONSUMER))):
    db = request.app.state.db
    cart = await _get_cart(db, user["id"])
    cart = await _apply_city(db, cart, payload.city)
    return await _hydrate_cart(db, cart)


@router.post("/add")
async def add_to_cart(payload: CartAddItem, request: Request, user: dict = Depends(require_role(ROLE_CONSUMER))):
    db = request.app.state.db
    cart = await _get_cart(db, user["id"])
    cart = await _apply_city(db, cart, payload.city)
    items = cart.get("items", [])
    found = False
    for it in items:
        if it["product_id"] == payload.product_id:
            it["quantity"] = it["quantity"] + payload.quantity
            found = True
            break
    if not found:
        items.append({"product_id": payload.product_id, "quantity": payload.quantity})
    await db.carts.update_one({"user_id": user["id"]}, {"$set": {"items": items}})
    cart["items"] = items
    return await _hydrate_cart(db, cart)


@router.post("/update")
async def update_cart(payload: CartUpdateItem, request: Request, user: dict = Depends(require_role(ROLE_CONSUMER))):
    db = request.app.state.db
    cart = await _get_cart(db, user["id"])
    cart = await _apply_city(db, cart, payload.city)
    items = [it for it in cart.get("items", []) if it["product_id"] != payload.product_id]
    if payload.quantity > 0:
        items.append({"product_id": payload.product_id, "quantity": payload.quantity})
    await db.carts.update_one({"user_id": user["id"]}, {"$set": {"items": items}})
    cart["items"] = items
    return await _hydrate_cart(db, cart)


@router.post("/clear")
async def clear_cart(request: Request, user: dict = Depends(require_role(ROLE_CONSUMER))):
    db = request.app.state.db
    await db.carts.update_one({"user_id": user["id"]}, {"$set": {"items": []}}, upsert=True)
    cart = await _get_cart(db, user["id"])
    return await _hydrate_cart(db, cart)


@router.post("/hydrate")
async def hydrate_guest_cart(payload: GuestCartHydrate, request: Request):
    """Public endpoint: hydrate a guest cart from localStorage items."""
    db = request.app.state.db
    cart = {
        "user_id": "__guest__",
        "items": [{"product_id": it.product_id, "quantity": int(it.quantity)} for it in payload.items if int(it.quantity) > 0],
        "city": (payload.city or "").strip(),
    }
    return await _hydrate_cart(db, cart)


@router.post("/merge")
async def merge_guest_cart(payload: GuestCartMerge, request: Request, user: dict = Depends(require_role(ROLE_CONSUMER))):
    """Merge a guest cart (from localStorage) into the authenticated user's cart.
    Existing lines are additively topped up; new items are appended."""
    db = request.app.state.db
    cart = await _get_cart(db, user["id"])
    incoming_city = (payload.city or "").strip()
    if incoming_city:
        cart = await _apply_city(db, cart, incoming_city)
    items = list(cart.get("items", []))
    by_id = {it["product_id"]: it for it in items}
    for it in payload.items:
        qty = int(it.quantity)
        if qty <= 0:
            continue
        if it.product_id in by_id:
            by_id[it.product_id]["quantity"] = by_id[it.product_id]["quantity"] + qty
        else:
            new_line = {"product_id": it.product_id, "quantity": qty}
            items.append(new_line)
            by_id[it.product_id] = new_line
    await db.carts.update_one({"user_id": user["id"]}, {"$set": {"items": items}}, upsert=True)
    cart["items"] = items
    return await _hydrate_cart(db, cart)
