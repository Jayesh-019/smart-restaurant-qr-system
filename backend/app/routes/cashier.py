from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import require_roles
from app.models.user import User, UserRole
from app.schemas.payment_schema import BillResponse, PaymentCreate, PaymentResponse
from app.services.billing_service import build_bill, record_payment

router = APIRouter(prefix="/cashier", tags=["Cashier"])
CashierAccess = Annotated[User, Depends(require_roles(UserRole.cashier, UserRole.admin))]


@router.get("/orders/{order_id}/bill", response_model=BillResponse)
async def get_bill(
    order_id: int,
    _: CashierAccess,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> BillResponse:
    return await build_bill(db, order_id)


@router.post("/orders/{order_id}/payments", response_model=PaymentResponse, status_code=201)
async def pay_order(
    order_id: int,
    payload: PaymentCreate,
    _: CashierAccess,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> PaymentResponse:
    return await record_payment(db, order_id, payload)
