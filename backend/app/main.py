from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import (
    auth,
    colleges,
    branches,
    subjects,
    units,
    resources,
    analytics,
    admin_tools,
    admin_bulk,
)

app = FastAPI(title="OnSyllabus API")


# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://onsyllabus.in", "https://www.onsyllabus.in"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Routes
app.include_router(
    auth.router,
    prefix="/auth",
    tags=["auth"],
)

app.include_router(
    colleges.router,
    prefix="/colleges",
    tags=["colleges"],
)

app.include_router(
    branches.router,
    prefix="/branches",
    tags=["branches"],
)

app.include_router(
    subjects.router,
    prefix="/subjects",
    tags=["subjects"],
)

app.include_router(
    units.router,
    prefix="/units",
    tags=["units"],
)

app.include_router(
    resources.router,
    prefix="/resources",
    tags=["resources"],
)

app.include_router(
    analytics.router,
    prefix="/analytics",
    tags=["analytics"],
)

app.include_router(
    admin_tools.router,
    prefix="/admin",
    tags=["admin"],
)

app.include_router(
    admin_bulk.router,
    prefix="/admin",
    tags=["admin-bulk"],
)


@app.get("/health")
def health_check():
    return {"status": "ok"}