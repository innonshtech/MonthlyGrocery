from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Request, Response, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Optional
from bson import ObjectId

from auth import (
    normalize_mobile, create_access_token, set_auth_cookie, clear_auth_cookie,
    get_current_user, ROLE_CONSUMER, ROLE_ADMIN, ROLE_SUPER_ADMIN,
    STATUS_PENDING, STATUS_APPROVED, STATUS_SUSPENDED,
)
from twilio_otp import send_otp, check_otp

router = APIRouter()


class SendOtpRequest(BaseModel):
    mobile: str
    role: str = ROLE_CONSUMER  # requested role during first-time signup: consumer | admin


class VerifyOtpRequest(BaseModel):
    mobile: str
    code: str
    name: Optional[str] = ""


def _user_public(u: dict) -> dict:
    return {
        "id": str(u["_id"]) if "_id" in u else u.get("id"),
        "mobile": u.get("mobile", ""),
        "name": u.get("name", ""),
        "role": u.get("role", ROLE_CONSUMER),
        "status": u.get("status", STATUS_APPROVED),
        "address": u.get("address", ""),
        "city": u.get("city", ""),
        "pincode": u.get("pincode", ""),
    }


@router.post("/send-otp")
async def send_otp_route(payload: SendOtpRequest, request: Request):
    mobile = normalize_mobile(payload.mobile)
    if payload.role not in (ROLE_CONSUMER, ROLE_ADMIN):
        raise HTTPException(status_code=400, detail="Invalid role")

    db = request.app.state.db

    # Admin login is invite-only. The mobile must already exist as an admin/super_admin
    # (created by Super Admin). Random mobiles cannot self-signup as admin.
    if payload.role == ROLE_ADMIN:
        existing = await db.users.find_one({"mobile": mobile})
        if not existing or existing.get("role") not in (ROLE_ADMIN, ROLE_SUPER_ADMIN):
            raise HTTPException(
                status_code=403,
                detail="This mobile is not registered as an admin. Please ask the Super Admin to add you.",
            )
        if existing.get("status") == STATUS_SUSPENDED:
            raise HTTPException(status_code=403, detail="Your admin access has been suspended.")

    # Simple rate limit: max 3 sends / mobile / 5 minutes
    since = (datetime.now(timezone.utc) - timedelta(minutes=5)).isoformat()
    count = await db.otp_attempts.count_documents({"mobile": mobile, "created_at": {"$gt": since}})
    if count >= 3:
        raise HTTPException(status_code=429, detail="Too many OTP requests. Please wait a few minutes.")

    send_otp(mobile)
    await db.otp_attempts.insert_one({
        "mobile": mobile,
        "requested_role": payload.role,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    return {"success": True, "mobile": mobile, "requested_role": payload.role}


@router.post("/verify-otp")
async def verify_otp_route(payload: VerifyOtpRequest, request: Request, response: Response):
    mobile = normalize_mobile(payload.mobile)
    if not payload.code or len(payload.code.strip()) < 4:
        raise HTTPException(status_code=400, detail="OTP is required")

    ok = check_otp(mobile, payload.code.strip())
    if not ok:
        raise HTTPException(status_code=400, detail="Incorrect OTP. Please try again.")

    db = request.app.state.db
    # Look up the most recent OTP request to know the requested role
    last = await db.otp_attempts.find_one({"mobile": mobile}, sort=[("created_at", -1)])
    requested_role = (last or {}).get("requested_role", ROLE_CONSUMER)

    user = await db.users.find_one({"mobile": mobile})
    if user is None:
        # First-time signup — only consumers can self-register.
        # Admin accounts must be pre-created by Super Admin (see /api/admin/admins).
        if requested_role == ROLE_ADMIN:
            raise HTTPException(
                status_code=403,
                detail="This mobile is not registered as an admin. Please ask the Super Admin to add you.",
            )
        doc = {
            "mobile": mobile,
            "name": (payload.name or "").strip(),
            "role": ROLE_CONSUMER,
            "status": STATUS_APPROVED,
            "address": "",
            "city": "",
            "pincode": "",
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        result = await db.users.insert_one(doc)
        doc["_id"] = result.inserted_id
        user = doc
    else:
        # Existing user — update name if provided and not set
        if payload.name and not user.get("name"):
            await db.users.update_one({"_id": user["_id"]}, {"$set": {"name": payload.name.strip()}})
            user["name"] = payload.name.strip()
        # Suspended admins cannot log in
        if user.get("role") in (ROLE_ADMIN, ROLE_SUPER_ADMIN) and user.get("status") == "suspended":
            raise HTTPException(status_code=403, detail="Your admin access has been suspended.")

    user_id = str(user["_id"])
    token = create_access_token(user_id, user["mobile"], user["role"], user.get("status", STATUS_APPROVED))
    set_auth_cookie(response, token)
    return {"user": _user_public(user), "access_token": token}


@router.post("/logout")
async def logout(response: Response, user: dict = Depends(get_current_user)):
    clear_auth_cookie(response)
    return {"success": True}


@router.get("/me")
async def me(user: dict = Depends(get_current_user)):
    return {"user": {
        "id": user["id"],
        "mobile": user.get("mobile", ""),
        "name": user.get("name", ""),
        "role": user.get("role", ROLE_CONSUMER),
        "status": user.get("status", STATUS_APPROVED),
        "address": user.get("address", ""),
        "city": user.get("city", ""),
        "pincode": user.get("pincode", ""),
    }}


class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    pincode: Optional[str] = None


@router.put("/me")
async def update_me(payload: ProfileUpdate, request: Request, user: dict = Depends(get_current_user)):
    db = request.app.state.db
    update = {k: v for k, v in payload.model_dump().items() if v is not None}
    if update:
        await db.users.update_one({"_id": ObjectId(user["id"])}, {"$set": update})
    updated = await db.users.find_one({"_id": ObjectId(user["id"])})
    return {"user": _user_public(updated)}
