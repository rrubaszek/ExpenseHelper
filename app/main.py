from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import Base, engine
from .service import group_service, user_service, expense_service, settlement_service

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Expenses Splitter API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(group_service.router)
app.include_router(user_service.router)
app.include_router(expense_service.router)
app.include_router(settlement_service.router)