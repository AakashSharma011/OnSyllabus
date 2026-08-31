import uuid
from supabase import create_client

from app.core.config import settings

supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
BUCKET = "resources"


def upload_file(file_bytes: bytes, original_filename: str, content_type: str) -> str:
    ext = original_filename.split(".")[-1] if "." in original_filename else "pdf"
    unique_name = f"{uuid.uuid4()}.{ext}"

    supabase.storage.from_(BUCKET).upload(
        unique_name,
        file_bytes,
        {"content-type": content_type},
    )

    return supabase.storage.from_(BUCKET).get_public_url(unique_name)