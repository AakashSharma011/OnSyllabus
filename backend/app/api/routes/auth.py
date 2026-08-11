from fastapi import APIRouter

from app.schemas.auth import SignupRequest, VerifyOtpRequest, LoginRequest, TokenResponse
from app.services.otp_service import send_otp, verify_otp

router = APIRouter()


@router.post("/signup")
def signup(payload: SignupRequest):
    send_otp(payload.email)
    return {"message": "OTP sent to email"}


@router.post("/verify-otp", response_model=TokenResponse)
def verify_otp_route(payload: VerifyOtpRequest):
    is_valid = verify_otp(payload.email, payload.otp)
    if not is_valid:
        return {"access_token": "", "token_type": "invalid_or_expired_otp"}
    return {"access_token": "TODO", "token_type": "bearer"}


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest):
    return {"access_token": "TODO", "token_type": "bearer"}