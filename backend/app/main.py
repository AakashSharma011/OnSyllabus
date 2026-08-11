from fastapi import FastAPI

from app.api.routes import auth, colleges, branches, subjects, units, resources, analytics

app = FastAPI(title="OnSyllabus API")

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(colleges.router, prefix="/colleges", tags=["colleges"])
app.include_router(branches.router, prefix="/branches", tags=["branches"])
app.include_router(subjects.router, prefix="/subjects", tags=["subjects"])
app.include_router(units.router, prefix="/units", tags=["units"])
app.include_router(resources.router, prefix="/resources", tags=["resources"])
app.include_router(analytics.router, prefix="/analytics", tags=["analytics"])


@app.get("/health")
def health_check():
    return {"status": "ok"}