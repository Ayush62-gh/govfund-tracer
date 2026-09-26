import pandas as pd
from ml.detectors.fund_mismatch_detector import detect_fund_mismatch

def test_fund_mismatch_same_row_pass1(base_works_df):
    """
    Same-row case: one row with sanction_amount=200000, amount_disbursed=600000
    (ratio 3x, diff > 50000) -> FLAG_FUND_MISMATCH present (Pass 1).
    """
    row = {
        'work_id': 'WRK-MIS-001',
        'source': 'matched',
        'composite_key': 'KEY-001',
        'sanction_amount': 200000.0,
        'amount_disbursed': 600000.0
    }
    df = pd.concat([base_works_df, pd.DataFrame([row])], ignore_index=True)
    res = detect_fund_mismatch(df)
    
    assert 'WRK-MIS-001' in res
    assert 'FLAG_FUND_MISMATCH' in res['WRK-MIS-001']['flags']

def test_fund_mismatch_cross_row_pass2(base_works_df):
    """
    Cross-row case: two rows sharing same composite_key, one with source='sanctioned_only'
    and sanction_amount=200000, another with source='completed_only' and amount_disbursed=600000
    -> BOTH work_ids get FLAG_FUND_MISMATCH (Pass 2).
    """
    rows = [
        {
            'work_id': 'WRK-MIS-SANC',
            'source': 'sanctioned_only',
            'composite_key': 'KEY-SPLIT-01',
            'sanction_amount': 200000.0,
            'amount_disbursed': None
        },
        {
            'work_id': 'WRK-MIS-COMP',
            'source': 'completed_only',
            'composite_key': 'KEY-SPLIT-01',
            'sanction_amount': None,
            'amount_disbursed': 600000.0
        }
    ]
    df = pd.concat([base_works_df, pd.DataFrame(rows)], ignore_index=True)
    res = detect_fund_mismatch(df)
    
    assert 'WRK-MIS-SANC' in res
    assert 'WRK-MIS-COMP' in res

def test_fund_mismatch_matched_row_unflagged_regression(base_works_df):
    """
    Edge case (regression test for Phase 1 Step 4 fix): three rows sharing composite_key:
    - one source='matched' with sanction_amount=200000 AND amount_disbursed=200000 (consistent)
    - one source='sanctioned_only' with sanction_amount=200000
    - one source='completed_only' with amount_disbursed=600000
    Assert 'matched' row is NOT flagged (must not be spuriously cross-referenced).
    """
    rows = [
        {
            'work_id': 'WRK-MATCHED-CONSISTENT',
            'source': 'matched',
            'composite_key': 'KEY-SPLIT-02',
            'sanction_amount': 200000.0,
            'amount_disbursed': 200000.0
        },
        {
            'work_id': 'WRK-SANCTIONED-ONLY',
            'source': 'sanctioned_only',
            'composite_key': 'KEY-SPLIT-02',
            'sanction_amount': 200000.0,
            'amount_disbursed': None
        },
        {
            'work_id': 'WRK-COMPLETED-ONLY',
            'source': 'completed_only',
            'composite_key': 'KEY-SPLIT-02',
            'sanction_amount': None,
            'amount_disbursed': 600000.0
        }
    ]
    df = pd.concat([base_works_df, pd.DataFrame(rows)], ignore_index=True)
    res = detect_fund_mismatch(df)
    
    assert 'WRK-MATCHED-CONSISTENT' not in res
    assert 'WRK-SANCTIONED-ONLY' in res
    assert 'WRK-COMPLETED-ONLY' in res
