from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from starlette.requests import Request

from app.core.config import settings
from app.core.database import AsyncSessionLocal, init_db
from app.routes.admin import router as admin_router
from app.routes.auth import router as auth_router
from app.routes.auth import seed_default_staff_users
from app.routes.cashier import router as cashier_router
from app.routes.customer import router as customer_router
from app.routes.kitchen import router as kitchen_router

PROJECT_ROOT = Path(__file__).resolve().parents[2]
FRONTEND_DIR = PROJECT_ROOT / "frontend"

app = FastAPI(title=settings.app_name, version=settings.app_version)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory=FRONTEND_DIR / "static"), name="static")
templates = Jinja2Templates(directory=str(FRONTEND_DIR / "templates"))

app.include_router(auth_router, prefix=settings.api_v1_prefix)
app.include_router(customer_router, prefix=settings.api_v1_prefix)
app.include_router(kitchen_router, prefix=settings.api_v1_prefix)
app.include_router(cashier_router, prefix=settings.api_v1_prefix)
app.include_router(admin_router, prefix=settings.api_v1_prefix)


@app.on_event("startup")
async def on_startup() -> None:
    await init_db()
    async with AsyncSessionLocal() as session:
        await seed_default_staff_users(session)


@app.get("/", include_in_schema=False)
async def root() -> RedirectResponse:
    return RedirectResponse(url="/customer")

@app.get("/customer", include_in_schema=False)
async def customer_page(request: Request):
    return templates.TemplateResponse(request, "customer/select_table.html")


@app.get("/customer/select_table", include_in_schema=False)
async def customer_select_table_page(request: Request):
    return templates.TemplateResponse(request, "customer/select_table.html")


@app.get("/customer/menu", include_in_schema=False)
async def customer_menu_page(request: Request):
    return templates.TemplateResponse(request, "customer/menu.html")


@app.get("/customer/cart", include_in_schema=False)
async def customer_cart_page(request: Request):
    return templates.TemplateResponse(request, "customer/cart.html")


@app.get("/customer/order_status", include_in_schema=False)
async def customer_order_status_page(request: Request):
    return templates.TemplateResponse(request, "customer/order_status.html")


@app.get("/kitchen", include_in_schema=False)
async def kitchen_page(request: Request):
    return templates.TemplateResponse(request, "kitchen/kitchen_dashboard.html")


@app.get("/cashier", include_in_schema=False)
async def cashier_page(request: Request):
    return templates.TemplateResponse(request, "cashier/cashier_dashboard.html")


@app.get("/admin", include_in_schema=False)
async def admin_page(request: Request):
    return templates.TemplateResponse(request, "admin/admin_dashboard.html")
