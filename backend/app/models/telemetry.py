import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import String, Integer, BigInteger, Boolean, Float, Numeric, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, ARRAY, INET
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class CellPing(Base):
    __tablename__ = "cell_pings"
    ping_id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    phone_number: Mapped[str] = mapped_column(String(32), index=True)
    tower_id: Mapped[str] = mapped_column(String(16), index=True)
    ping_time: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    signal_strength_dbm: Mapped[int] = mapped_column(Integer)
    case_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("cases.case_id"), nullable=True, index=True)


class CallRecord(Base):
    __tablename__ = "call_records"
    cdr_id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    caller_num: Mapped[str] = mapped_column(String(32), index=True)
    receiver_num: Mapped[str] = mapped_column(String(32), index=True)
    start_time: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    duration_sec: Mapped[int] = mapped_column(Integer, default=0)
    is_sms: Mapped[bool] = mapped_column(Boolean, default=False)
    tower_id: Mapped[str | None] = mapped_column(String(16), nullable=True)
    case_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("cases.case_id"), nullable=True)


class CctvSighting(Base):
    __tablename__ = "cctv_sightings"
    sighting_id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    camera_id: Mapped[str] = mapped_column(ForeignKey("cctv_cameras.camera_id"), index=True)
    seen_time: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    citizen_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("citizens.citizen_id"), nullable=True)
    detected_height_cm: Mapped[int] = mapped_column(Integer)
    clothing_tags: Mapped[list[str]] = mapped_column(ARRAY(String(32)), default=list)
    face_confidence: Mapped[Decimal] = mapped_column(Numeric(3, 2))
    case_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("cases.case_id"), nullable=True)


class FinancialTransaction(Base):
    __tablename__ = "financial_transactions"
    tx_id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    account_id: Mapped[str] = mapped_column(String(24), index=True)
    merchant_name: Mapped[str] = mapped_column(String(96))
    merchant_category: Mapped[str] = mapped_column(String(32))
    amount: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    tx_time: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    atm_id: Mapped[str | None] = mapped_column(String(16), nullable=True)
    is_cash_withdrawal: Mapped[bool] = mapped_column(Boolean, default=False)
    terminal_lat: Mapped[float | None] = mapped_column(Float, nullable=True)
    terminal_lon: Mapped[float | None] = mapped_column(Float, nullable=True)
    case_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("cases.case_id"), nullable=True)


class AnprEvent(Base):
    __tablename__ = "anpr_events"
    anpr_id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    border_camera_id: Mapped[str] = mapped_column(String(16))
    plate_number: Mapped[str] = mapped_column(String(16), index=True)
    seen_time: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    direction: Mapped[str] = mapped_column(String(12))
    observed_make: Mapped[str] = mapped_column(String(32))
    observed_model: Mapped[str] = mapped_column(String(32))
    case_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("cases.case_id"), nullable=True)


class SocialPost(Base):
    __tablename__ = "social_posts"
    post_id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    handle: Mapped[str] = mapped_column(String(48), index=True)
    content: Mapped[str] = mapped_column(Text)
    posted_time: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    reply_to: Mapped[str | None] = mapped_column(String(48), nullable=True)
    case_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("cases.case_id"), nullable=True)


class BreachDump(Base):
    __tablename__ = "breach_dumps"
    breach_id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    breach_source: Mapped[str] = mapped_column(String(64))
    leaked_username: Mapped[str] = mapped_column(String(64), index=True)
    leaked_email: Mapped[str] = mapped_column(String(128), index=True)
    leaked_ip: Mapped[str | None] = mapped_column(INET, nullable=True)
    password_hash: Mapped[str] = mapped_column(String(64))
    case_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("cases.case_id"), nullable=True)
