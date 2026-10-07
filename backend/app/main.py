from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import seed
from .database import Base, SessionLocal, engine
from .routes import router

Base.metadata.create_all(engine)
with SessionLocal() as db:
    seed.run(db)

app = FastAPI(title="Duolingo Lite API")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
app.include_router(router)
