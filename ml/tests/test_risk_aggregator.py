import pandas as pd
from ml.risk_aggregator import aggregate_risk_scores

def test_holistic_alone_confidence_count(base_works_df):
    """
    Construct dup_results, cost_results (both empty {}), and holistic_results with ONE work_id
    flagged only by holistic -> detectors_flagged_count == 1.
    """
    row = {'work_id': 'WRK-AGG-001'}
    df = pd.concat([base_works_df, pd.DataFrame([row])], ignore_index=True)
    
    holistic_results = {
        'WRK-AGG-001': {
            'flags': ['FLAG_HOLISTIC_ML_ANOMALY'],
            'holistic_anomaly_score': 0.8,
            'details': 'Holistic anomaly'
        }
    }
    
    res = aggregate_risk_scores(
        df,
        dup_results={},
        cost_results={},
        split_results={},
        time_results={},
        mismatch_results={},
        holistic_results=holistic_results
    )
    
    assert len(res) == 1
    assert res[0]['detectors_flagged_count'] == 1

def test_holistic_correlated_not_double_counted(base_works_df):
    """
    BOTH cost_results and holistic_results flag the SAME work_id
    -> detectors_flagged_count == 1 (holistic does NOT add second +1 when another detector fired).
    """
    row = {'work_id': 'WRK-AGG-002'}
    df = pd.concat([base_works_df, pd.DataFrame([row])], ignore_index=True)
    
    cost_results = {
        'WRK-AGG-002': {
            'flags': ['FLAG_COST_ANOMALY_COMBINED'],
            'cost_anomaly_score': 0.8,
            'details': 'Cost anomaly'
        }
    }
    holistic_results = {
        'WRK-AGG-002': {
            'flags': ['FLAG_HOLISTIC_ML_ANOMALY'],
            'holistic_anomaly_score': 0.8,
            'details': 'Holistic anomaly'
        }
    }
    
    res = aggregate_risk_scores(
        df,
        dup_results={},
        cost_results=cost_results,
        split_results={},
        time_results={},
        mismatch_results={},
        holistic_results=holistic_results
    )
    
    assert len(res) == 1
    assert res[0]['detectors_flagged_count'] == 1

def test_multi_detector_high_confidence(base_works_df):
    """
    dup_results, cost_results, AND split_results all flag the same work_id (3 independent detectors)
    -> confidence_score == 0.95 (Very High Confidence threshold).
    """
    row = {'work_id': 'WRK-AGG-003'}
    df = pd.concat([base_works_df, pd.DataFrame([row])], ignore_index=True)
    
    dup_results = {'WRK-AGG-003': {'flag': True, 'duplicate_score': 0.9, 'matched_work_id': 'X', 'cosine_similarity': 0.9}}
    cost_results = {'WRK-AGG-003': {'flags': ['FLAG_COST_ANOMALY_COMBINED'], 'cost_anomaly_score': 0.9, 'details': 'Cost'}}
    split_results = {'WRK-AGG-003': {'flags': ['FLAG_TRUST_CAP_CIRCUMVENTION'], 'split_compliance_score': 0.9, 'details': 'Split'}}
    
    res = aggregate_risk_scores(
        df,
        dup_results=dup_results,
        cost_results=cost_results,
        split_results=split_results,
        time_results={},
        mismatch_results={},
        holistic_results={}
    )
    
    assert len(res) == 1
    assert res[0]['detectors_flagged_count'] == 3
    assert res[0]['confidence_score'] == 0.95

def test_risk_score_max_100_cap(base_works_df):
    """
    Composite risk_score never exceeds 100.0 even when all detectors sum past 100.
    """
    row = {'work_id': 'WRK-AGG-MAX'}
    df = pd.concat([base_works_df, pd.DataFrame([row])], ignore_index=True)
    
    dup_results = {'WRK-AGG-MAX': {'flag': True, 'duplicate_score': 1.0, 'matched_work_id': 'X', 'cosine_similarity': 1.0}}
    cost_results = {'WRK-AGG-MAX': {'flags': ['FLAG_COST_ANOMALY_COMBINED'], 'cost_anomaly_score': 1.0, 'details': 'Cost'}}
    split_results = {'WRK-AGG-MAX': {'flags': ['FLAG_TRUST_CAP_CIRCUMVENTION'], 'split_compliance_score': 1.0, 'details': 'Split'}}
    time_results = {'WRK-AGG-MAX': {'flags': ['FLAG_SANCTION_DELAY'], 'time_lag_score': 1.0, 'details': 'Time'}}
    mismatch_results = {'WRK-AGG-MAX': {'flags': ['FLAG_FUND_MISMATCH'], 'fund_mismatch_score': 1.0, 'details': 'Mismatch'}}
    holistic_results = {'WRK-AGG-MAX': {'flags': ['FLAG_HOLISTIC_ML_ANOMALY'], 'holistic_anomaly_score': 1.0, 'details': 'Holistic'}}
    
    res = aggregate_risk_scores(
        df,
        dup_results=dup_results,
        cost_results=cost_results,
        split_results=split_results,
        time_results=time_results,
        mismatch_results=mismatch_results,
        holistic_results=holistic_results
    )
    
    assert len(res) == 1
    assert res[0]['risk_score'] == 100.0
