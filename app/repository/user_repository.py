from sqlalchemy.orm import Session
from .. import models, schemas, auth

def create_user(db: Session, user_in: schemas.UserCreate):
    hashed = auth.hash_password(user_in.password)
    db_user = models.User(email=user_in.email, hashed_password=hashed, name=user_in.name)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def get_user(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()