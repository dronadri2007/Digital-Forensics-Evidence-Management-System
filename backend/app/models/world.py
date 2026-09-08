import uuid
from datetime import date

from sqlalchemy import String, Integer, Boolean, Float, Date, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID, ARRAY, INET
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class Household(Base):
    __tablename__ = "households"
    household_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    address: Mapped[str] = mapped_column(String(256))
    lat: Mapped[float] = mapped_column(Float)
    lon: Mapped[float] = mapped_column(Float)
    household_type: Mapped[str] = mapped_column(String(16))
    wan_ip: Mapped[str] = mapped_column(INET)
    nearest_tower_id: Mapped[str] = mapped_column(String(16))


class Citizen(Base):
    __tablename__ = "citizens"
    citizen_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    national_id: Mapped[str | None] = mapped_column(String(32), unique=True, nullable=True)
    full_name: Mapped[str] = mapped_column(String(128))
    aliases: Mapped[list[str]] = mapped_column(ARRAY(String(64)), default=list)
    dob: Mapped[date] = mapped_column(Date)
    gender: Mapped[str] = mapped_column(String(16))
    address: Mapped[str] = mapped_column(String(256))
    address_updated_year: Mapped[int] = mapped_column(Integer)
    legal_status: Mapped[str] = mapped_column(String(16), default="ACTIVE")
    household_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("households.household_id"))
    occupation: Mapped[str] = mapped_column(String(64))
    workplace_name: Mapped[str | None] = mapped_column(String(96), nullable=True)
    shift_pattern: Mapped[str] = mapped_column(String(16))
    is_unemployed: Mapped[bool] = mapped_column(Boolean, default=False)
    phone_number: Mapped[str | None] = mapped_column(String(32), nullable=True)
    registered_plate: Mapped[str | None] = mapped_column(String(16), nullable=True)
    photo_url: Mapped[str | None] = mapped_column(String(256), nullable=True)


class CriminalRecord(Base):
    __tablename__ = "criminal_records"
    criminal_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    citizen_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("citizens.citizen_id"))
    priors_summary: Mapped[str] = mapped_column(Text)
    fingerprint_hash: Mapped[str] = mapped_column(String(64))
    dna_string: Mapped[str] = mapped_column(String(120))


class Phone(Base):
    __tablename__ = "phones"
    phone_number: Mapped[str] = mapped_column(String(32), primary_key=True)
    imei: Mapped[str] = mapped_column(String(20))
    citizen_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("citizens.citizen_id"), nullable=True)
    subscriber_name: Mapped[str] = mapped_column(String(128))
    is_prepaid: Mapped[bool] = mapped_column(Boolean, default=False)
    case_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("cases.case_id"), nullable=True)


class Vehicle(Base):
    __tablename__ = "vehicles"
    plate_number: Mapped[str] = mapped_column(String(16), primary_key=True)
    make: Mapped[str] = mapped_column(String(32))
    model: Mapped[str] = mapped_column(String(32))
    color: Mapped[str] = mapped_column(String(24))
    registered_citizen_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("citizens.citizen_id"), nullable=True)


class CctvCamera(Base):
    __tablename__ = "cctv_cameras"
    camera_id: Mapped[str] = mapped_column(String(16), primary_key=True)
    lat: Mapped[float] = mapped_column(Float)
    lon: Mapped[float] = mapped_column(Float)
    coverage_desc: Mapped[str] = mapped_column(String(96))


class BankAccount(Base):
    __tablename__ = "bank_accounts"
    account_id: Mapped[str] = mapped_column(String(24), primary_key=True)
    citizen_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("citizens.citizen_id"))


class SocialProfile(Base):
    __tablename__ = "social_profiles"
    username: Mapped[str] = mapped_column(String(48), primary_key=True)
    platform: Mapped[str] = mapped_column(String(16))
    display_name: Mapped[str] = mapped_column(String(96))
    bio: Mapped[str] = mapped_column(String(280), default="")
    recovery_email: Mapped[str] = mapped_column(String(128))
    citizen_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("citizens.citizen_id"), nullable=True)
    is_private: Mapped[bool] = mapped_column(Boolean, default=False)
