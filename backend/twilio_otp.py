import os
from twilio.rest import Client
from twilio.base.exceptions import TwilioRestException
from fastapi import HTTPException


def twilio_client() -> Client:
    sid = os.environ.get("TWILIO_ACCOUNT_SID")
    token = os.environ.get("TWILIO_AUTH_TOKEN")
    if not sid or not token:
        raise HTTPException(status_code=500, detail="Twilio not configured")
    return Client(sid, token)


def send_otp(mobile_e164: str) -> str:
    service_sid = os.environ.get("TWILIO_VERIFY_SERVICE_SID")
    if not service_sid:
        raise HTTPException(status_code=500, detail="Twilio Verify Service not configured")
    try:
        verification = twilio_client().verify.v2.services(service_sid).verifications.create(
            to=mobile_e164, channel="sms"
        )
        return verification.status
    except TwilioRestException as e:
        # Map common Twilio errors to friendlier messages
        msg = str(getattr(e, "msg", "") or "")
        code = getattr(e, "code", None)
        if code == 60200:
            raise HTTPException(status_code=400, detail="Invalid phone number format.")
        if code == 60203:
            raise HTTPException(status_code=429, detail="Too many attempts. Please wait a few minutes.")
        raise HTTPException(status_code=400, detail=f"Could not send OTP: {msg or 'Twilio error'}")


def check_otp(mobile_e164: str, code: str) -> bool:
    service_sid = os.environ.get("TWILIO_VERIFY_SERVICE_SID")
    if not service_sid:
        raise HTTPException(status_code=500, detail="Twilio Verify Service not configured")
    try:
        result = twilio_client().verify.v2.services(service_sid).verification_checks.create(
            to=mobile_e164, code=code
        )
        return result.status == "approved"
    except TwilioRestException as e:
        msg = str(getattr(e, "msg", "") or "")
        code_err = getattr(e, "code", None)
        if code_err == 20404:
            # Verification not found → expired or wrong number
            raise HTTPException(status_code=400, detail="OTP expired. Please request a new one.")
        raise HTTPException(status_code=400, detail=f"Verification failed: {msg or 'Twilio error'}")


def send_sms(to: str, body: str) -> dict:
    """
    Send an arbitrary SMS via Twilio Messaging.
    Requires TWILIO_MESSAGING_SERVICE_SID (preferred) or TWILIO_FROM_NUMBER.
    Never raises — returns a dict {sent: bool, sid, error} so callers can queue
    the message without breaking their own flow.
    """
    body = (body or "")[:1200]
    msg_service = os.environ.get("TWILIO_MESSAGING_SERVICE_SID")
    from_number = os.environ.get("TWILIO_FROM_NUMBER")
    if not msg_service and not from_number:
        return {"sent": False, "error": "no_sender_configured", "body": body}
    sid = os.environ.get("TWILIO_ACCOUNT_SID")
    token = os.environ.get("TWILIO_AUTH_TOKEN")
    if not sid or not token:
        return {"sent": False, "error": "twilio_credentials_missing", "body": body}
    try:
        kwargs = {"to": to, "body": body}
        if msg_service:
            kwargs["messaging_service_sid"] = msg_service
        else:
            kwargs["from_"] = from_number
        m = Client(sid, token).messages.create(**kwargs)
        return {"sent": True, "sid": m.sid, "body": body}
    except TwilioRestException as e:
        return {"sent": False, "error": f"twilio_{getattr(e, 'code', 'err')}: {getattr(e, 'msg', str(e))}", "body": body}
    except Exception as e:
        return {"sent": False, "error": str(e), "body": body}
