from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from app.models.order import OrderStatus
from app.schemas.menu_schema import MenuItemResponse, TableResponse


class OrderItemCreate(BaseModel):
    menu_item_id: int
    quantity: int = Field(..., gt=0, le=50)
    notes: str | None = Field(default=None, max_length=255)


class OrderCreate(BaseModel):
    table_id: int
    customer_name: str | None = Field(default=None, max_length=120)
    customer_phone: str | None = Field(default=None, max_length=30)
    notes: str | None = None
    items: list[OrderItemCreate] = Field(..., min_length=1)


class OrderStatusUpdate(BaseModel):
    status: OrderStatus


class OrderItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    quantity: int
    unit_price: Decimal
    line_total: Decimal
    notes: str | None
    menu_item: MenuItemResponse


class OrderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    order_number: str
    customer_name: str | None
    customer_phone: str | None
    notes: str | None
    subtotal: Decimal
    tax_amount: Decimal
    total_amount: Decimal
    status: OrderStatus
    placed_at: datetime
    updated_at: datetime
    table: TableResponse
    items: list[OrderItemResponse]
