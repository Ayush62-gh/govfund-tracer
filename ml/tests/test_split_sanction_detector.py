import pandas as pd
from ml.detectors.split_sanction_detector import detect_split_and_compliance

def test_trust_lifetime_cap_breach(base_works_df):
    """
    Same mp_name + trust_entity-extractable description appearing across multiple rows summing to > ₹50 lakh
    -> FLAG_TRUST_CAP_CIRCUMVENTION present.
    """
    rows = [
        {
            'work_id': 'WRK-TRUST-001',
            'mp_name': 'Shri Test MP',
            'work_description': 'Grant for Construction of Building for ABC Charitable Trust',
            'sanction_amount': 3000000.0,
            'sanction_date': '2024-05-10'
        },
        {
            'work_id': 'WRK-TRUST-002',
            'mp_name': 'Shri Test MP',
            'work_description': 'Grant for Equipment to ABC Charitable Trust',
            'sanction_amount': 2500000.0,  # Total 55L > 50L cap
            'sanction_date': '2024-06-15'
        }
    ]
    df = pd.concat([base_works_df, pd.DataFrame(rows)], ignore_index=True)
    res = detect_split_and_compliance(df)
    
    assert 'WRK-TRUST-001' in res or 'WRK-TRUST-002' in res
    flagged = [v for v in res.values() if 'FLAG_TRUST_CAP_CIRCUMVENTION' in v['flags']]
    assert len(flagged) > 0

def test_mandal_location_not_trust_regression(base_works_df):
    """
    Edge case (regression test for Phase 2 'mandal' bug):
    Row mentioning "Amudala Mandal" (administrative location)
    -> trust extraction does NOT falsely trigger FLAG_TRUST_CAP_CIRCUMVENTION.
    """
    rows = [
        {
            'work_id': 'WRK-MANDAL-001',
            'mp_name': 'Shri AP MP',
            'work_description': 'Construction of Gravel Road in Amudala Mandal',
            'sanction_amount': 6000000.0,
            'sanction_date': '2024-05-10'
        }
    ]
    df = pd.concat([base_works_df, pd.DataFrame(rows)], ignore_index=True)
    res = detect_split_and_compliance(df)
    
    flagged = [v for v in res.values() if 'FLAG_TRUST_CAP_CIRCUMVENTION' in v['flags']]
    assert len(flagged) == 0

def test_panchayat_samiti_not_trust_regression(base_works_df):
    """
    Edge case (regression test for Phase 2 'samiti' bug):
    Row mentioning "Panchayat Samiti" (government body, not private trust)
    -> does NOT get flagged as trust breach.
    """
    rows = [
        {
            'work_id': 'WRK-SAMITI-001',
            'mp_name': 'Shri WB MP',
            'work_description': 'Construction of Road under Nanoor Panchayat Samiti',
            'sanction_amount': 6000000.0,
            'sanction_date': '2024-05-10'
        }
    ]
    df = pd.concat([base_works_df, pd.DataFrame(rows)], ignore_index=True)
    res = detect_split_and_compliance(df)
    
    flagged = [v for v in res.values() if 'FLAG_TRUST_CAP_CIRCUMVENTION' in v['flags']]
    assert len(flagged) == 0

def test_trust_annual_aggregate_cap_breach(base_works_df):
    """
    Multiple DIFFERENT small trusts funded by same mp_name within same financial year
    summing to > ₹1 crore combined -> FLAG_TRUST_ANNUAL_AGGREGATE_BREACH present.
    """
    rows = [
        {
            'work_id': 'WRK-AGG-001',
            'mp_name': 'Shri Big Spender MP',
            'work_description': 'Grant for Hall to XYZ Seva Mandal',
            'sanction_amount': 6000000.0,
            'sanction_date': '2024-05-10'
        },
        {
            'work_id': 'WRK-AGG-002',
            'mp_name': 'Shri Big Spender MP',
            'work_description': 'Grant for Library to PQR Mahila Mandal',
            'sanction_amount': 5000000.0,  # Total 1.1 Cr > 1 Cr FY cap
            'sanction_date': '2024-07-20'
        }
    ]
    df = pd.concat([base_works_df, pd.DataFrame(rows)], ignore_index=True)
    res = detect_split_and_compliance(df)
    
    flagged = [v for v in res.values() if 'FLAG_TRUST_ANNUAL_AGGREGATE_BREACH' in v['flags']]
    assert len(flagged) > 0
