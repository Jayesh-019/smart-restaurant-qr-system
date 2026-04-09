from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import require_roles
from app.models.user import User, UserRole
from app.schemas.order_schema import OrderResponse, OrderStatusUpdate
from app.services.order_service import get_live_orders, update_order_status

router = APIRouter(prefix="/kitchen", tags=["Kitchen"])
KitchenAccess = Annotated[User, Depends(require_roles(UserRole.kitchen, UserRole.admin))]


@router.get("/orders/live", response_model=list[OrderResponse])
async def live_orders(
    _: KitchenAccess,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[OrderResponse]:
    return await get_live_orders(db)


@router.patch("/orders/{order_id}/status", response_model=OrderResponse)
async def change_order_status(
    order_id: int,
    payload: OrderStatusUpdate,
    _: KitchenAccess,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> OrderResponse:
    return await update_order_status(db, order_id, payload.status)
