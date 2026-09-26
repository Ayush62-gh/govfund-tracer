import os
import pytest
import sqlite3
import pandas as pd
from ml.utils.db_sync import (
    save_audit_feedback,
    get_audit_feedback,
    count_labeled_feedback
)

@pytest.fixture
def temp_db(tmp_path, monkeypatch):
    """
    Fixture that redirects db_sync.get_db_path to a temporary SQLite database file.
    Ensures tests never touch the real backend/db/govfund.db.
    """
    db_file = str(tmp_path / "temp_govfund.db")
    monkeypatch.setattr("ml.utils.db_sync.get_db_path", lambda: db_file)
    return db_file

def test_save_and_get_audit_feedback(temp_db):
    """
    Test save_audit_feedback() with verdict='true_positive' succeeds
    and the row appears in get_audit_feedback().
    """
    save_audit_feedback('WRK-TEST-001', 'FLAG_POSSIBLE_DUPLICATE', 'true_positive', note='Verified duplicate')
    
    df_fb = get_audit_feedback()
    assert len(df_fb) == 1
    assert df_fb.iloc[0]['work_id'] == 'WRK-TEST-001'
    assert df_fb.iloc[0]['verdict'] == 'true_positive'
    assert df_fb.iloc[0]['flag_code'] == 'FLAG_POSSIBLE_DUPLICATE'

def test_save_audit_feedback_invalid_verdict(temp_db):
    """
    Test save_audit_feedback() with an invalid verdict (e.g. 'maybe') raises ValueError.
    """
    with pytest.raises(ValueError):
        save_audit_feedback('WRK-TEST-002', 'FLAG_COST_ANOMALY', 'maybe', note='Invalid verdict test')

def test_count_labeled_feedback_excludes_uncertain(temp_db):
    """
    Test count_labeled_feedback() correctly excludes 'uncertain' verdicts from its count.
    """
    save_audit_feedback('WRK-TEST-010', 'FLAG_A', 'true_positive')
    save_audit_feedback('WRK-TEST-011', 'FLAG_B', 'false_positive')
    save_audit_feedback('WRK-TEST-012', 'FLAG_C', 'uncertain')
    
    labeled_count = count_labeled_feedback()
    assert labeled_count == 2
