import os
import uuid
import mimetypes
from pathlib import Path
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File

from auth import get_current_user

router = APIRouter()

MAX_SIZE = 8 * 1024 * 1024  # 8 MB

# Persistent-disk uploads live outside the code tree so redeploys don't wipe them.
# Override via UPLOAD_DIR env var when running on Emergent Persistent Volumes.
UPLOAD_DIR = Path(os.environ.get("UPLOAD_DIR", "/app/backend/uploaded_images"))
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

_EXT_ALLOW = {"image/png": "png", "image/jpeg": "jpg", "image/jpg": "jpg",
              "image/webp": "webp", "image/gif": "gif", "image/svg+xml": "svg"}
_VIDEO_EXT_ALLOW = {"video/mp4": "mp4", "video/webm": "webm", "video/quicktime": "mov"}


def _safe_ext(filename: str, mime: str) -> str:
    ext = _EXT_ALLOW.get(mime) or _VIDEO_EXT_ALLOW.get(mime)
    if ext:
        return ext
    # Fallback — best-effort from the filename or the mimetypes registry.
    guessed = mimetypes.guess_extension(mime) or Path(filename or "").suffix
    return (guessed.lstrip(".") or "bin")[:6]


@router.post("/image")
async def upload_image(file: UploadFile = File(...), user: dict = Depends(get_current_user)):
    """Save the upload to persistent disk and return an HTTP URL.

    Prior implementation returned a base64 data URL. That embedded ~500 KB per
    photo directly inside every /products/all response and made the shop feel
    unusable at 80+ SKUs. Now:

    * Each upload writes `<UPLOAD_DIR>/<uuid>.<ext>`.
    * The response returns `/api/uploads/<filename>` — a small string that
      MongoDB stores instead of the full image bytes.
    * Static serving is mounted at that path (see server.py) so browsers
      can lazy-load + cache each image independently.
    """
    contents = await file.read()
    if len(contents) > MAX_SIZE:
        raise HTTPException(status_code=413, detail="File too large (max 8MB)")
    mime = (file.content_type or "image/png").lower()
    if not mime.startswith("image/") and not mime.startswith("video/"):
        raise HTTPException(status_code=400, detail="Unsupported file type")
    ext = _safe_ext(file.filename or "", mime)
    filename = f"{uuid.uuid4().hex}.{ext}"
    path = UPLOAD_DIR / filename
    with open(path, "wb") as f:
        f.write(contents)
    return {"url": f"/api/uploads/{filename}", "size": len(contents), "mime": mime}


@router.post("/video")
async def upload_video(file: UploadFile = File(...), user: dict = Depends(get_current_user)):
    return await upload_image(file, user)
