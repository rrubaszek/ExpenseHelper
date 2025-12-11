from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..repository import group_repository, expense_repository, settlement_repository, user_repository
from .. import database, schemas
from ..auth_context import get_current_user
from collections import defaultdict

router = APIRouter(prefix="/settlements", tags=["settlements"])

@router.get("/group/{group_id}")
def compute_settlement(group_id: int, db: Session = Depends(database.get_db), current_user = Depends(get_current_user)):
    g = group_repository.get_group(db, group_id)
    if not g:
        raise HTTPException(status_code=404, detail="Group not found")

    balances = defaultdict(float) 
    expenses = expense_repository.list_expenses_for_group(db, group_id)
    for e in expenses:
        splits = expense_repository.parse_splits(e)
        balances[e.payer_id] += e.amount
        # everyone owes their split
        for uid, amt in splits.items():
            balances[uid] -= amt

    # subtract recorded payments for this group
    payments = settlement_repository.list_payments_for_group(db, group_id)
    for p in payments:
        # debtor paid creditor: debtor's negative balance should increase (less negative)
        # creditor's positive balance should decrease
        balances[p.from_user] += p.amount
        balances[p.to_user] -= p.amount

    balances = {u: round(b, 2) for u, b in balances.items() if abs(b) > 0.009}

    creditors = sorted([(u, b) for u, b in balances.items() if b > 0], key=lambda x: x[1], reverse=False)
    debtors = sorted([(u, b) for u, b in balances.items() if b < 0], key=lambda x: x[1])

    i, j = 0, 0
    settlements = []
    creditors = creditors[:]  
    debtors = debtors[:]      
    while i < len(debtors) and j < len(creditors):
        d_id, d_amt = debtors[i]
        c_id, c_amt = creditors[j]
        pay = min(c_amt, -d_amt)
        if pay <= 0:
            break
        settlements.append({"from_user": d_id, "to_user": c_id, "amount": round(pay, 2)})
        d_amt += pay
        c_amt -= pay
        debtors[i] = (d_id, round(d_amt, 2))
        creditors[j] = (c_id, round(c_amt, 2))
        if abs(debtors[i][1]) < 0.01:
            i += 1
        if abs(creditors[j][1]) < 0.01:
            j += 1

    return {"balances": balances, "settlements": settlements}

@router.post("/mark-paid")
def mark_payment(payment: schemas.PaymentReceipt, db: Session = Depends(database.get_db), current_user = Depends(get_current_user)):
    """Mark a debt/settlement as paid. Persist payment to DB via settlement_repository."""
    # Verify the group exists and current user is a member
    group = group_repository.get_group(db, payment.group_id)
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")

    # Check if current user is a member of the group
    is_member = any(member.id == current_user.id for member in group.members)
    if not is_member:
        raise HTTPException(status_code=403, detail="You must be a member of the group to mark payments")

    # Verify both users exist and are members of the group
    from_user = user_repository.get_user(db, payment.from_user)
    to_user = user_repository.get_user(db, payment.to_user)
    if not from_user or not to_user:
        raise HTTPException(status_code=404, detail="User not found")

    # Verify both users are members of the group
    from_user_in_group = any(member.id == payment.from_user for member in group.members)
    to_user_in_group = any(member.id == payment.to_user for member in group.members)
    if not from_user_in_group or not to_user_in_group:
        raise HTTPException(status_code=400, detail="Both users must be members of the group")

    # Persist the payment using the repository
    p = settlement_repository.create_payment(db, payment)

    return {
        "status": "payment_recorded",
        "payment_id": p.id,
        "from_user": p.from_user,
        "to_user": p.to_user,
        "amount": p.amount,
        "created_at": p.created_at.isoformat(),
    }