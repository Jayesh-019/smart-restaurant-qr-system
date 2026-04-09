from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.order import OrderStatus
from app.models.payment import Payment, PaymentStatus
from app.schemas.payment_schema import BillResponse, PaymentCreate
from app.services.order_service import fetch_order


async def build_bill(db: AsyncSession, order_id: int) -> BillResponse:
    order = await fetch_order(db, order_id)
    return BillResponse(
        order_id=order.id,
        order_number=order.order_number,
        table_number=order.table.table_number,
        subtotal=order.subtotal,
        tax_amount=order.tax_amount,
        total_amount=order.total_amount,
        status=order.status.value,
        items=[
            {
                "menu_item_name": item.menu_item.name,
                "quantity": item.quantity,
                "unit_price": item.unit_price,
                "line_total": item.line_total,
            }
            for item in order.items
        ],
    )


async def record_payment(db: AsyncSession, order_id: int, payload: PaymentCreate) -> Payment:
    order = await fetch_order(db, order_id)

    if order.payment and order.payment.status == PaymentStatus.paid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payment has already been recorded for this order.",
        )

    payment = order.payment or Payment(order_id=order.id, amount=order.total_amount, method=payload.method)
    payment.amount = order.total_amount
    payment.method = payload.method
    payment.status = PaymentStatus.paid
    payment.reference = payload.reference

    if order.payment is None:
        db.add(payment)

    order.status = OrderStatus.paid
    await db.commit()
    await db.refresh(payment)
    return payment
