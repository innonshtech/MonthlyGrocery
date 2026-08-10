"""
Audit + notification helpers for MonthlyGrocery.

- log_activity() writes to db.audit_log so Super Admin can see who did what
- queue_sms() sends via Twilio (when configured) AND logs to db.notifications_outbox
  regardless of send-outcome, so Super Admin can see every attempted SMS.

Both helpers are best-effort: they never raise. A failed audit write shouldn't
break the operation being audited.
"""
from datetime import datetime, timezone
from typing import Optional
import logging

from twilio_otp import send_sms

logger = logging.getLogger("monthlygrocery.audit")


async def log_activity(
    db,
    actor: dict,
    action: str,
    resource_type: str,
    resource_id: Optional[str] = None,
    resource_name: Optional[str] = None,
    metadata: Optional[dict] = None,
):
    """Best-effort audit trail. Actor is the current-user dict from get_current_user()."""
    try:
        await db.audit_log.insert_one({
            "actor_id": actor.get("id"),
            "actor_mobile": actor.get("mobile"),
            "actor_name": actor.get("name", ""),
            "actor_role": actor.get("role"),
            "action": action,
            "resource_type": resource_type,
            "resource_id": resource_id,
            "resource_name": resource_name or "",
            "metadata": metadata or {},
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
    except Exception as e:  # pragma: no cover
        logger.warning("audit log failed: %s", e)


async def queue_sms(db, to: str, body: str, purpose: str, recipient: Optional[dict] = None):
    """
    Attempt to send an SMS via Twilio, log the outcome to db.notifications_outbox
    for Super Admin visibility, and always return the result dict.
    """
    result = send_sms(to, body)
    try:
        await db.notifications_outbox.insert_one({
            "to": to,
            "channel": "sms",
            "purpose": purpose,
            "body": body,
            "sent": bool(result.get("sent")),
            "twilio_sid": result.get("sid", ""),
            "error": result.get("error", ""),
            "recipient_name": (recipient or {}).get("name", ""),
            "recipient_role": (recipient or {}).get("role", ""),
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
    except Exception as e:  # pragma: no cover
        logger.warning("notifications_outbox log failed: %s", e)
    return result
