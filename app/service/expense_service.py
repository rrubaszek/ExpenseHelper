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

@router.post("/equal-split", response_model=schemas.ExpenseOut)
def create_equal_split_expense(exp_in: schemas.ExpenseEqualSplit, db: Session = Depends(database.get_db), current_user = Depends(get_current_user)):
    """Create an expense with equal splits among all group members"""
    g = group_repository.get_group(db, exp_in.group_id)
    if not g:
        raise HTTPException(status_code=404, detail="Group not found")
    if exp_in.payer_id not in [m.id for m in g.members]:
        raise HTTPException(status_code=400, detail="Payer not in group")
    
    # calculate equal split among all members
    num_members = len(g.members)
    if num_members == 0:
        raise HTTPException(status_code=400, detail="Group has no members")
    
    split_amount = round(exp_in.amount / num_members, 2)
    splits = {m.id: split_amount for m in g.members}
    
    # adjust for rounding errors by adding remainder to last member
    total = sum(splits.values())
    if abs(total - exp_in.amount) > 0.01:
        remainder = round(exp_in.amount - total, 2)
        splits[g.members[-1].id] = round(splits[g.members[-1].id] + remainder, 2)
    
    # create expense with calculated splits
    expense_data = schemas.ExpenseCreate(
        group_id=exp_in.group_id,
        payer_id=exp_in.payer_id,
        amount=exp_in.amount,
        description=exp_in.description,
        splits=splits
    )
    exp = expense_repository.create_expense(db, expense_data)
    splits_out = expense_repository.parse_splits(exp)
    return {**exp.__dict__, "splits": splits_out}

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

@router.get("/{expense_id}", response_model=schemas.ExpenseOut)
def get_expense(expense_id: int, db: Session = Depends(database.get_db), current_user = Depends(get_current_user)):
    expense = expense_repository.get_expense_by_id(db, expense_id)
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")

    # Check if user is member of the group
    g = group_repository.get_group(db, expense.group_id)
    if not g or current_user.id not in [m.id for m in g.members]:
        raise HTTPException(status_code=403, detail="Not a member of this group")

    splits = expense_repository.parse_splits(expense)
    return {**expense.__dict__, "splits": splits}

@router.delete("/{expense_id}")
def delete_expense(expense_id: int, db: Session = Depends(database.get_db), current_user = Depends(get_current_user)):
    expense = expense_repository.get_expense_by_id(db, expense_id)
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")

    # Check if user is member of the group
    g = group_repository.get_group(db, expense.group_id)
    if not g or current_user.id not in [m.id for m in g.members]:
        raise HTTPException(status_code=403, detail="Not a member of this group")

    expense_repository.delete_expense(db, expense_id)
    return {"message": "Expense deleted successfully"}

@router.put("/{expense_id}", response_model=schemas.ExpenseOut)
def update_expense(expense_id: int, exp_in: schemas.ExpenseCreate, db: Session = Depends(database.get_db), current_user = Depends(get_current_user)):
    # Get existing expense
    expense = expense_repository.get_expense_by_id(db, expense_id)
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")

    # Check if user is member of the group
    g = group_repository.get_group(db, expense.group_id)
    if not g or current_user.id not in [m.id for m in g.members]:
        raise HTTPException(status_code=403, detail="Not a member of this group")

    # Validate exp_in (same checks as create)
    if exp_in.payer_id not in [m.id for m in g.members]:
        raise HTTPException(status_code=400, detail="Payer not in group")
    if set(exp_in.splits.keys()) - set([m.id for m in g.members]):
        raise HTTPException(status_code=400, detail="Some split participants not in group")
    total_splits = sum(exp_in.splits.values())
    if abs(total_splits - exp_in.amount) > 0.01:
        raise HTTPException(status_code=400, detail="Splits must sum to amount")

    # Update
    updated_expense = expense_repository.update_expense(db, expense_id, exp_in)
    splits = expense_repository.parse_splits(updated_expense)
    return {**updated_expense.__dict__, "splits": splits}