from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import (
    create_access_token,
    decode_access_token,
    verify_password,
)
from app.models.admin_user import AdminUser
from app.schemas.auth import (
    AdminLoginRequest,
    TokenResponse,
)

router = APIRouter(prefix="/auth", tags=["admin-auth"])

security = HTTPBearer()


@router.post("/login", response_model=TokenResponse)
def login(
    body: AdminLoginRequest,
    db: Session = Depends(get_db),
):
    admin = (
        db.query(AdminUser)
        .filter(AdminUser.username == body.username)
        .first()
    )

    if not admin:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )

    if not admin.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive admin account",
        )

    is_valid_password = verify_password(
        body.password,
        admin.password_hash,
    )

    if not is_valid_password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )

    admin.last_login_at = datetime.now(timezone.utc)

    db.commit()

    access_token = create_access_token(
        subject=str(admin.id),
    )

    return TokenResponse(
        access_token=access_token,
    )


def get_current_admin(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> AdminUser:
    token = credentials.credentials

    payload = decode_access_token(token)

    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )

    admin_id = payload.get("sub")

    if not admin_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        )

    admin = (
        db.query(AdminUser)
        .filter(AdminUser.id == admin_id)
        .first()
    )

    if not admin:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Admin not found",
        )

    if not admin.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive admin account",
        )

    return admin


@router.get("/me")
def me(
    admin: AdminUser = Depends(get_current_admin),
):
    return {
        "id": str(admin.id),
        "username": admin.username,
        "is_active": admin.is_active,
    }