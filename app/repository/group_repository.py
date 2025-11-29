from sqlalchemy.orm import Session
from .. import models, schemas

def create_group(db: Session, group_in: schemas.GroupCreate):
    g = models.Group(name=group_in.name, description=group_in.description)
    if group_in.member_ids:
        members = db.query(models.User).filter(models.User.id.in_(group_in.member_ids)).all()
        g.members = members
    db.add(g)
    db.commit()
    db.refresh(g)
    return g

def get_group(db: Session, group_id: int):
    return db.query(models.Group).filter(models.Group.id == group_id).first()

def add_member_to_group(db: Session, group: models.Group, user: models.User):
    if user not in group.members:
        group.members.append(user)
        db.commit()
        db.refresh(group)
    return group