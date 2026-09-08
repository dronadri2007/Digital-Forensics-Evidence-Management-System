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


def test_all_telemetry_case_id_columns_are_indexed():
    from app.models import Base
    for t in ("cell_pings", "call_records", "cctv_sightings",
              "financial_transactions", "anpr_events", "social_posts", "breach_dumps"):
        tbl = Base.metadata.tables[t]
        indexed_cols = {tuple(ix.columns.keys()) for ix in tbl.indexes}
        assert ("case_id",) in indexed_cols, f"{t}.case_id is not indexed"


def test_design_indexes_present_by_name():
    from app.models import Base
    citizens_ix = {ix.name for ix in Base.metadata.tables["citizens"].indexes}
    assert {"idx_citizens_name_trgm", "idx_citizens_addr_trgm",
            "idx_citizens_household"}.issubset(citizens_ix)

    # GIN trigram opclasses are recorded on the Index
    name_ix = next(ix for ix in Base.metadata.tables["citizens"].indexes
                   if ix.name == "idx_citizens_name_trgm")
    assert name_ix.dialect_options["postgresql"]["using"] == "gin"
    assert name_ix.dialect_options["postgresql"]["ops"] == {"full_name": "gin_trgm_ops"}

    all_ix_names = {
        ix.name
        for tbl in Base.metadata.tables.values()
        for ix in tbl.indexes
    }
    composites = {
        "idx_pings_tower_time", "idx_pings_phone_time",
        "idx_cdr_caller", "idx_cdr_recv",
        "idx_sightings_cam_time", "idx_tx_account_time",
        "idx_anpr_plate_time", "idx_posts_handle_time",
        "idx_log_case_step",
    }
    present = composites & all_ix_names
    assert len(present) >= 4, f"expected >=4 composite indexes, found {sorted(present)}"
    assert present == composites, f"missing composite indexes: {sorted(composites - present)}"


def test_column_defaults_are_server_side():
    from app.models import Base
    checks = [
        ("citizens", "legal_status"),
        ("citizens", "is_unemployed"),
        ("citizens", "aliases"),
        ("phones", "is_prepaid"),
        ("case_evidence", "is_discovered"),
        ("cases", "status"),
        ("call_records", "duration_sec"),
        ("social_profiles", "bio"),
    ]
    for tbl_name, col_name in checks:
        col = Base.metadata.tables[tbl_name].columns[col_name]
        assert col.server_default is not None, f"{tbl_name}.{col_name} has no server_default"


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
