from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session

from . import logic
from .database import get_db
from .models import Lesson, Skill, Unit, User, UserSkillProgress

router = APIRouter(prefix="/api")


def current_user(db: Session = Depends(get_db)) -> User:
    """Auth is simplified: a default learner (id=1) is always logged in."""
    u = db.get(User, 1)
    logic.regen_hearts(u)
    return u


def _done_ids(db: Session, user: User) -> set[int]:
    return {p.skill_id for p in db.query(UserSkillProgress).filter_by(user_id=user.id)}


@router.get("/me")
def me(request: Request, db: Session = Depends(get_db), user: User = Depends(current_user)):
    db.commit()
    return logic.summary(user, logic.today_of(request))


@router.get("/path")
def path(db: Session = Depends(get_db), user: User = Depends(current_user)):
    done, prev_done, current_set, units = _done_ids(db, user), True, False, []
    for unit in db.query(Unit).order_by(Unit.order):
        skills = []
        for s in unit.skills:
            state = "completed" if s.id in done else ("available" if prev_done else "locked")
            current = state == "available" and not current_set
            current_set = current_set or current
            skills.append({"id": s.id, "title": s.title, "icon": s.icon, "state": state,
                           "is_current": current, "lesson_id": s.lessons[0].id})
            prev_done = s.id in done
        units.append({"id": unit.id, "order": unit.order, "title": unit.title,
                      "color": unit.color, "skills": skills})
    return units


def _unlocked(db: Session, user: User, skill: Skill) -> bool:
    done = _done_ids(db, user)
    for s in db.query(Skill).join(Unit).order_by(Unit.order, Skill.order):
        if s.id == skill.id:
            return True
        if s.id not in done:
            return False
    return False


@router.get("/lessons/{lesson_id}")
def lesson(lesson_id: int, request: Request, db: Session = Depends(get_db),
           user: User = Depends(current_user)):
    l = db.get(Lesson, lesson_id)
    if not l:
        raise HTTPException(404, "Lesson not found")
    if not _unlocked(db, user, l.skill):
        raise HTTPException(403, "Skill is locked")
    db.commit()
    return {
        "id": l.id, "skill": l.skill.title,
        "exercises": [{"id": e.id, "type": e.type, "prompt": e.prompt, "data": e.data,
                       "answer": e.answer} for e in l.exercises],
        "user": logic.summary(user, logic.today_of(request)),
    }


@router.post("/lessons/{lesson_id}/wrong")
def wrong_answer(lesson_id: int, request: Request, db: Session = Depends(get_db), user: User = Depends(current_user)):
    """Called on every wrong answer: costs one heart (persisted)."""
    if user.hearts > 0:
        logic.lose_heart(user)
    db.commit()
    return logic.summary(user, logic.today_of(request))


class CompleteBody(BaseModel):
    mistakes: int = 0


@router.post("/lessons/{lesson_id}/complete")
def complete(lesson_id: int, body: CompleteBody, request: Request,
             db: Session = Depends(get_db), user: User = Depends(current_user)):
    l = db.get(Lesson, lesson_id)
    if not l or not _unlocked(db, user, l.skill):
        raise HTTPException(403, "Lesson unavailable")
    today = logic.today_of(request)
    perfect = body.mistakes == 0
    xp = logic.XP_LESSON + (logic.XP_PERFECT if perfect else 0)
    extended = logic.touch_streak(user, today)
    logic.add_xp(user, xp, today)
    if db.get(UserSkillProgress, (user.id, l.skill_id)) is None:
        db.add(UserSkillProgress(user_id=user.id, skill_id=l.skill_id))
    db.commit()
    return {"xp_earned": xp, "perfect": perfect, "streak_extended": extended,
            "user": logic.summary(user, today)}


@router.post("/hearts/refill")
def refill(request: Request, db: Session = Depends(get_db), user: User = Depends(current_user)):
    """Mocked 'practice / refill': restores all hearts for free."""
    user.hearts = logic.MAX_HEARTS
    db.commit()
    return logic.summary(user, logic.today_of(request))


@router.get("/leaderboard")
def leaderboard(db: Session = Depends(get_db)):
    users = db.query(User).order_by(User.xp.desc()).all()
    return [{"rank": i, "name": u.name, "xp": u.xp, "is_me": u.id == 1}
            for i, u in enumerate(users, 1)]
