from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.menu import MenuItem
from app.models.table import RestaurantTable
from app.schemas.menu_schema import MenuItemResponse, TableResponse
from app.schemas.order_schema import OrderCreate, OrderResponse
from app.services.order_service import create_order, fetch_order

router = APIRouter(prefix="/customer", tags=["Customer"])


@router.get("/tables", response_model=list[TableResponse])
async def list_tables(db: Annotated[AsyncSession, Depends(get_db)]) -> list[RestaurantTable]:
    result = await db.execute(
        select(RestaurantTable)
        .where(RestaurantTable.is_active.is_(True))
        .order_by(RestaurantTable.table_number.asc())
    )
    return list(result.scalars().all())


@router.get("/tables/resolve", response_model=TableResponse)
async def resolve_table(
    qr_token: Annotated[str, Query(...)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> RestaurantTable:
    result = await db.execute(
        select(RestaurantTable).where(
            RestaurantTable.qr_token == qr_token,
            RestaurantTable.is_active.is_(True),
        )
    )
    table = result.scalar_one_or_none()
    if table is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Table not found.")
    return table


@router.get("/menu", response_model=list[MenuItemResponse])
async def list_menu(db: Annotated[AsyncSession, Depends(get_db)]) -> list[MenuItem]:
    result = await db.execute(
        select(MenuItem)
        .where(MenuItem.is_available.is_(True))
        .order_by(MenuItem.category.asc(), MenuItem.name.asc())
    )
    return list(result.scalars().all())


@router.post("/orders", response_model=OrderResponse, status_code=201)
async def place_order(
    payload: OrderCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> OrderResponse:
    return await create_order(db, payload)


@router.get("/orders/{order_id}", response_model=OrderResponse)
async def get_order(
    order_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> OrderResponse:
    return await fetch_order(db, order_id)
