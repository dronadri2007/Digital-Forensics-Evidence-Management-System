import uuid
from datetime import datetime
from decimal import Decimal

import sqlalchemy as sa
from sqlalchemy import (
    String, Integer, BigInteger, Boolean, Float, Numeric, Text, DateTime, ForeignKey, Index, func,
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class Case(Base):
    __tablename__ = "cases"
    case_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String(128))
    tier: Mapped[int | None] = mapped_column(Integer, nullable=True)
    mode: Mapped[str] = mapped_column(String(12))          # FROZEN | WILDCARD
    status: Mapped[str] = mapped_column(String(16), default="ACTIVE", server_default="ACTIVE")
    victim_citizen_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("citizens.citizen_id"))
    crime_time: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    scene_address: Mapped[str] = mapped_column(String(256))
    scene_lat: Mapped[float] = mapped_column(Float)
    scene_lon: Mapped[float] = mapped_column(Float)
    briefing_text: Mapped[str] = mapped_column(Text)
    solution_json: Mapped[dict] = mapped_column(JSONB)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class CaseEvidence(Base):
    __tablename__ = "case_evidence"
    evidence_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    case_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("cases.case_id"), index=True)
    evidence_type: Mapped[str] = mapped_column(String(32))
    payload_json: Mapped[dict] = mapped_column(JSONB)
    is_discovered: Mapped[bool] = mapped_column(Boolean, default=False, server_default=sa.text("false"))


class WitnessReport(Base):
    __tablename__ = "witness_reports"
    report_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    case_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("cases.case_id"), index=True)
    witness_name: Mapped[str] = mapped_column(String(96))
    statement_text: Mapped[str] = mapped_column(Text)
    observed_time: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    reliability_penalty: Mapped[Decimal] = mapped_column(Numeric(3, 2))


class InvestigationLog(Base):
    __tablename__ = "investigation_log"
    __table_args__ = (
        Index("idx_log_case_step", "case_id", "step_no"),
    )
    log_id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    case_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("cases.case_id"))
    step_no: Mapped[int] = mapped_column(Integer)
    role: Mapped[str] = mapped_column(String(16))          # INVESTIGATOR | AGENT | TOOL
    content: Mapped[str | None] = mapped_column(Text, nullable=True)
    tool_name: Mapped[str | None] = mapped_column(String(48), nullable=True)
    tool_args: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    tool_result: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
