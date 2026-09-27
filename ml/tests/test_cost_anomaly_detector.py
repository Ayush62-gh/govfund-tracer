import pandas as pd
from ml.detectors.cost_anomaly_detector import detect_cost_anomalies

def test_cost_anomaly_outlier_flagged(base_works_df):
    """
    12 rows in same (state, category) group with sanction_amount ~200000-300000,
    1 row with sanction_amount = 5000000 (10x peer group) -> outlier work_id appears in results.
    """
    rows = []
    for i in range(12):
        rows.append({
            'work_id': f'WRK-COST-{i:03d}',
            'state': 'Punjab',
            'category': 'Normal/Others',
            'sanction_amount': 250000.0,
            'recommended_date': '2025-01-01',
            'sanction_date': '2025-02-01'
        })
    # Outlier row
    rows.append({
        'work_id': 'WRK-COST-OUTLIER',
        'state': 'Punjab',
        'category': 'Normal/Others',
        'sanction_amount': 5000000.0,
        'recommended_date': '2025-01-01',
        'sanction_date': '2025-02-01'
    })
    
    df = pd.concat([base_works_df, pd.DataFrame(rows)], ignore_index=True)
    res = detect_cost_anomalies(df)
    
    assert 'WRK-COST-OUTLIER' in res
    assert res['WRK-COST-OUTLIER']['iqr_flag'] is True

def test_cost_anomaly_normal_unflagged(base_works_df):
    """
    All 12 rows within normal range (identical typical amounts) -> none flagged.
    """
    rows = []
    for i in range(12):
        rows.append({
            'work_id': f'WRK-NORM-{i:03d}',
            'state': 'Punjab',
            'category': 'Normal/Others',
            'sanction_amount': 250000.0,
            'recommended_date': '2025-01-01',
            'sanction_date': '2025-02-01'
        })
    df = pd.concat([base_works_df, pd.DataFrame(rows)], ignore_index=True)
    res = detect_cost_anomalies(df)
    
    assert len(res) == 0

def test_cost_anomaly_small_group_skipped(base_works_df):
    """
    Group with only 5 rows (below <10 insufficient_baseline threshold) with one row 10x the others
    -> assert it is NOT flagged via IQR (insufficient_baseline suppresses IQR flagging).
    """
    rows = []
    for i in range(4):
        rows.append({
            'work_id': f'WRK-SMALL-{i:03d}',
            'state': 'Goa',
            'category': 'SmallCategory',
            'sanction_amount': 100000.0,
            'recommended_date': '2025-01-01',
            'sanction_date': '2025-02-01'
        })
    rows.append({
        'work_id': 'WRK-SMALL-OUTLIER',
        'state': 'Goa',
        'category': 'SmallCategory',
        'sanction_amount': 5000000.0,
        'recommended_date': '2025-01-01',
        'sanction_date': '2025-02-01'
    })
    df = pd.concat([base_works_df, pd.DataFrame(rows)], ignore_index=True)
    res = detect_cost_anomalies(df)
    
    if 'WRK-SMALL-OUTLIER' in res:
        assert res['WRK-SMALL-OUTLIER']['iqr_flag'] is False
