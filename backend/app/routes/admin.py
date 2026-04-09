from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.core.security import require_roles
from app.models.menu import MenuItem
from app.models.table import RestaurantTable
from app.models.user import User, UserRole
from app.schemas.menu_schema import MenuItemCreate, MenuItemResponse, MenuItemUpdate
from app.schemas.payment_schema import AnalyticsResponse
from app.services.analytics_service import get_sales_analytics
from app.utils.qr_generator import build_table_qr_url, generate_qr_base64

router = APIRouter(prefix="/admin", tags=["Admin"])
AdminAccess = Annotated[User, Depends(require_roles(UserRole.admin))]


@router.get("/menu", response_model=list[MenuItemResponse])
async def admin_menu(
    _: AdminAccess,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[MenuItemResponse]:
    result = await db.execute(select(MenuItem).order_by(MenuItem.category.asc(), MenuItem.name.asc()))
    return list(result.scalars().all())


@router.post("/menu", response_model=MenuItemResponse, status_code=201)
async def create_menu_item(
    payload: MenuItemCreate,
    _: AdminAccess,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> MenuItemResponse:
    menu_item = MenuItem(**payload.model_dump())
    db.add(menu_item)
    await db.commit()
    await db.refresh(menu_item)
    return menu_item


@router.put("/menu/{menu_item_id}", response_model=MenuItemResponse)
async def update_menu_item(
    menu_item_id: int,
    payload: MenuItemUpdate,
    _: AdminAccess,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> MenuItemResponse:
    result = await db.execute(select(MenuItem).where(MenuItem.id == menu_item_id))
    menu_item = result.scalar_one_or_none()
    if menu_item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Menu item not found.")

    for field_name, value in payload.model_dump(exclude_unset=True).items():
        setattr(menu_item, field_name, value)

    await db.commit()
    await db.refresh(menu_item)
    return menu_item


@router.delete("/menu/{menu_item_id}", status_code=204)
async def disable_menu_item(
    menu_item_id: int,
    _: AdminAccess,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> None:
    result = await db.execute(select(MenuItem).where(MenuItem.id == menu_item_id))
    menu_item = result.scalar_one_or_none()
    if menu_item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Menu item not found.")

    menu_item.is_available = False
    await db.commit()


@router.get("/analytics", response_model=AnalyticsResponse)
async def analytics(
    _: AdminAccess,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> AnalyticsResponse:
    return AnalyticsResponse(**await get_sales_analytics(db))


@router.get("/tables/{table_id}/qr")
async def table_qr_code(
    table_id: int,
    _: AdminAccess,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    result = await db.execute(select(RestaurantTable).where(RestaurantTable.id == table_id))
    table = result.scalar_one_or_none()
    if table is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Table not found.")

    qr_url = build_table_qr_url(settings.qr_base_url, table.table_number, table.qr_token)
    return {
        "table_id": table.id,
        "table_number": table.table_number,
        "qr_token": table.qr_token,
        "qr_url": qr_url,
        "qr_code_base64": generate_qr_base64(qr_url),
    }
