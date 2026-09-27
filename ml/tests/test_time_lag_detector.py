import pandas as pd
from ml.detectors.time_lag_detector import detect_time_lags

def test_sanction_delay_flagged(base_works_df):
    """
    recommended_date and sanction_date 400 days apart -> FLAG_SANCTION_DELAY present.
    Pass explicit ref_date parameter ('2026-01-01').
    """
    row = {
        'work_id': 'WRK-LAG-001',
        'recommended_date': '2024-01-01',
        'sanction_date': '2025-02-04',  # 400 days later
        'completion_date': '2025-06-01',
        'work_status': 'Completed'
    }
    df = pd.concat([base_works_df, pd.DataFrame([row])], ignore_index=True)
    res = detect_time_lags(df, ref_date='2026-01-01')
    
    assert 'WRK-LAG-001' in res
    assert 'FLAG_SANCTION_DELAY' in res['WRK-LAG-001']['flags']

def test_time_lag_normal_unflagged(base_works_df):
    """
    recommended_date and sanction_date 30 days apart, fully completed -> no flags.
    """
    row = {
        'work_id': 'WRK-LAG-NORM',
        'recommended_date': '2025-01-01',
        'sanction_date': '2025-01-31',
        'completion_date': '2025-05-01',
        'work_status': 'Completed'
    }
    df = pd.concat([base_works_df, pd.DataFrame([row])], ignore_index=True)
    res = detect_time_lags(df, ref_date='2026-01-01')
    
    assert 'WRK-LAG-NORM' not in res

def test_stagnant_work_flagged(base_works_df):
    """
    Sanctioned but not completed, sanction_date more than 2 years before ref_date
    -> FLAG_STAGNANT_WORK present.
    """
    row = {
        'work_id': 'WRK-STAGNANT-001',
        'recommended_date': '2023-01-01',
        'sanction_date': '2023-02-01',  # > 2 years before 2026-01-01
        'completion_date': None,
        'work_status': 'Ongoing'
    }
    df = pd.concat([base_works_df, pd.DataFrame([row])], ignore_index=True)
    res = detect_time_lags(df, ref_date='2026-01-01')
    
    assert 'WRK-STAGNANT-001' in res
    assert 'FLAG_STAGNANT_WORK' in res['WRK-STAGNANT-001']['flags']
