from sqlalchemy.orm import Session
from .. import models, schemas

def create_expense(db: Session, exp_in: schemas.ExpenseCreate):
    # store splits as CSV "user_id:amount,..."
    splits_str = ",".join([f"{uid}:{amt}" for uid, amt in exp_in.splits.items()])
    expense = models.Expense(
        group_id=exp_in.group_id,
        payer_id=exp_in.payer_id,
        amount=exp_in.amount,
        description=exp_in.description,
        splits=splits_str
    )
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return expense

def list_expenses_for_group(db: Session, group_id: int):
    return db.query(models.Expense).filter(models.Expense.group_id == group_id).order_by(models.Expense.created_at.desc()).all()

# helper to parse splits
def parse_splits(expense: models.Expense):
    d = {}
    if not expense.splits:
        return d
    pairs = expense.splits.split(",")
    for p in pairs:
        if not p:
            continue
        uid, amt = p.split(":")
        d[int(uid)] = float(amt)
    return d

def get_expense_by_id(db: Session, expense_id: int):
    return db.query(models.Expense).filter(models.Expense.id == expense_id).first()

def delete_expense(db: Session, expense_id: int):
    expense = db.query(models.Expense).filter(models.Expense.id == expense_id).first()
    if expense:
        db.delete(expense)
        db.commit()
        return True
    return False

def update_expense(db: Session, expense_id: int, exp_in: schemas.ExpenseCreate):
    expense = db.query(models.Expense).filter(models.Expense.id == expense_id).first()
    if not expense:
        return None

    # Update fields
    expense.amount = exp_in.amount
    expense.description = exp_in.description
    expense.payer_id = exp_in.payer_id

    # Update splits
    splits_str = ",".join([f"{uid}:{amt}" for uid, amt in exp_in.splits.items()])
    expense.splits = splits_str

    db.commit()
    db.refresh(expense)
    return expense