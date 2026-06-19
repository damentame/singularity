from fastapi import FastAPI

from app.config import settings
from app.routers import profiles, events, clients, service_providers, rfq

app = FastAPI(title=settings.app_name, debug=settings.debug)

app.include_router(profiles.router, prefix="/v1")
app.include_router(events.router, prefix="/v1")
app.include_router(clients.router, prefix="/v1")
app.include_router(service_providers.router, prefix="/v1")
app.include_router(rfq.router, prefix="/v1")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
