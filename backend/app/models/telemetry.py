import uuid
from datetime import datetime
from decimal import Decimal

import sqlalchemy as sa
from sqlalchemy import (
    String, Integer, BigInteger, Boolean, Float, Numeric, Text, DateTime, ForeignKey, Index,
)
from sqlalchemy.dialects.postgresql import UUID, ARRAY, INET
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class CellPing(Base):
    __tablename__ = "cell_pings"
    __table_args__ = (
        Index("idx_pings_tower_time", "tower_id", "ping_time"),
        Index("idx_pings_phone_time", "phone_number", "ping_time"),
    )
    ping_id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    phone_number: Mapped[str] = mapped_column(String(32))
    tower_id: Mapped[str] = mapped_column(String(16))
    ping_time: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    signal_strength_dbm: Mapped[int] = mapped_column(Integer)
    case_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("cases.case_id"), nullable=True, index=True)


class CallRecord(Base):
    __tablename__ = "call_records"
    __table_args__ = (
        Index("idx_cdr_caller", "caller_num", "start_time"),
        Index("idx_cdr_recv", "receiver_num", "start_time"),
    )
    cdr_id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    caller_num: Mapped[str] = mapped_column(String(32))
    receiver_num: Mapped[str] = mapped_column(String(32))
    start_time: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    duration_sec: Mapped[int] = mapped_column(Integer, default=0, server_default=sa.text("0"))
    is_sms: Mapped[bool] = mapped_column(Boolean, default=False, server_default=sa.text("false"))
    tower_id: Mapped[str | None] = mapped_column(String(16), nullable=True)
    case_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("cases.case_id"), nullable=True, index=True)


class CctvSighting(Base):
    __tablename__ = "cctv_sightings"
    __table_args__ = (
        Index("idx_sightings_cam_time", "camera_id", "seen_time"),
    )
    sighting_id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    camera_id: Mapped[str] = mapped_column(ForeignKey("cctv_cameras.camera_id"))
    seen_time: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    citizen_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("citizens.citizen_id"), nullable=True)
    detected_height_cm: Mapped[int] = mapped_column(Integer)
    clothing_tags: Mapped[list[str]] = mapped_column(
        ARRAY(String(32)), default=list, server_default=sa.text("'{}'")
    )
    face_confidence: Mapped[Decimal] = mapped_column(Numeric(3, 2))
    case_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("cases.case_id"), nullable=True, index=True)


class FinancialTransaction(Base):
    __tablename__ = "financial_transactions"
    __table_args__ = (
        Index("idx_tx_account_time", "account_id", "tx_time"),
    )
    tx_id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    account_id: Mapped[str] = mapped_column(String(24))
    merchant_name: Mapped[str] = mapped_column(String(96))
    merchant_category: Mapped[str] = mapped_column(String(32))
    amount: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    tx_time: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    atm_id: Mapped[str | None] = mapped_column(String(16), nullable=True)
    is_cash_withdrawal: Mapped[bool] = mapped_column(Boolean, default=False, server_default=sa.text("false"))
    terminal_lat: Mapped[float | None] = mapped_column(Float, nullable=True)
    terminal_lon: Mapped[float | None] = mapped_column(Float, nullable=True)
    case_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("cases.case_id"), nullable=True, index=True)


class AnprEvent(Base):
    __tablename__ = "anpr_events"
    __table_args__ = (
        Index("idx_anpr_plate_time", "plate_number", "seen_time"),
    )
    anpr_id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    border_camera_id: Mapped[str] = mapped_column(String(16))
    plate_number: Mapped[str] = mapped_column(String(16))
    seen_time: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    direction: Mapped[str] = mapped_column(String(12))
    observed_make: Mapped[str] = mapped_column(String(32))
    observed_model: Mapped[str] = mapped_column(String(32))
    case_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("cases.case_id"), nullable=True, index=True)


class SocialPost(Base):
    __tablename__ = "social_posts"
    __table_args__ = (
        Index("idx_posts_handle_time", "handle", "posted_time"),
    )
    post_id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    handle: Mapped[str] = mapped_column(String(48))
    content: Mapped[str] = mapped_column(Text)
    posted_time: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    reply_to: Mapped[str | None] = mapped_column(String(48), nullable=True)
    case_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("cases.case_id"), nullable=True, index=True)


class BreachDump(Base):
    __tablename__ = "breach_dumps"
    breach_id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    breach_source: Mapped[str] = mapped_column(String(64))
    leaked_username: Mapped[str] = mapped_column(String(64), index=True)
    leaked_email: Mapped[str] = mapped_column(String(128), index=True)
    leaked_ip: Mapped[str | None] = mapped_column(INET, nullable=True)
    password_hash: Mapped[str] = mapped_column(String(64))
    case_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("cases.case_id"), nullable=True, index=True)
