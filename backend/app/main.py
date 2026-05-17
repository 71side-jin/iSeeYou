from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.admin.analysis import router as admin_analysis_router
from app.api.admin.auth import router as admin_auth_router
from app.api.admin.stats import router as admin_stats_router
from app.api.public.analysis import router as analysis_router
from app.api.public.health import router as health_router

app = FastAPI(title="I SEE YOU API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

for router, prefix in (
    (health_router, "/api/public"),
    (analysis_router, "/api/public"),
    (admin_auth_router, "/api/admin"),
    (admin_analysis_router, "/api/admin"),
    (admin_stats_router, "/api/admin"),
):
    app.include_router(router, prefix=prefix)
