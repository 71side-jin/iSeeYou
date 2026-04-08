from fastapi import FastAPI
from app.api.public.health import router as health_router
from app.api.public.analysis import router as analysis_router
from app.api.admin.analysis import router as admin_analysis_router
from app.api.admin.stats import router as admin_stats_router

app = FastAPI(title="I SEE YOU API")

app.include_router(health_router, prefix="/api/public")
app.include_router(analysis_router, prefix="/api/public")

app.include_router(admin_analysis_router, prefix="/api/admin")
app.include_router(admin_stats_router, prefix="/api/admin")


from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)