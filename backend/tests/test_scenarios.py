from seed.scenarios import load_frozen_scenarios


def test_load_frozen_scenarios_returns_empty_when_none_present():
    # scenarios/ holds only .gitkeep until Plan 03 — loader must tolerate that
    assert load_frozen_scenarios() == []
