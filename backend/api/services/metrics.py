from typing import Dict, Any

class MetricsService:
    @staticmethod
    def get_dashboard_metrics() -> Dict[str, Any]:
        """
        Calculates and returns metrics for the primary enterprise dashboard.
        In Sprint 0, this returns pristine mock data matching Chronicle AI metrics.
        """
        return {
            "knowledge_health": 94.2,
            "decision_count": 142,
            "experts_found": 18,
            "projects_monitored": 6,
            "active_discussions": 24,
            "recent_decisions": [
                {
                    "id": 1,
                    "title": "Migrate search service from Elasticsearch to Pinecone",
                    "consequences": "Faster vector searches but higher hosting costs",
                    "project": "Search Upgrade",
                    "status": "accepted",
                    "timestamp": "2 hours ago"
                },
                {
                    "id": 2,
                    "title": "Deprecate legacy WebSocket connection service in favor of SSE",
                    "consequences": "Improved mobile client battery life and simpler backend scaling",
                    "project": "Real-time Gateway",
                    "status": "proposed",
                    "timestamp": "5 hours ago"
                }
            ]
        }
