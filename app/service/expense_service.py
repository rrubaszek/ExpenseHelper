from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..repository import expense_repository, group_repository
from .. import database, schemas
from ..auth_context import get_current_user
from typing import List

router = APIRouter(prefix="/expenses", tags=["expenses"])

@router.post("/", response_model=schemas.ExpenseOut)
def create_expense(exp_in: schemas.ExpenseCreate, db: Session = Depends(database.get_db), current_user = Depends(get_current_user)):
    # minimal checks: payer belongs to group, split sums match etc.
    g = group_repository.get_group(db, exp_in.group_id)
    if not g:
        raise HTTPException(status_code=404, detail="Group not found")
    if exp_in.payer_id not in [m.id for m in g.members]:
        raise HTTPException(status_code=400, detail="Payer not in group")
    if set(exp_in.splits.keys()) - set([m.id for m in g.members]):
        raise HTTPException(status_code=400, detail="Some split participants not in group")
    total_splits = sum(exp_in.splits.values())
    if abs(total_splits - exp_in.amount) > 0.01:
        raise HTTPException(status_code=400, detail="Splits must sum to amount")
    exp = expense_repository.create_expense(db, exp_in)
    # convert stored splits to dict
    splits = expense_repository.parse_splits(exp)
    return {**exp.__dict__, "splits": splits}

@router.get("/group/{group_id}", response_model=List[schemas.ExpenseOut])
def list_group_expenses(group_id: int, db: Session = Depends(database.get_db), current_user = Depends(get_current_user)):
    expenses = expense_repository.list_expenses_for_group(db, group_id)
    out = []
    for e in expenses:
        out.append({
            "id": e.id,
            "group_id": e.group_id,
            "payer_id": e.payer_id,
            "amount": e.amount,
            "description": e.description,
            "splits": expense_repository.parse_splits(e),
            "created_at": e.created_at
        })
    return out