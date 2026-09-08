"""pivot_digital_identity — OSINT chaining over `social_profiles`,
`social_posts`, `breach_dumps` (+ `households` for IP). case_id predicate on
social_posts and breach_dumps. Resolves handle -> breach email -> profile
recovery_email -> citizen_id."""
import re

from sqlalchemy import text
from sqlalchemy.orm import Session

_IP_RE = re.compile(r"^\d{1,3}(\.\d{1,3}){3}$")

_PROFILE_BY_USERNAME = text(
    "SELECT username, platform, display_name, bio, recovery_email, is_private, citizen_id "
    "FROM social_profiles WHERE lower(username) = lower(:q)"
)
_PROFILE_BY_EMAIL = text(
    "SELECT username, platform, display_name, bio, recovery_email, is_private, citizen_id "
    "FROM social_profiles WHERE lower(recovery_email) = lower(:q)"
)
_POSTS_BY_HANDLE = text(
    "SELECT handle, content, posted_time, reply_to FROM social_posts "
    "WHERE lower(handle) = lower(:q) AND (case_id IS NULL OR case_id = :case_id) "
    "ORDER BY posted_time DESC LIMIT 20"
)
_BREACH_BY_USERNAME = text(
    "SELECT breach_source, leaked_username, leaked_email, host(leaked_ip) AS leaked_ip, password_hash "
    "FROM breach_dumps WHERE lower(leaked_username) = lower(:q) "
    "AND (case_id IS NULL OR case_id = :case_id)"
)
_BREACH_BY_EMAIL = text(
    "SELECT breach_source, leaked_username, leaked_email, host(leaked_ip) AS leaked_ip, password_hash "
    "FROM breach_dumps WHERE lower(leaked_email) = lower(:q) "
    "AND (case_id IS NULL OR case_id = :case_id)"
)
_BREACH_BY_IP = text(
    "SELECT breach_source, leaked_username, leaked_email, host(leaked_ip) AS leaked_ip, password_hash "
    "FROM breach_dumps WHERE leaked_ip = CAST(:q AS inet) "
    "AND (case_id IS NULL OR case_id = :case_id)"
)
_HOUSEHOLDS_BY_IP = text(
    "SELECT household_id, address FROM households WHERE wan_ip = CAST(:q AS inet)"
)


def _profile_dict(r) -> dict:
    return {
        "username": r["username"], "platform": r["platform"],
        "display_name": r["display_name"], "bio": r["bio"],
        "recovery_email": r["recovery_email"], "is_private": bool(r["is_private"]),
        "citizen_id": str(r["citizen_id"]) if r["citizen_id"] else None,
    }


def _breach_dict(r) -> dict:
    return {
        "breach_source": r["breach_source"], "leaked_username": r["leaked_username"],
        "leaked_email": r["leaked_email"], "leaked_ip": r["leaked_ip"],
        "password_hash": r["password_hash"],
    }


def pivot_digital_identity(session: Session, query: str, *, case_id: "str | None" = None) -> dict:
    q = (query or "").strip()
    params = {"q": q, "case_id": case_id}
    profiles, posts, breaches, households = [], [], [], []
    resolved = None

    if "@" in q:
        kind = "email"
    elif _IP_RE.match(q):
        kind = "ip"
    else:
        kind = "handle"

    if kind == "handle":
        profiles = [_profile_dict(r) for r in
                    session.execute(_PROFILE_BY_USERNAME, params).mappings()]
        posts = [
            {"handle": r["handle"], "content": r["content"],
             "posted_time": r["posted_time"].isoformat(), "reply_to": r["reply_to"]}
            for r in session.execute(_POSTS_BY_HANDLE, params).mappings()
        ]
        breaches = [_breach_dict(r) for r in
                    session.execute(_BREACH_BY_USERNAME, params).mappings()]
        for b in breaches:
            if b["leaked_email"]:
                hit = session.execute(_PROFILE_BY_EMAIL,
                                      {"q": b["leaked_email"]}).mappings().first()
                if hit and hit["citizen_id"]:
                    resolved = str(hit["citizen_id"])
                    break
        if resolved is None:
            for p in profiles:
                if p["citizen_id"]:
                    resolved = p["citizen_id"]
                    break

    elif kind == "email":
        profiles = [_profile_dict(r) for r in
                    session.execute(_PROFILE_BY_EMAIL, params).mappings()]
        breaches = [_breach_dict(r) for r in
                    session.execute(_BREACH_BY_EMAIL, params).mappings()]
        for p in profiles:
            if p["citizen_id"]:
                resolved = p["citizen_id"]
                break

    else:  # ip
        breaches = [_breach_dict(r) for r in
                    session.execute(_BREACH_BY_IP, params).mappings()]
        households = [
            {"household_id": str(r["household_id"]), "address": r["address"]}
            for r in session.execute(_HOUSEHOLDS_BY_IP, {"q": q}).mappings()
        ]

    return {
        "profiles": profiles,
        "posts": posts,
        "breach_links": breaches,
        "resolved_citizen_id": resolved,
        "linked_households": households,
    }
