from datetime import datetime, timezone
from fastapi import APIRouter, Request, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List, Dict
from bson import ObjectId
import random
import string
import re

from auth import get_current_user, require_role, ROLE_CONSUMER, ROLE_ADMIN, ROLE_SUPER_ADMIN

router = APIRouter()


class CheckoutRequest(BaseModel):
    address: str
    city: Optional[str] = ""
    pincode: str
    landmark: str
    phone: str
    delivery_slot: Optional[str] = "Within 4 hours"
    special_instructions: Optional[str] = ""
    payment_method: str = "COD"


VALID_STATUSES = ["placed", "accepted", "rejected", "preparing", "packed", "ready", "out_for_delivery", "delivered", "cancelled", "refunded"]


class StatusUpdate(BaseModel):
    status: str


def _order_out(o: dict) -> dict:
    return {
        "id": str(o["_id"]),
        "order_number": o.get("order_number", ""),
        "consumer_id": o.get("consumer_id"),
        "consumer_name": o.get("consumer_name", ""),
        "consumer_phone": o.get("consumer_phone", ""),
        "shop_name": o.get("shop_name", "MonthlyGrocery"),
        "items": o.get("items", []),
        "mrp_total": o.get("mrp_total", 0),
        "subtotal": o.get("subtotal", 0),
        "savings": o.get("savings", 0),
        "savings_percent": o.get("savings_percent", 0),
        "delivery_fee": o.get("delivery_fee", 0),
        "platform_fee": o.get("platform_fee", 0),
        "gst": o.get("gst", 0),
        "total": o.get("total", 0),
        "address": o.get("address", ""),
        "city": o.get("city", ""),
        "pincode": o.get("pincode", ""),
        "landmark": o.get("landmark", ""),
        "delivery_slot": o.get("delivery_slot", ""),
        "special_instructions": o.get("special_instructions", ""),
        "payment_method": o.get("payment_method", "COD"),
        "status": o.get("status", "placed"),
        "delivery_otp": o.get("delivery_otp", ""),
        "created_at": o.get("created_at"),
        "status_history": o.get("status_history", []),
    }


def _gen_order_number() -> str:
    return "MM" + "".join(random.choices(string.digits, k=8))


def _gen_otp() -> str:
    return "".join(random.choices(string.digits, k=4))


@router.post("/checkout")
async def checkout(payload: CheckoutRequest, request: Request, user: dict = Depends(require_role(ROLE_CONSUMER))):
    db = request.app.state.db
    # Validate required address fields for reliable Indian logistics
    address = (payload.address or "").strip()
    landmark = (payload.landmark or "").strip()
    pincode = re.sub(r"\D", "", payload.pincode or "")
    if not address:
        raise HTTPException(status_code=400, detail="Exact address is required")
    if not landmark:
        raise HTTPException(status_code=400, detail="Nearest landmark is required")
    if len(pincode) != 6:
        raise HTTPException(status_code=400, detail="Enter a valid 6-digit PIN code")

    cart = await db.carts.find_one({"user_id": user["id"]})
    if not cart or not cart.get("items"):
        raise HTTPException(status_code=400, detail="Cart is empty")

    hydrated_items = []
    subtotal = 0.0
    mrp_total = 0.0
    shop_name = "MonthlyGrocery"
    # Batch-fetch all products in a single query to eliminate the N+1 pattern.
    product_object_ids = []
    for item in cart["items"]:
        try:
            product_object_ids.append(ObjectId(item["product_id"]))
        except Exception:
            continue
    products_by_id = {}
    if product_object_ids:
        cursor = db.products.find(
            {"_id": {"$in": product_object_ids}},
            {"name": 1, "image_url": 1, "unit": 1, "brand": 1, "price": 1, "mrp": 1, "shop_name": 1},
        )
        async for p in cursor:
            products_by_id[str(p["_id"])] = p

    for item in cart["items"]:
        p = products_by_id.get(str(item.get("product_id", "")))
        if not p:
            continue
        price = float(p.get("price", 0))
        mrp = float(p.get("mrp", 0)) or price
        qty = int(item["quantity"])
        line_total = price * qty
        line_mrp = mrp * qty
        subtotal += line_total
        mrp_total += line_mrp
        shop_name = p.get("shop_name", "MonthlyGrocery")
        hydrated_items.append({
            "product_id": str(p["_id"]),
            "name": p.get("name", ""),
            "image_url": p.get("image_url", ""),
            "unit": p.get("unit", ""),
            "brand": p.get("brand", ""),
            "price": price,
            "mrp": mrp,
            "quantity": qty,
            "line_total": line_total,
            "line_mrp": line_mrp,
        })

    if not hydrated_items:
        raise HTTPException(status_code=400, detail="No valid items")

    MIN_ORDER = 2500.0
    if round(subtotal, 2) < MIN_ORDER:
        raise HTTPException(status_code=400, detail=f"Minimum order value is ₹{int(MIN_ORDER)}. Your cart is ₹{subtotal:.0f}.")

    subtotal = round(subtotal, 2)
    mrp_total = round(mrp_total, 2)
    savings = round(mrp_total - subtotal, 2)
    savings_percent = round((savings / mrp_total) * 100) if mrp_total > 0 else 0
    delivery_fee = 0.0
    platform_fee = 0.0
    gst = round(subtotal * 0.05, 2)
    total = round(subtotal + delivery_fee + platform_fee + gst, 2)
    now = datetime.now(timezone.utc).isoformat()

    doc = {
        "order_number": _gen_order_number(),
        "consumer_id": user["id"],
        "consumer_name": user.get("name", ""),
        "consumer_phone": payload.phone,
        "shop_name": shop_name,
        "items": hydrated_items,
        "mrp_total": mrp_total,
        "subtotal": subtotal,
        "savings": savings,
        "savings_percent": savings_percent,
        "delivery_fee": delivery_fee,
        "platform_fee": platform_fee,
        "gst": gst,
        "total": total,
        "address": payload.address,
        "city": payload.city,
        "pincode": pincode,
        "landmark": landmark,
        "delivery_slot": payload.delivery_slot,
        "special_instructions": payload.special_instructions,
        "payment_method": payload.payment_method,
        "status": "placed",
        "delivery_otp": _gen_otp(),
        "created_at": now,
        "status_history": [{"status": "placed", "at": now}],
    }
    result = await db.orders.insert_one(doc)
    doc["_id"] = result.inserted_id
    await db.carts.update_one({"user_id": user["id"]}, {"$set": {"items": []}})

    # Consumer confirmation SMS via Twilio (best-effort)
    try:
        from audit import queue_sms
        name = (user.get("name") or "").strip() or "Customer"
        body = (
            f"Namaste {name}! Aapka MonthlyGrocery order "
            f"#{doc['order_number']} confirm ho gaya. Total ₹{doc['total']}. "
            f"Delivery slot: {doc.get('delivery_slot','TBA')}. Track: monthlygrocery.in/orders"
        )
        await queue_sms(db, to=payload.phone or user.get("mobile"), body=body,
                        purpose="order_placed",
                        recipient={"name": name, "role": "consumer"})
    except Exception:
        pass

    return {"order": _order_out(doc)}


@router.get("/mine")
async def my_orders(request: Request, user: dict = Depends(get_current_user)):
    db = request.app.state.db
    role = user.get("role")
    if role == ROLE_CONSUMER:
        orders = await db.orders.find({"consumer_id": user["id"]}).sort("created_at", -1).to_list(200)
    elif role in (ROLE_ADMIN, ROLE_SUPER_ADMIN):
        orders = await db.orders.find({}).sort("created_at", -1).to_list(500)
    else:
        orders = []
    return {"orders": [_order_out(o) for o in orders]}


@router.get("/{order_id}")
async def get_order(order_id: str, request: Request, user: dict = Depends(get_current_user)):
    db = request.app.state.db
    try:
        o = await db.orders.find_one({"_id": ObjectId(order_id)})
    except Exception:
        raise HTTPException(status_code=404, detail="Order not found")
    if not o:
        raise HTTPException(status_code=404, detail="Order not found")
    role = user.get("role")
    if role == ROLE_CONSUMER and o.get("consumer_id") != user["id"]:
        raise HTTPException(status_code=403, detail="Forbidden")
    return {"order": _order_out(o)}


@router.post("/{order_id}/status")
async def update_status(order_id: str, payload: StatusUpdate, request: Request, user: dict = Depends(get_current_user)):
    db = request.app.state.db
    if payload.status not in VALID_STATUSES:
        raise HTTPException(status_code=400, detail="Invalid status")
    try:
        o = await db.orders.find_one({"_id": ObjectId(order_id)})
    except Exception:
        raise HTTPException(status_code=404, detail="Order not found")
    if not o:
        raise HTTPException(status_code=404, detail="Order not found")
    role = user.get("role")
    if role == ROLE_CONSUMER:
        if o.get("consumer_id") != user["id"] or payload.status != "cancelled":
            raise HTTPException(status_code=403, detail="Consumers can only cancel their own orders")
    elif role not in (ROLE_ADMIN, ROLE_SUPER_ADMIN):
        raise HTTPException(status_code=403, detail="Forbidden")
    else:
        # Admin must be approved
        if user.get("status") != "approved":
            raise HTTPException(status_code=403, detail="Your admin account is pending approval")
    now = datetime.now(timezone.utc).isoformat()
    history = o.get("status_history", [])
    history.append({"status": payload.status, "at": now})
    await db.orders.update_one({"_id": o["_id"]}, {"$set": {"status": payload.status, "status_history": history}})
    o["status"] = payload.status
    o["status_history"] = history
    return {"order": _order_out(o)}
