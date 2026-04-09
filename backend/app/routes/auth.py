from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.core.security import create_access_token, get_current_user, get_password_hash, verify_password
from app.models.user import User, UserRole
from app.schemas.user_schema import LoginRequest, TokenResponse, UserResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])


async def seed_default_staff_users(db: AsyncSession) -> None:
    defaults = [
        (settings.default_admin_name, settings.default_admin_email, settings.default_admin_password, UserRole.admin),
        (
            settings.default_cashier_name,
            settings.default_cashier_email,
            settings.default_cashier_password,
            UserRole.cashier,
        ),
        (
            settings.default_kitchen_name,
            settings.default_kitchen_email,
            settings.default_kitchen_password,
            UserRole.kitchen,
        ),
    ]

    for full_name, email, password, role in defaults:
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        if user is None:
            db.add(
                User(
                    full_name=full_name,
                    email=email,
                    password_hash=get_password_hash(password),
                    role=role,
                    is_active=True,
                )
            )
    await db.commit()


@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest, db: Annotated[AsyncSession, Depends(get_db)]) -> TokenResponse:
    result = await db.execute(select(User).where(User.email == payload.email, User.is_active.is_(True)))
    user = result.scalar_one_or_none()

    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    token = create_access_token(str(user.id))
    return TokenResponse(access_token=token, role=user.role, full_name=user.full_name)


@router.get("/me", response_model=UserResponse)
async def me(current_user: Annotated[User, Depends(get_current_user)]) -> User:
    return current_user
