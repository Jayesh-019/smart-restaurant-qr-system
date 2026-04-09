from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from app.models.payment import PaymentMethod, PaymentStatus


class PaymentCreate(BaseModel):
    method: PaymentMethod
    reference: str | None = Field(default=None, max_length=120)


class PaymentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    order_id: int
    amount: Decimal
    method: PaymentMethod
    status: PaymentStatus
    reference: str | None
    paid_at: datetime


class BillLineItem(BaseModel):
    menu_item_name: str
    quantity: int
    unit_price: Decimal
    line_total: Decimal


class BillResponse(BaseModel):
    order_id: int
    order_number: str
    table_number: str
    subtotal: Decimal
    tax_amount: Decimal
    total_amount: Decimal
    status: str
    items: list[BillLineItem]


class PopularItem(BaseModel):
    menu_item_name: str
    quantity_sold: int


class AnalyticsResponse(BaseModel):
    paid_orders: int
    total_revenue: Decimal
    today_revenue: Decimal
    pending_orders: int
    popular_items: list[PopularItem]
