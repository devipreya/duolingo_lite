"""Seeds a small Spanish course (2 units, 5 skills, 1 lesson of 8 exercises each),
a sample learner with some progress, and a few leaderboard rivals."""
import random
import re
from datetime import date, timedelta

from .models import Exercise, Lesson, Skill, Unit, User, UserSkillProgress

# unit: (title, color, [(skill title, icon, words[(es, en)], sentences[(en, es, blank)])])
CONTENT = [
    ("Basics", "#58cc02", [
        ("Greetings", "👋",
         [("hola", "hello"), ("adiós", "goodbye"), ("buenos días", "good morning"),
          ("buenas noches", "good night"), ("gracias", "thank you"), ("por favor", "please")],
         [("Hello, I am Ana", "Hola, soy Ana", "soy"), ("Thank you very much", "Muchas gracias", "gracias")]),
        ("Food", "🍎",
         [("el agua", "the water"), ("el pan", "the bread"), ("la leche", "the milk"),
          ("la manzana", "the apple"), ("el queso", "the cheese"), ("el arroz", "the rice")],
         [("I eat bread", "Yo como pan", "como"), ("We drink water", "Nosotros bebemos agua", "bebemos")]),
        ("People", "🧑‍🤝‍🧑",
         [("el niño", "the boy"), ("la niña", "the girl"), ("el hombre", "the man"),
          ("la mujer", "the woman"), ("el amigo", "the friend"), ("la familia", "the family")],
         [("The girl is a student", "La niña es estudiante", "es"), ("I have a family", "Yo tengo una familia", "tengo")]),
    ]),
    ("Around Town", "#1cb0f6", [
        ("Places", "🏙️",
         [("la casa", "the house"), ("la escuela", "the school"), ("la ciudad", "the city"),
          ("el parque", "the park"), ("la tienda", "the store"), ("el hotel", "the hotel")],
         [("The school is big", "La escuela es grande", "grande"), ("Where is the hotel?", "¿Dónde está el hotel?", "hotel")]),
        ("Numbers", "🔢",
         [("uno", "one"), ("dos", "two"), ("tres", "three"), ("cuatro", "four"), ("cinco", "five"), ("seis", "six")],
         [("I have two cats", "Tengo dos gatos", "dos"), ("We have five apples", "Tenemos cinco manzanas", "cinco")]),
    ]),
]
FILLER_ES = ["el", "la", "un", "una", "y", "de", "en", "que"]
FILLER_EN = ["the", "a", "is", "and", "of", "in", "to", "my"]


def _answers(es: str) -> list[str]:
    head, _, rest = es.partition(" ")
    return [es, rest] if head in ("el", "la") and rest else [es]


def build(words, sents, rng):
    es_pool, en_pool = [w[0] for w in words], [w[1] for w in words]

    def mc(i, to_es):
        es, en = words[i]
        right, pool = (es, es_pool) if to_es else (en, en_pool)
        choices = [right] + rng.sample([x for x in pool if x != right], 2)
        rng.shuffle(choices)
        prompt = f"Which of these is “{en}”?" if to_es else f"What does “{es}” mean?"
        return dict(type="multiple_choice", prompt=prompt, data={"choices": choices}, answer=[right])

    def match(start):
        group = [words[(start + k) % len(words)] for k in range(4)]
        pairs = [[en, es] for es, en in group]
        left, right = [p[0] for p in pairs], [p[1] for p in pairs]
        rng.shuffle(left); rng.shuffle(right)
        return dict(type="match_pairs", prompt="Tap the matching pairs",
                    data={"left": left, "right": right, "pairs": pairs}, answer=[])

    def bank(i, to_es):
        en, es, _ = sents[i]
        tokens = re.sub(r"[¿?,]", "", es if to_es else en).split()
        extras = [x for x in (es_pool + FILLER_ES if to_es else en_pool + FILLER_EN) if x not in tokens]
        words_ = tokens + rng.sample(extras, 3)
        rng.shuffle(words_)
        return dict(type="translate_bank", prompt="Write this in " + ("Spanish" if to_es else "English"),
                    data={"source": en if to_es else es, "words": words_}, answer=[es if to_es else en])

    def type_in(i):
        es, en = words[i]
        return dict(type="type_answer", prompt=f"Type this in Spanish: {en}",
                    data={"hint": "Type in Spanish"}, answer=_answers(es))

    def fill(i):
        en, es, blank = sents[i]
        extras = [x for x in es_pool + FILLER_ES if x != blank and x not in es.split()]
        choices = [blank] + rng.sample(extras, 2)
        rng.shuffle(choices)
        shown = re.sub(rf"(?<!\w){re.escape(blank)}(?!\w)", "_____", es, count=1)
        return dict(type="fill_blank", prompt="Fill in the missing word",
                    data={"sentence": shown, "translation": en, "choices": choices}, answer=[blank])

    return [mc(0, True), match(0), bank(0, True), type_in(1), fill(1), mc(2, False), bank(1, False), match(2)]


def run(db) -> None:
    if db.query(Unit).first():
        return
    skills = []
    for u_i, (title, color, skill_defs) in enumerate(CONTENT, 1):
        unit = Unit(order=u_i, title=title, color=color)
        db.add(unit); db.flush()
        for s_i, (s_title, icon, words, sents) in enumerate(skill_defs, 1):
            skill = Skill(unit_id=unit.id, order=s_i, title=s_title, icon=icon)
            db.add(skill); db.flush()
            skills.append(skill)
            lesson = Lesson(skill_id=skill.id)
            db.add(lesson); db.flush()
            rng = random.Random(skill.id)
            for n, ex in enumerate(build(words, sents, rng), 1):
                db.add(Exercise(lesson_id=lesson.id, order=n, **ex))

    today = date.today()
    me = User(id=1, name="Learner", xp=60, streak=2, last_active=today - timedelta(days=1))
    db.add(me); db.flush()
    db.add(UserSkillProgress(user_id=me.id, skill_id=skills[0].id))
    for name, xp in [("Maria", 320), ("Chen", 250), ("Aarav", 180), ("Lena", 110), ("Omar", 40)]:
        db.add(User(name=name, xp=xp, streak=random.randint(1, 15)))
    db.commit()
