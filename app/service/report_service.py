from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..repository import settlement_repository, expense_repository, group_repository, user_repository
from .. import database
from ..auth_context import get_current_user

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/me")
def my_report(db: Session = Depends(database.get_db), current_user = Depends(get_current_user)):
    uid = current_user.id

    # groups the user belongs to
    groups = settlement_repository.list_groups_for_user(db, uid)
    groups_out = []
    for g in groups:
        groups_out.append({"id": g.id, "name": g.name, "description": g.description})

    # expenses: those the user paid and those where user participates
    expenses = settlement_repository.list_expenses_for_user(db, uid)
    expenses_out = []
    for e in expenses:
        expenses_out.append({
            "id": e.id,
            "group_id": e.group_id,
            "payer_id": e.payer_id,
            "amount": e.amount,
            "description": e.description,
            "splits": expense_repository.parse_splits(e),
            "created_at": e.created_at,
        })

    # payments made or received by the user
    payments = settlement_repository.list_payments_for_user(db, uid)
    payments_out = []
    for p in payments:
        payments_out.append({
            "id": p.id,
            "from_user": p.from_user,
            "to_user": p.to_user,
            "group_id": p.group_id,
            "amount": p.amount,
            "created_at": p.created_at,
        })

    # balances per group: reuse settlement_service logic by computing settlement per group
    balances = {}
    for g in groups:
        # compute settlement balances for group
        res = None
        # inline compute similar to compute_settlement to avoid circular import
        from collections import defaultdict
        balances_map = defaultdict(float)
        exps = expense_repository.list_expenses_for_group(db, g.id)
        for e in exps:
            splits = expense_repository.parse_splits(e)
            balances_map[e.payer_id] += e.amount
            for uid2, amt in splits.items():
                balances_map[uid2] -= amt
        pays = settlement_repository.list_payments_for_group(db, g.id)
        for p in pays:
            balances_map[p.from_user] += p.amount
            balances_map[p.to_user] -= p.amount
        # round and pick current user's balance
        balances[g.id] = round(balances_map.get(uid, 0.0), 2)

    return {
        "user": {"id": current_user.id, "email": current_user.email},
        "groups": groups_out,
        "balances": balances,
        "expenses": expenses_out,
        "payments": payments_out,
    }
