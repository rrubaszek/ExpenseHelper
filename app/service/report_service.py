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

    # balances per group: reuse settlement_service logic by computing settlement per group
    balances = {}
    groups_out = []
    for g in groups:
        # compute settlement balances for group
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
        user_balance = round(balances_map.get(uid, 0.0), 2)
        balances[g.id] = user_balance

        # Get group members
        group_members = group_repository.get_group_members(db, g.id)
        members_out = [{"id": m.id, "name": m.name, "email": m.email} for m in group_members]

        groups_out.append({
            "id": g.id,
            "name": g.name,
            "description": g.description,
            "balance": user_balance,
            "members": members_out
        })

    # Calculate total balance
    total_balance = round(sum(balances.values()), 2)

    # expenses: those the user paid and those where user participates
    expenses = settlement_repository.list_expenses_for_user(db, uid)
    expense_history = []
    for e in expenses:
        group = group_repository.get_group_by_id(db, e.group_id)
        expense_history.append({
            "id": e.id,
            "group_id": e.group_id,
            "group_name": group.name if group else None,
            "payer_id": e.payer_id,
            "amount": e.amount,
            "description": e.description,
            "splits": expense_repository.parse_splits(e),
            "created_at": e.created_at,
        })

    # payments made or received by the user
    payments = settlement_repository.list_payments_for_user(db, uid)
    payment_history = []
    for p in payments:
        group = group_repository.get_group_by_id(db, p.group_id)
        payment_history.append({
            "id": p.id,
            "from_user": p.from_user,
            "to_user": p.to_user,
            "group_id": p.group_id,
            "group_name": group.name if group else None,
            "amount": p.amount,
            "created_at": p.created_at,
        })

    return {
        "user": {"id": current_user.id, "email": current_user.email, "name": current_user.name},
        "total_balance": total_balance,
        "groups": groups_out,
        "expense_history": expense_history,
        "payment_history": payment_history,
    }
