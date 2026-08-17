from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.schemas.auth import SignupRequest, VerifyOtpRequest, LoginRequest, TokenResponse
from app.services.otp_service import send_otp, verify_otp
from app.services.cache_service import set_cache, get_cache, delete_cache
from app.core.database import get_db
from app.core.security import hash_password, verify_password, create_access_token
from app.models.user import User

router = APIRouter()


@router.post("/signup")
def signup(payload: SignupRequest, db: Session = Depends(get_db)):
    email = payload.email.strip().lower()
    existing = db.query(User).filter(User.email == email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed = hash_password(payload.password)
    set_cache(f"signup_pw:{email}", hashed, expire_seconds=300)

    send_otp(email)
    return {"message": "OTP sent to email"}


@router.post("/verify-otp", response_model=TokenResponse)
def verify_otp_route(payload: VerifyOtpRequest, db: Session = Depends(get_db)):
    email = payload.email.strip().lower()
    is_valid = verify_otp(email, payload.otp)
    if not is_valid:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")

    hashed_pw = get_cache(f"signup_pw:{email}")
    if hashed_pw is None:
        raise HTTPException(status_code=400, detail="Signup session expired, please sign up again")

    new_user = User(email=email, password_hash=hashed_pw, is_verified=True)
    db.add(new_user)
    db.commit()

    delete_cache(f"signup_pw:{email}")

    token = create_access_token(subject=email)
    return {"access_token": token, "token_type": "bearer"}


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    email = payload.email.strip().lower()
    user = db.query(User).filter(User.email == email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token(subject=email)
    return {"access_token": token, "token_type": "bearer"}

from app.api.deps import get_current_user

@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    return {"email": current_user.email, "is_admin": current_user.is_admin}