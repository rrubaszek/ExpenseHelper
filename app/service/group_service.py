from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from repository import group_repository, user_repository
from .. import database, schemas
from ..auth_context import get_current_user

router = APIRouter(prefix="/groups", tags=["groups"])

@router.post("/", response_model=schemas.GroupOut)
def create_group(group_in: schemas.GroupCreate, db: Session = Depends(database.get_db), current_user = Depends(get_current_user)):
    # ensure creator is member
    if current_user.id not in group_in.member_ids:
        group_in.member_ids.append(current_user.id)
    g = group_repository.create_group(db, group_in)
    return g

@router.get("/{group_id}", response_model=schemas.GroupOut)
def get_group(group_id: int, db: Session = Depends(database.get_db), current_user = Depends(get_current_user)):
    g = group_repository.get_group(db, group_id)
    if not g:
        raise HTTPException(status_code=404, detail="Group not found")
    # optional: check membership
    return g

@router.post("/{group_id}/members/{user_id}", response_model=schemas.GroupOut)
def add_member(group_id:int, user_id:int, db: Session = Depends(database.get_db), current_user = Depends(get_current_user)):
    g = group_repository.get_group(db, group_id)
    if not g:
        raise HTTPException(status_code=404)
    user = user_repository.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404)
    g = group_repository.add_member_to_group(db, g, user)
    return g
