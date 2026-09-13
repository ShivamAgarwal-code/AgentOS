from fastapi import APIRouter
from backend.api.services.metrics import MetricsService

router = APIRouter(prefix="/metrics", tags=["metrics"])

@router.get("/")
def get_dashboard_metrics():
    """
    Get consolidated dashboard metrics for the Chronicle AI system.
    Strictly separation of concerns - routing delegates logic to MetricsService.
    """
    return MetricsService.get_dashboard_metrics()
