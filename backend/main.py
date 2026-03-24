import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import analytics, auth, checkins, loops, users

load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Loopify API starting up...")
    yield
    print("Loopify API shutting down...")


app = FastAPI(
    title="Loopify API",
    description="Backend for Loopify - a personalized habit & loop tracker.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)


# Update ALLOWED_ORIGINS when deploying to production.
default_origins = [
    "http://localhost:3000",
    "exp://192.168.29.106:8081",
    "http://localhost:8081"
    "https://loopify3.vercel.app",
]

env_origins = os.getenv("ALLOWED_ORIGINS", "")
ALLOWED_ORIGINS = [
    origin.strip()
    for origin in env_origins.split(",")
    if origin.strip()
] or default_origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    # Accept localhost / 127.0.0.1 on any dev port so browser preflight
    # requests do not fail when the frontend starts on a non-3000 port.
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth.router)
app.include_router(loops.router)
app.include_router(checkins.router)
app.include_router(analytics.router)
app.include_router(users.router)


@app.get("/", tags=["Health"])
async def root():
    return {"status": "ok", "app": "Loopify API", "version": "1.0.0"}


@app.get("/health", tags=["Health"])
async def health():
    return {"status": "healthy"}
