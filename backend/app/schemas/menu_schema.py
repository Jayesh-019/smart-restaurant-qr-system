from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from app.models.menu import MenuCategory


class TableResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    table_number: str
    qr_token: str
    seats: int
    is_active: bool


class MenuItemBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=150)
    description: str | None = None
    category: MenuCategory
    price: Decimal = Field(..., gt=0)
    image_url: str | None = None
    is_available: bool = True


class MenuItemCreate(MenuItemBase):
    pass


class MenuItemUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=150)
    description: str | None = None
    category: MenuCategory | None = None
    price: Decimal | None = Field(default=None, gt=0)
    image_url: str | None = None
    is_available: bool | None = None


class MenuItemResponse(MenuItemBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime
