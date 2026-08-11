from fastapi import APIRouter

from app.schemas.auth import SignupRequest, VerifyOtpRequest, LoginRequest, TokenResponse

router = APIRouter()


@router.post("/signup")
def signup(payload: SignupRequest):
    return {"message": "OTP sent to email"}


@router.post("/verify-otp", response_model=TokenResponse)
def verify_otp(payload: VerifyOtpRequest):
    return {"access_token": "TODO", "token_type": "bearer"}


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest):
    return {"access_token": "TODO", "token_type": "bearer"}