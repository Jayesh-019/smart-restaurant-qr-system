from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import declarative_base

from app.core.config import settings

Base = declarative_base()

engine = create_async_engine(
    settings.database_url,
    future=True,
    echo=False,
    pool_pre_ping=True,
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session


async def init_db() -> None:
    from app.models.menu import MenuItem
    from app.models.order import Order
    from app.models.order_item import OrderItem
    from app.models.payment import Payment
    from app.models.table import RestaurantTable
    from app.models.user import User

    _ = (User, RestaurantTable, MenuItem, Order, OrderItem, Payment)

    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)
