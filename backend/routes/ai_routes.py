import os
import uuid
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List

from auth import require_role

router = APIRouter()


class DescRequest(BaseModel):
    product_name: str
    category: Optional[str] = ""
    brand: Optional[str] = ""
    keywords: Optional[List[str]] = []


async def _llm_call(system_msg: str, user_msg: str) -> str:
    """Use emergentintegrations LlmChat with Claude Sonnet 4.5."""
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    api_key = os.environ.get("EMERGENT_LLM_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="LLM key not configured")
    chat = LlmChat(
        api_key=api_key,
        session_id=str(uuid.uuid4()),
        system_message=system_msg,
    ).with_model("anthropic", "claude-sonnet-4-5-20250929")
    response = await chat.send_message(UserMessage(text=user_msg))
    return response


@router.post("/product-description")
async def generate_description(payload: DescRequest, user: dict = Depends(require_role("admin", "super_admin"))):
    system = (
        "You are a world-class e-commerce product copywriter for a hyperlocal grocery/retail platform. "
        "Write concise, persuasive product descriptions in 2-3 short sentences (max 60 words). "
        "Focus on benefits, quality, and use-cases. Do not use emojis. Do not use markdown."
    )
    user_msg = f"Product: {payload.product_name}\nBrand: {payload.brand or 'N/A'}\nCategory: {payload.category or 'General'}\nKeywords: {', '.join(payload.keywords) if payload.keywords else 'N/A'}\n\nWrite the description now."
    try:
        text = await _llm_call(system, user_msg)
        return {"description": text.strip()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI error: {str(e)}")


class TagsRequest(BaseModel):
    product_name: str
    category: Optional[str] = ""


@router.post("/product-tags")
async def generate_tags(payload: TagsRequest, user: dict = Depends(require_role("admin", "super_admin"))):
    system = "You output ONLY a comma-separated list of 6-10 concise SEO keywords for the given product. No prefix, no explanation, no markdown."
    user_msg = f"Product: {payload.product_name}\nCategory: {payload.category or 'General'}"
    try:
        text = await _llm_call(system, user_msg)
        tags = [t.strip() for t in text.replace("\n", ",").split(",") if t.strip()]
        return {"tags": tags[:12]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI error: {str(e)}")
