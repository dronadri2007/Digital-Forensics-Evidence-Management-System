from datetime import datetime, timezone

import pytest

from app.tools._common import parse_ts, hamming_hex, CASE_PRED


def test_parse_ts_handles_z_suffix():
    dt = parse_ts("2026-09-01T22:30:00Z")
    assert dt == datetime(2026, 9, 1, 22, 30, tzinfo=timezone.utc)
    assert dt.tzinfo is not None


def test_parse_ts_assumes_utc_for_naive():
    assert parse_ts("2026-09-01 22:30:00").tzinfo == timezone.utc


def test_parse_ts_passthrough_datetime_naive_gets_utc():
    naive = datetime(2026, 9, 1, 22, 30)
    assert parse_ts(naive).tzinfo == timezone.utc


def test_parse_ts_rejects_garbage():
    with pytest.raises(ValueError):
        parse_ts("not a date")


def test_hamming_hex_zero_for_identical():
    assert hamming_hex("abcd1234", "abcd1234") == 0


def test_hamming_hex_counts_bit_differences():
    # 0x0 ^ 0x1 = 1 bit; 0xf ^ 0x0 = 4 bits
    assert hamming_hex("0f", "10") == 1 + 4


def test_hamming_hex_length_mismatch_is_large():
    assert hamming_hex("ab", "abcd") == 16  # max(2,4)*4


def test_case_pred_literal():
    assert CASE_PRED == "(case_id IS NULL OR case_id = :case_id)"
