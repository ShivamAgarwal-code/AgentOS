from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from backend.api.services.decision_replay import DecisionReplayService

router = APIRouter(prefix="/decision-replay", tags=["decision-replay"])

@router.get("")
@router.get("/")
def get_decision_replays():
    """
    Get all decision replays for the organization.
    """
    return DecisionReplayService.get_all_replays()

@router.get("/{id}")
def get_decision_replay(id: int):
    """
    Get a specific decision replay by ID.
    """
    replay = DecisionReplayService.get_replay_by_id(id)
    if not replay:
        raise HTTPException(status_code=404, detail=f"Decision replay with ID {id} not found")
    return replay

@router.post("/mock")
def create_mock_decision_replay(mock_data: Dict[str, Any]):
    """
    Register or simulate a custom mock decision replay.
    """
    return DecisionReplayService.add_mock_replay(mock_data)
