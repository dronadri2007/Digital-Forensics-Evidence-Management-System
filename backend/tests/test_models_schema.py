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


def test_all_19_tables_registered():
    from app.models import Base
    names = set(Base.metadata.tables.keys())
    expected = {
        "households", "citizens", "criminal_records", "phones", "vehicles",
        "cctv_cameras", "bank_accounts", "social_profiles",
        "cell_pings", "call_records", "cctv_sightings", "financial_transactions",
        "anpr_events", "social_posts", "breach_dumps",
        "cases", "case_evidence", "witness_reports", "investigation_log",
    }
    assert expected == names


def test_telemetry_tables_have_case_id():
    from app.models import Base
    for t in ("cell_pings", "call_records", "cctv_sightings",
              "financial_transactions", "anpr_events", "social_posts", "breach_dumps"):
        assert "case_id" in Base.metadata.tables[t].columns


@pytest.mark.slow
def test_create_all_and_drop_all_roundtrip(engine):
    from seed.schema import create_all_tables, drop_all_tables, ensure_extensions
    from app.db import raw_connection
    from sqlalchemy import inspect
    with raw_connection() as conn:
        ensure_extensions(conn)
        conn.commit()
    drop_all_tables()
    create_all_tables()
    tables = set(inspect(engine).get_table_names())
    assert {"citizens", "cell_pings", "cases"}.issubset(tables)
    drop_all_tables()
