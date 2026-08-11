import random
import resend

from app.core.config import settings
from app.services.cache_service import set_cache, get_cache

resend.api_key = settings.RESEND_API_KEY

def generate_otp()->str:
    """Generates a 6-digit OTP"""
    return str(random.randint(100000, 999999))

def send_otp(email:str)->None:
    otp=generate_otp()
    set_cache(f"otp:{email}", otp, expire_seconds=300)
    resend.Emails.send({
        "from": "OnSyllabus <onboarding@resend.dev>",
        "to": email,
        "subject": "Your OnSyllabus verification code",
        "html": f"<p>Your OTP is <strong>{otp}</strong>. It expires in 5 minutes.</p>",
    })

def verify_otp(email: str, otp: str) -> bool:
    cached = get_cache(f"otp:{email}")
    return cached is not None and cached == otp