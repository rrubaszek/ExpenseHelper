from fastapi import FastAPI
from .database import Base, engine
from .service import group_service, user_service, expense_service, settlement_service

# create tables (for prototype). In prod: use Alembic.
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Expenses Splitter API")

app.include_router(group_service.router)
app.include_router(user_service.router)
app.include_router(expense_service.router)
app.include_router(settlement_service.router)
