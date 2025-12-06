from sqlalchemy.orm import Session
from .. import models, schemas
from typing import List
from sqlalchemy import or_, text


def create_payment(db: Session, payment_in: schemas.PaymentReceipt):
    p = models.Payment(
        from_user=payment_in.from_user,
        to_user=payment_in.to_user,
        amount=payment_in.amount,
        group_id=getattr(payment_in, 'group_id', None),
    )
    db.add(p)
    db.commit()
    db.refresh(p)
    return p


def list_payments_for_group(db: Session, group_id: int):
    return db.query(models.Payment).filter(models.Payment.group_id == group_id).order_by(models.Payment.created_at.desc()).all()


def list_payments_for_user(db: Session, user_id: int) -> List[models.Payment]:
    return db.query(models.Payment).filter(or_(models.Payment.from_user == user_id, models.Payment.to_user == user_id)).order_by(models.Payment.created_at.desc()).all()


def list_expenses_for_user(db: Session, user_id: int) -> List[models.Expense]:
    # expenses where user is payer
    payer_q = db.query(models.Expense).filter(models.Expense.payer_id == user_id)
    # expenses where user is a participant in splits (stored as CSV "uid:amt,...")
    participant_q = db.query(models.Expense).filter(models.Expense.splits.like(f"%{user_id}:%"))
    # union results
    return payer_q.union(participant_q).order_by(models.Expense.created_at.desc()).all()


def list_groups_for_user(db: Session, user_id: int):
    # join association table
    return db.query(models.Group).join(models.group_members).filter(models.group_members.c.user_id == user_id).all()
