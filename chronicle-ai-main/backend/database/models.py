import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Float, Index, Boolean
from sqlalchemy.orm import relationship
from .session import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    slack_id = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, index=True)
    avatar_url = Column(String(255))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    messages = relationship("Message", back_populates="user")
    decisions_authored = relationship("Decision", back_populates="author")
    expert_profile = relationship("Expert", back_populates="user", uselist=False)
    audit_logs = relationship("AuditLog", back_populates="user")

class Channel(Base):
    __tablename__ = "channels"

    id = Column(Integer, primary_key=True, index=True)
    slack_channel_id = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=False)
    purpose = Column(Text)
    is_monitored = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    threads = relationship("Thread", back_populates="channel")
    messages = relationship("Message", back_populates="channel")

class Thread(Base):
    __tablename__ = "threads"

    id = Column(Integer, primary_key=True, index=True)
    slack_thread_ts = Column(String(50), unique=True, index=True, nullable=False)
    channel_id = Column(Integer, ForeignKey("channels.id"), nullable=False, index=True)
    summary = Column(Text)
    has_decision = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    channel = relationship("Channel", back_populates="threads")
    messages = relationship("Message", back_populates="thread")
    decisions = relationship("Decision", back_populates="thread")

class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    slack_msg_ts = Column(String(50), unique=True, index=True, nullable=False)
    thread_id = Column(Integer, ForeignKey("threads.id"), nullable=True, index=True)
    channel_id = Column(Integer, ForeignKey("channels.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    thread = relationship("Thread", back_populates="messages")
    channel = relationship("Channel", back_populates="messages")
    user = relationship("User", back_populates="messages")
    embeddings = relationship("Embedding", back_populates="message")

class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, index=True, nullable=False)
    description = Column(Text)
    status = Column(String(50), default="active") # active, archived, etc.
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    decisions = relationship("Decision", back_populates="project")

class Decision(Base):
    __tablename__ = "decisions"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    context = Column(Text)
    consequences = Column(Text)
    status = Column(String(50), default="proposed") # proposed, accepted, rejected, deprecated
    thread_id = Column(Integer, ForeignKey("threads.id"), nullable=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True, index=True)
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    thread = relationship("Thread", back_populates="decisions")
    project = relationship("Project", back_populates="decisions")
    author = relationship("User", back_populates="decisions_authored")
    adrs = relationship("ADR", back_populates="decision")

class Expert(Base):
    __tablename__ = "experts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False, index=True)
    skills = Column(Text) # Comma separated list of skills
    confidence_score = Column(Float, default=0.0)
    decision_count = Column(Integer, default=0)
    last_active = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="expert_profile")

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    url = Column(String(255))
    source = Column(String(50)) # Slack, Drive, Notion
    raw_content = Column(Text)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class GraphNode(Base):
    __tablename__ = "graph_nodes"

    id = Column(Integer, primary_key=True, index=True)
    node_type = Column(String(50), nullable=False, index=True) # User, Decision, Project, Tag
    label = Column(String(100), nullable=False)
    reference_id = Column(Integer) # ID of corresponding model (User, Decision, etc.)
    metadata_json = Column(Text) # JSON string

    # Relationships
    outgoing_edges = relationship("GraphEdge", foreign_keys="GraphEdge.source_id", back_populates="source_node")
    incoming_edges = relationship("GraphEdge", foreign_keys="GraphEdge.target_id", back_populates="target_node")

class GraphEdge(Base):
    __tablename__ = "graph_edges"

    id = Column(Integer, primary_key=True, index=True)
    source_id = Column(Integer, ForeignKey("graph_nodes.id"), nullable=False, index=True)
    target_id = Column(Integer, ForeignKey("graph_nodes.id"), nullable=False, index=True)
    edge_type = Column(String(50), nullable=False, index=True) # participates_in, decided_by, relates_to
    weight = Column(Float, default=1.0)

    # Relationships
    source_node = relationship("GraphNode", foreign_keys=[source_id], back_populates="outgoing_edges")
    target_node = relationship("GraphNode", foreign_keys=[target_id], back_populates="incoming_edges")

class ADR(Base):
    __tablename__ = "adrs"

    id = Column(Integer, primary_key=True, index=True)
    decision_id = Column(Integer, ForeignKey("decisions.id"), nullable=False, index=True)
    adr_number = Column(Integer, nullable=False, index=True)
    title = Column(String(200), nullable=False)
    status = Column(String(50), default="draft") # draft, accepted, superceded, deprecated
    context = Column(Text)
    decision_text = Column(Text)
    consequences = Column(Text)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    decision = relationship("Decision", back_populates="adrs")

class Embedding(Base):
    __tablename__ = "embeddings"

    id = Column(Integer, primary_key=True, index=True)
    message_id = Column(Integer, ForeignKey("messages.id"), nullable=True, index=True)
    entity_type = Column(String(50), nullable=False, index=True) # Message, Decision, Expert
    entity_id = Column(Integer, nullable=False, index=True)
    vector = Column(Text) # Stored as JSON list of floats for simple SQLite usage
    model_name = Column(String(100), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    message = relationship("Message", back_populates="embeddings")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    action = Column(String(100), nullable=False, index=True) # login, view_graph, export_adr
    details = Column(Text)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="audit_logs")

class DecisionReplay(Base):
    __tablename__ = "decision_replays"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    channel = Column(String(100), nullable=False)
    project = Column(String(100), nullable=False)
    proposal = Column(Text)
    problem_statement = Column(Text)
    participants = Column(Text) # Stored as JSON string
    arguments_for = Column(Text) # Stored as JSON string
    arguments_against = Column(Text) # Stored as JSON string
    benchmarks = Column(Text) # Stored as JSON string
    alternatives_considered = Column(Text) # Stored as JSON string
    decision = Column(Text)
    reasoning = Column(Text)
    impact = Column(Text)
    tradeoffs = Column(Text) # Stored as JSON string
    confidence_score = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    related_decisions = Column(Text) # Stored as JSON string
    related_experts = Column(Text) # Stored as JSON string
    related_documents = Column(Text) # Stored as JSON string

# Composite Indexes for optimized queries
Index("idx_graph_edge_source_target", GraphEdge.source_id, GraphEdge.target_id)
Index("idx_embedding_entity", Embedding.entity_type, Embedding.entity_id)
