from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict
from datetime import datetime

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: Optional[str] = None

class UserOut(BaseModel):
    id: int
    email: EmailStr
    name: Optional[str]

    class Config:
        orm_mode = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class GroupCreate(BaseModel):
    name: str
    description: Optional[str] = None
    member_ids: List[int] = []

class GroupOut(BaseModel):
    id: int
    name: str
    description: Optional[str]
    members: List[UserOut]

    class Config:
        orm_mode = True

class ExpenseCreate(BaseModel):
    group_id: int
    payer_id: int
    amount: float
    description: Optional[str] = None
    splits: Dict[int, float]  # mapping user_id -> amount

class ExpenseEqualSplit(BaseModel):
    """Create an expense with equal splits among all group members"""
    group_id: int
    payer_id: int
    amount: float
    description: Optional[str] = None

class ExpenseOut(BaseModel):
    id: int
    group_id: int
    payer_id: int
    amount: float
    description: Optional[str]
    splits: Dict[int, float]
    created_at: datetime

    class Config:
        orm_mode = True

class Settlement(BaseModel):
    from_user: int
    to_user: int
    amount: float

class PaymentReceipt(BaseModel):
    """Mark a debt/settlement as paid"""
    from_user: int
    to_user: int
    amount: float
    group_id: int