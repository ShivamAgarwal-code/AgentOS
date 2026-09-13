from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime

class DecisionReplayBase(BaseModel):
    title: str
    channel: str
    project: str
    proposal: str
    problem_statement: str
    participants: List[str]
    arguments_for: List[Dict[str, Any]]
    arguments_against: List[Dict[str, Any]]
    benchmarks: List[Dict[str, Any]]
    alternatives_considered: List[Dict[str, Any]]
    decision: str
    reasoning: str
    impact: str
    tradeoffs: List[str]
    confidence_score: float
    related_decisions: List[str]
    related_experts: List[str]
    related_documents: List[Dict[str, str]]

class DecisionReplayCreate(DecisionReplayBase):
    pass

class DecisionReplaySchema(DecisionReplayBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
