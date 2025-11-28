from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from repository import group_repository, expense_repository
from .. import database, schemas
from ..auth_context import get_current_user
from collections import defaultdict

router = APIRouter(prefix="/settlements", tags=["settlements"])

@router.get("/group/{group_id}")
def compute_settlement(group_id: int, db: Session = Depends(database.get_db), current_user = Depends(get_current_user)):
    g = group_repository.get_group(db, group_id)
    if not g:
        raise HTTPException(status_code=404, detail="Group not found")
    # build balances
    balances = defaultdict(float)  # user_id -> net balance
    expenses = expense_repository.list_expenses_for_group(db, group_id)
    for e in expenses:
        splits = expense_repository.parse_splits(e)
        # payer paid e.amount
        balances[e.payer_id] += e.amount
        # everyone owes their split
        for uid, amt in splits.items():
            balances[uid] -= amt

    # remove zero balances
    balances = {u: round(b, 2) for u, b in balances.items() if abs(b) > 0.009}

    # creditors (+), debtors (-)
    creditors = sorted([(u, b) for u, b in balances.items() if b > 0], key=lambda x: x[1], reverse=False)
    debtors = sorted([(u, b) for u, b in balances.items() if b < 0], key=lambda x: x[1])

    i, j = 0, 0
    settlements = []
    # convert to lists we can manipulate
    creditors = creditors[:]  # (id, amount)
    debtors = debtors[:]      # (id, negative amount)
    while i < len(debtors) and j < len(creditors):
        d_id, d_amt = debtors[i]
        c_id, c_amt = creditors[j]
        # amounts are signed; d_amt negative
        pay = min(c_amt, -d_amt)
        if pay <= 0:
            break
        settlements.append({"from_user": d_id, "to_user": c_id, "amount": round(pay, 2)})
        # update
        d_amt += pay
        c_amt -= pay
        debtors[i] = (d_id, round(d_amt, 2))
        creditors[j] = (c_id, round(c_amt, 2))
        if abs(debtors[i][1]) < 0.01:
            i += 1
        if abs(creditors[j][1]) < 0.01:
            j += 1

    # response: balances + settlements
    return {"balances": balances, "settlements": settlements}
