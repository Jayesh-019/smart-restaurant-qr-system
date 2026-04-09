from datetime import datetime, timezone
from decimal import Decimal
from uuid import uuid4

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.models.menu import MenuItem
from app.models.order import Order, OrderStatus
from app.models.order_item import OrderItem
from app.models.table import RestaurantTable
from app.schemas.order_schema import OrderCreate
from app.utils.tax_calculator import calculate_tax, calculate_total


def _generate_order_number() -> str:
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
    return f"ORD-{timestamp}-{uuid4().hex[:6].upper()}"


async def create_order(db: AsyncSession, payload: OrderCreate) -> Order:
    table_result = await db.execute(
        select(RestaurantTable).where(
            RestaurantTable.id == payload.table_id,
            RestaurantTable.is_active.is_(True),
        )
    )
    table = table_result.scalar_one_or_none()
    if table is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Table not found.")

    menu_item_ids = [item.menu_item_id for item in payload.items]
    items_result = await db.execute(
        select(MenuItem).where(MenuItem.id.in_(menu_item_ids), MenuItem.is_available.is_(True))
    )
    menu_items = {item.id: item for item in items_result.scalars().all()}

    if len(menu_items) != len(set(menu_item_ids)):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="One or more selected menu items are unavailable.",
        )

    subtotal = Decimal("0.00")
    order_items: list[OrderItem] = []

    for incoming_item in payload.items:
        menu_item = menu_items[incoming_item.menu_item_id]
        line_total = menu_item.price * incoming_item.quantity
        subtotal += line_total
        order_items.append(
            OrderItem(
                menu_item_id=menu_item.id,
                quantity=incoming_item.quantity,
                unit_price=menu_item.price,
                line_total=line_total,
                notes=incoming_item.notes,
            )
        )

    tax_amount = calculate_tax(subtotal, Decimal(str(settings.tax_rate)))
    total_amount = calculate_total(subtotal, tax_amount)

    order = Order(
        order_number=_generate_order_number(),
        table_id=payload.table_id,
        customer_name=payload.customer_name,
        customer_phone=payload.customer_phone,
        notes=payload.notes,
        subtotal=subtotal.quantize(Decimal("0.01")),
        tax_amount=tax_amount,
        total_amount=total_amount,
        status=OrderStatus.pending,
        items=order_items,
    )

    db.add(order)
    await db.commit()
    return await fetch_order(db, order.id)


async def fetch_order(db: AsyncSession, order_id: int) -> Order:
    result = await db.execute(
        select(Order)
        .options(
            selectinload(Order.table),
            selectinload(Order.items).selectinload(OrderItem.menu_item),
            selectinload(Order.payment),
        )
        .where(Order.id == order_id)
    )
    order = result.scalar_one_or_none()
    if order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found.")
    return order


async def get_live_orders(db: AsyncSession) -> list[Order]:
    result = await db.execute(
        select(Order)
        .options(
            selectinload(Order.table),
            selectinload(Order.items).selectinload(OrderItem.menu_item),
        )
        .where(
            Order.status.in_(
                [
                    OrderStatus.pending,
                    OrderStatus.confirmed,
                    OrderStatus.preparing,
                    OrderStatus.ready,
                ]
            )
        )
        .order_by(Order.placed_at.desc())
    )
    return list(result.scalars().all())


async def update_order_status(db: AsyncSession, order_id: int, new_status: OrderStatus) -> Order:
    order = await fetch_order(db, order_id)
    order.status = new_status
    await db.commit()
    return await fetch_order(db, order_id)
