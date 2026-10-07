"""Schema: Unit 1-N Skill 1-N Lesson 1-N Exercise; User N-M Skill via UserSkillProgress."""
from datetime import date, datetime

from sqlalchemy import JSON, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str]
    xp: Mapped[int] = mapped_column(default=0)
    streak: Mapped[int] = mapped_column(default=0)
    last_active: Mapped[date | None] = mapped_column(default=None)
    hearts: Mapped[int] = mapped_column(default=5)
    hearts_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
    gems: Mapped[int] = mapped_column(default=500)  # mocked
    daily_goal: Mapped[int] = mapped_column(default=20)
    xp_today: Mapped[int] = mapped_column(default=0)
    xp_today_date: Mapped[date | None] = mapped_column(default=None)


class Unit(Base):
    __tablename__ = "units"
    id: Mapped[int] = mapped_column(primary_key=True)
    order: Mapped[int]
    title: Mapped[str]
    color: Mapped[str] = mapped_column(default="#58cc02")
    skills: Mapped[list["Skill"]] = relationship(order_by="Skill.order")


class Skill(Base):
    __tablename__ = "skills"
    id: Mapped[int] = mapped_column(primary_key=True)
    unit_id: Mapped[int] = mapped_column(ForeignKey("units.id"))
    order: Mapped[int]
    title: Mapped[str]
    icon: Mapped[str] = mapped_column(default="⭐")
    lessons: Mapped[list["Lesson"]] = relationship(back_populates="skill")


class Lesson(Base):
    __tablename__ = "lessons"
    id: Mapped[int] = mapped_column(primary_key=True)
    skill_id: Mapped[int] = mapped_column(ForeignKey("skills.id"))
    skill: Mapped[Skill] = relationship(back_populates="lessons")
    exercises: Mapped[list["Exercise"]] = relationship(order_by="Exercise.order")


class Exercise(Base):
    __tablename__ = "exercises"
    id: Mapped[int] = mapped_column(primary_key=True)
    lesson_id: Mapped[int] = mapped_column(ForeignKey("lessons.id"))
    order: Mapped[int]
    type: Mapped[str]  # multiple_choice | translate_bank | match_pairs | fill_blank | type_answer
    prompt: Mapped[str]
    data: Mapped[dict] = mapped_column(JSON, default=dict)
    answer: Mapped[list] = mapped_column(JSON, default=list)  # accepted answers


class UserSkillProgress(Base):
    """A row means the user has completed that skill."""
    __tablename__ = "user_skill_progress"
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), primary_key=True)
    skill_id: Mapped[int] = mapped_column(ForeignKey("skills.id"), primary_key=True)
    completed_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
