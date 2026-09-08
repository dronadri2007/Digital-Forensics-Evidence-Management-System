"""Shared pure helpers for the forensic tools. No DB access here."""
from datetime import datetime, timezone

CASE_PRED = "(case_id IS NULL OR case_id = :case_id)"


def parse_ts(value: "str | datetime") -> datetime:
    if isinstance(value, datetime):
        return value if value.tzinfo else value.replace(tzinfo=timezone.utc)
    s = str(value).strip()
    if s.endswith("Z"):
        s = s[:-1] + "+00:00"
    dt = datetime.fromisoformat(s)  # raises ValueError on garbage
    return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)


def hamming_hex(a: str, b: str) -> int:
    """Bitwise Hamming distance between two equal-length hex strings.
    On length mismatch returns a guaranteed-non-match value."""
    if len(a) != len(b):
        return max(len(a), len(b)) * 4
    total = 0
    for x, y in zip(a, b):
        total += bin(int(x, 16) ^ int(y, 16)).count("1")
    return total
