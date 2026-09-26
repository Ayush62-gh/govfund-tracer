import pandas as pd
from ml.detectors.holistic_anomaly_detector import detect_holistic_anomalies

def test_holistic_anomaly_outlier_flagged(base_works_df):
    """
    12 normal rows in same (state, category) group with typical features, plus 1 row
    with a highly unusual combination -> outlier work_id appears in results with FLAG_HOLISTIC_ML_ANOMALY.
    """
    rows = []
    for i in range(12):
        rows.append({
            'work_id': f'WRK-HOL-{i:03d}',
            'state': 'Punjab',
            'category': 'Normal/Others',
            'work_status': 'Completed',
            'sanction_amount': 200000.0 + (i * 1000),
            'recommended_date': '2024-01-01',
            'sanction_date': '2024-02-01',
            'completion_date': '2024-06-01',
            'amount_disbursed': 200000.0
        })
    # Highly unusual multivariate outlier
    rows.append({
        'work_id': 'WRK-HOL-OUTLIER',
        'state': 'Punjab',
        'category': 'Normal/Others',
        'work_status': 'Ongoing',
        'sanction_amount': 50000000.0,
        'recommended_date': '2020-01-01',
        'sanction_date': '2024-12-01',
        'completion_date': None,
        'amount_disbursed': 1000.0
    })
    df = pd.concat([base_works_df, pd.DataFrame(rows)], ignore_index=True)
    res = detect_holistic_anomalies(df)
    
    assert 'WRK-HOL-OUTLIER' in res
    assert 'FLAG_HOLISTIC_ML_ANOMALY' in res['WRK-HOL-OUTLIER']['flags']

def test_holistic_anomaly_small_group_skipped(base_works_df):
    """
    Group with fewer than 10 rows -> no work_id from that group is ever flagged.
    """
    rows = []
    for i in range(5):
        rows.append({
            'work_id': 'WRK-HOL-SMALL-%03d' % i,
            'state': 'Sikkim',
            'category': 'SmallGroup',
            'work_status': 'Completed',
            'sanction_amount': 50000000.0 if i == 0 else 100000.0,
            'recommended_date': '2024-01-01',
            'sanction_date': '2024-02-01',
            'completion_date': '2024-06-01',
            'amount_disbursed': 100000.0
        })
    df = pd.concat([base_works_df, pd.DataFrame(rows)], ignore_index=True)
    res = detect_holistic_anomalies(df)
    
    assert len(res) == 0

def test_holistic_anomaly_details_string(base_works_df):
    """
    Check returned 'details' string for flagged record names at least one of the 6 engineered features.
    """
    rows = []
    for i in range(12):
        rows.append({
            'work_id': f'WRK-HOL-DET-{i:03d}',
            'state': 'Punjab',
            'category': 'Normal/Others',
            'work_status': 'Completed',
            'sanction_amount': 200000.0,
            'recommended_date': '2024-01-01',
            'sanction_date': '2024-02-01',
            'completion_date': '2024-06-01',
            'amount_disbursed': 200000.0
        })
    rows.append({
        'work_id': 'WRK-HOL-DET-OUTLIER',
        'state': 'Punjab',
        'category': 'Normal/Others',
        'work_status': 'Ongoing',
        'sanction_amount': 90000000.0,
        'recommended_date': '2019-01-01',
        'sanction_date': '2024-12-01',
        'completion_date': None,
        'amount_disbursed': 1.0
    })
    df = pd.concat([base_works_df, pd.DataFrame(rows)], ignore_index=True)
    res = detect_holistic_anomalies(df)
    
    assert 'WRK-HOL-DET-OUTLIER' in res
    details = res['WRK-HOL-DET-OUTLIER']['details']
    feature_names = ['sanction_amount', 'days_to_sanction', 'days_sanction_to_completion', 'category', 'work_status', 'disbursement_ratio']
    assert any(fn in details for fn in feature_names)
