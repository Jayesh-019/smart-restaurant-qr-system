from datetime import date
from decimal import Decimal

from sqlalchemy import Date, cast, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.menu import MenuItem
from app.models.order import Order, OrderStatus
from app.models.order_item import OrderItem


async def get_sales_analytics(db: AsyncSession) -> dict:
    paid_orders_result = await db.execute(
        select(
            func.count(Order.id),
            func.coalesce(func.sum(Order.total_amount), 0),
        ).where(Order.status == OrderStatus.paid)
    )
    paid_orders, total_revenue = paid_orders_result.one()

    today_revenue_result = await db.execute(
        select(func.coalesce(func.sum(Order.total_amount), 0)).where(
            Order.status == OrderStatus.paid,
            cast(Order.placed_at, Date) == date.today(),
        )
    )
    today_revenue = today_revenue_result.scalar_one()

    pending_orders_result = await db.execute(
        select(func.count(Order.id)).where(
            Order.status.in_(
                [
                    OrderStatus.pending,
                    OrderStatus.confirmed,
                    OrderStatus.preparing,
                    OrderStatus.ready,
                ]
            )
        )
    )
    pending_orders = pending_orders_result.scalar_one()

    popular_items_result = await db.execute(
        select(
            MenuItem.name,
            func.coalesce(func.sum(OrderItem.quantity), 0).label("quantity_sold"),
        )
        .join(OrderItem, OrderItem.menu_item_id == MenuItem.id)
        .join(Order, Order.id == OrderItem.order_id)
        .where(Order.status.in_([OrderStatus.ready, OrderStatus.served, OrderStatus.billed, OrderStatus.paid]))
        .group_by(MenuItem.name)
        .order_by(func.sum(OrderItem.quantity).desc())
        .limit(5)
    )

    return {
        "paid_orders": paid_orders or 0,
        "total_revenue": Decimal(str(total_revenue or 0)).quantize(Decimal("0.01")),
        "today_revenue": Decimal(str(today_revenue or 0)).quantize(Decimal("0.01")),
        "pending_orders": pending_orders or 0,
        "popular_items": [
            {"menu_item_name": row[0], "quantity_sold": int(row[1] or 0)}
            for row in popular_items_result.all()
        ],
    }
