import os
from fastapi import APIRouter, Request, HTTPException, Depends
from pydantic import BaseModel
from bson import ObjectId
from datetime import datetime, timezone, timedelta

from auth import require_role, ROLE_SUPER_ADMIN, ROLE_ADMIN, STATUS_PENDING, STATUS_APPROVED, STATUS_SUSPENDED

router = APIRouter()


class ApproveRequest(BaseModel):
    status: str  # approved | suspended | pending


class CreateAdminRequest(BaseModel):
    mobile: str
    name: str = ""


def _user_row(u: dict) -> dict:
    return {
        "id": str(u["_id"]),
        "mobile": u.get("mobile", ""),
        "name": u.get("name", ""),
        "role": u.get("role", ""),
        "status": u.get("status", ""),
        "created_at": u.get("created_at"),
    }


@router.get("/admins")
async def list_admins(request: Request, user: dict = Depends(require_role(ROLE_SUPER_ADMIN))):
    """List all admin & super_admin accounts."""
    db = request.app.state.db
    users = await db.users.find({"role": {"$in": [ROLE_ADMIN, ROLE_SUPER_ADMIN]}}).sort("created_at", -1).to_list(500)
    return {"admins": [_user_row(u) for u in users]}


@router.post("/admins")
async def create_admin(payload: CreateAdminRequest, request: Request, user: dict = Depends(require_role(ROLE_SUPER_ADMIN))):
    """Super Admin whitelists a mobile number as an admin. That user can then log in via OTP.
    Fires a Twilio welcome SMS on success (best-effort — never blocks admin creation)."""
    from auth import normalize_mobile
    from datetime import datetime, timezone
    from audit import log_activity, queue_sms

    mobile = normalize_mobile(payload.mobile)
    db = request.app.state.db
    existing = await db.users.find_one({"mobile": mobile})
    if existing:
        if existing.get("role") == ROLE_SUPER_ADMIN:
            raise HTTPException(status_code=400, detail="This mobile is the Super Admin account.")
        if existing.get("role") == ROLE_ADMIN:
            raise HTTPException(status_code=400, detail="This mobile is already registered as an admin.")
        # Promote existing consumer to admin
        await db.users.update_one(
            {"_id": existing["_id"]},
            {"$set": {"role": ROLE_ADMIN, "status": STATUS_APPROVED, "name": payload.name.strip() or existing.get("name", "")}}
        )
        doc = await db.users.find_one({"_id": existing["_id"]})
        note = "Existing consumer promoted to admin."
    else:
        # Fresh whitelist entry
        doc = {
            "mobile": mobile,
            "name": (payload.name or "").strip(),
            "role": ROLE_ADMIN,
            "status": STATUS_APPROVED,
            "address": "",
            "city": "",
            "pincode": "",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "created_by": user["id"],
        }
        result = await db.users.insert_one(doc)
        doc["_id"] = result.inserted_id
        note = None

    # Fire welcome SMS via Twilio (best effort)
    welcome_name = doc.get("name") or "MonthlyGrocery Admin"
    body = (
        f"Namaste {welcome_name}! Aap ab MonthlyGrocery admin ho. "
        f"Login karo: https://monthlygrocery.in/login (mobile + OTP)."
    )
    sms_result = await queue_sms(db, to=mobile, body=body, purpose="admin_welcome",
                                 recipient={"name": doc.get("name", ""), "role": ROLE_ADMIN})

    # Audit
    await log_activity(db, user, action="admin.create", resource_type="user",
                       resource_id=str(doc["_id"]), resource_name=doc.get("name") or mobile,
                       metadata={"mobile": mobile, "sms_sent": sms_result.get("sent", False)})

    response = {"admin": _user_row(doc), "sms": sms_result}
    if note:
        response["note"] = note
    return response


@router.delete("/admins/{admin_id}")
async def delete_admin(admin_id: str, request: Request, user: dict = Depends(require_role(ROLE_SUPER_ADMIN))):
    """Revoke an admin entirely (deletes the user)."""
    from audit import log_activity
    db = request.app.state.db
    try:
        _id = ObjectId(admin_id)
    except Exception:
        raise HTTPException(status_code=404, detail="Admin not found")
    target = await db.users.find_one({"_id": _id})
    if not target:
        raise HTTPException(status_code=404, detail="Admin not found")
    if target.get("role") == ROLE_SUPER_ADMIN:
        raise HTTPException(status_code=400, detail="Cannot delete the Super Admin account")
    await db.users.delete_one({"_id": _id})
    await log_activity(db, user, action="admin.delete", resource_type="user",
                       resource_id=str(_id), resource_name=target.get("name") or target.get("mobile"),
                       metadata={"mobile": target.get("mobile")})
    return {"success": True}


# ---------- Activity log & notifications outbox (Super Admin only) ----------

@router.get("/activity")
async def activity_log(request: Request, limit: int = 200, user: dict = Depends(require_role(ROLE_SUPER_ADMIN))):
    """Everything that admins & super_admin have done — most recent first."""
    db = request.app.state.db
    docs = await db.audit_log.find({}).sort("created_at", -1).limit(int(limit)).to_list(int(limit))
    return {"entries": [{
        "id": str(d["_id"]),
        "actor_id": d.get("actor_id"),
        "actor_mobile": d.get("actor_mobile"),
        "actor_name": d.get("actor_name", ""),
        "actor_role": d.get("actor_role", ""),
        "action": d.get("action"),
        "resource_type": d.get("resource_type"),
        "resource_id": d.get("resource_id"),
        "resource_name": d.get("resource_name", ""),
        "metadata": d.get("metadata", {}),
        "created_at": d.get("created_at"),
    } for d in docs]}


@router.get("/notifications-outbox")
async def notifications_outbox(request: Request, limit: int = 200, user: dict = Depends(require_role(ROLE_SUPER_ADMIN))):
    """Every SMS MonthlyGrocery has attempted to send — success or failure."""
    db = request.app.state.db
    docs = await db.notifications_outbox.find({}).sort("created_at", -1).limit(int(limit)).to_list(int(limit))
    return {"messages": [{
        "id": str(d["_id"]),
        "to": d.get("to"),
        "channel": d.get("channel", "sms"),
        "purpose": d.get("purpose"),
        "body": d.get("body", ""),
        "sent": bool(d.get("sent", False)),
        "twilio_sid": d.get("twilio_sid", ""),
        "error": d.get("error", ""),
        "recipient_name": d.get("recipient_name", ""),
        "recipient_role": d.get("recipient_role", ""),
        "created_at": d.get("created_at"),
    } for d in docs]}


@router.post("/admins/{admin_id}/status")
async def update_admin_status(admin_id: str, payload: ApproveRequest, request: Request, user: dict = Depends(require_role(ROLE_SUPER_ADMIN))):
    if payload.status not in (STATUS_APPROVED, STATUS_SUSPENDED, STATUS_PENDING):
        raise HTTPException(status_code=400, detail="Invalid status")
    db = request.app.state.db
    try:
        _id = ObjectId(admin_id)
    except Exception:
        raise HTTPException(status_code=404, detail="Admin not found")
    target = await db.users.find_one({"_id": _id})
    if not target:
        raise HTTPException(status_code=404, detail="Admin not found")
    if target.get("role") == ROLE_SUPER_ADMIN:
        raise HTTPException(status_code=400, detail="Cannot modify the Super Admin account")
    if target.get("role") != ROLE_ADMIN:
        raise HTTPException(status_code=400, detail="Only admin accounts can be approved")
    await db.users.update_one({"_id": _id}, {"$set": {"status": payload.status}})
    return {"success": True, "status": payload.status}


@router.get("/stats")
async def platform_stats(request: Request, user: dict = Depends(require_role(ROLE_SUPER_ADMIN, ROLE_ADMIN))):
    db = request.app.state.db
    pending_admins = await db.users.count_documents({"role": ROLE_ADMIN, "status": STATUS_PENDING})
    approved_admins = await db.users.count_documents({"role": ROLE_ADMIN, "status": STATUS_APPROVED})
    total_products = await db.products.count_documents({})
    total_consumers = await db.users.count_documents({"role": "consumer"})
    total_orders = await db.orders.count_documents({})
    revenue_pipeline = [{"$match": {"status": {"$in": ["delivered", "out_for_delivery"]}}},
                        {"$group": {"_id": None, "total": {"$sum": "$total"}}}]
    revenue_docs = await db.orders.aggregate(revenue_pipeline).to_list(1)
    revenue = revenue_docs[0]["total"] if revenue_docs else 0
    return {
        "pending_admins": pending_admins,
        "approved_admins": approved_admins,
        "total_products": total_products,
        "total_consumers": total_consumers,
        "total_orders": total_orders,
        "total_revenue": round(revenue, 2),
    }


@router.get("/orders/recent")
async def recent_orders(request: Request, user: dict = Depends(require_role(ROLE_SUPER_ADMIN, ROLE_ADMIN))):
    db = request.app.state.db
    orders = await db.orders.find({}).sort("created_at", -1).limit(20).to_list(20)
    return {"orders": [{
        "id": str(o["_id"]),
        "order_number": o.get("order_number", ""),
        "consumer_name": o.get("consumer_name", ""),
        "total": o.get("total", 0),
        "status": o.get("status", ""),
        "created_at": o.get("created_at"),
    } for o in orders]}


def _mask(sid: str) -> str:
    if not sid:
        return ""
    if len(sid) <= 8:
        return sid[:2] + "***"
    return f"{sid[:6]}…{sid[-4:]}"


@router.get("/twilio/status")
async def twilio_status(request: Request, user: dict = Depends(require_role(ROLE_SUPER_ADMIN))):
    sid = os.environ.get("TWILIO_ACCOUNT_SID", "")
    token = os.environ.get("TWILIO_AUTH_TOKEN", "")
    service = os.environ.get("TWILIO_VERIFY_SERVICE_SID", "")
    configured = bool(sid and token and service)
    db = request.app.state.db
    since = (datetime.now(timezone.utc) - timedelta(hours=24)).isoformat()
    otps_24h = await db.otp_attempts.count_documents({"created_at": {"$gt": since}})
    otps_all = await db.otp_attempts.count_documents({})
    return {
        "configured": configured,
        "masked_account_sid": _mask(sid),
        "masked_service_sid": _mask(service),
        "otps_last_24h": otps_24h,
        "otps_all_time": otps_all,
        "provider": "Twilio Verify API",
        "channel": "SMS",
    }


@router.get("/twilio/logs")
async def twilio_logs(request: Request, user: dict = Depends(require_role(ROLE_SUPER_ADMIN))):
    db = request.app.state.db
    docs = await db.otp_attempts.find({}).sort("created_at", -1).limit(100).to_list(100)
    return {"logs": [{
        "mobile": d.get("mobile", ""),
        "requested_role": d.get("requested_role", "consumer"),
        "created_at": d.get("created_at"),
    } for d in docs]}
