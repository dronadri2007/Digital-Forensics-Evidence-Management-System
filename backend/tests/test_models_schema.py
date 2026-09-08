import pytest
from app.models import Base


def test_base_world_tables_registered():
    names = set(Base.metadata.tables.keys())
    expected = {
        "households", "citizens", "criminal_records", "phones",
        "vehicles", "cctv_cameras", "bank_accounts", "social_profiles",
    }
    assert expected.issubset(names)


def test_citizen_columns_match_spec():
    cols = set(Base.metadata.tables["citizens"].columns.keys())
    expected = {
        "citizen_id", "national_id", "full_name", "aliases", "dob", "gender",
        "address", "address_updated_year", "legal_status", "household_id",
        "occupation", "workplace_name", "shift_pattern", "is_unemployed",
        "phone_number", "registered_plate", "photo_url",
    }
    assert cols == expected


def test_criminal_records_is_small_table_shape():
    cols = set(Base.metadata.tables["criminal_records"].columns.keys())
    assert cols == {"criminal_id", "citizen_id", "priors_summary", "fingerprint_hash", "dna_string"}
