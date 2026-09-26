import pandas as pd
from ml.detectors.duplicate_detector import detect_duplicates

def test_duplicate_flagged(base_works_df):
    """
    Two rows, same state+category, near-identical work_description
    -> both appear in detect_duplicates() results with flag=True.
    """
    rows = [
        {
            'work_id': 'WRK-DUP-001',
            'state': 'Punjab',
            'category': 'Normal/Others',
            'constituency': 'Amritsar',
            'work_description': 'Construction of Community Hall at Ram Nagar'
        },
        {
            'work_id': 'WRK-DUP-002',
            'state': 'Punjab',
            'category': 'Normal/Others',
            'constituency': 'Amritsar',
            'work_description': 'Construction of community hall at Ram nagar'
        }
    ]
    df = pd.concat([base_works_df, pd.DataFrame(rows)], ignore_index=True)
    res = detect_duplicates(df)
    
    assert 'WRK-DUP-001' in res
    assert res['WRK-DUP-001']['flag'] is True
    assert 'WRK-DUP-002' in res
    assert res['WRK-DUP-002']['flag'] is True

def test_duplicate_different_unflagged(base_works_df):
    """
    Two rows, same state+category, completely different descriptions -> neither appears in results.
    """
    rows = [
        {
            'work_id': 'WRK-DIFF-001',
            'state': 'Punjab',
            'category': 'Normal/Others',
            'constituency': 'Amritsar',
            'work_description': 'Installation of RO System in Govt School'
        },
        {
            'work_id': 'WRK-DIFF-002',
            'state': 'Punjab',
            'category': 'Normal/Others',
            'constituency': 'Amritsar',
            'work_description': 'Construction of Concrete Boundary Wall around Cemetery'
        }
    ]
    df = pd.concat([base_works_df, pd.DataFrame(rows)], ignore_index=True)
    res = detect_duplicates(df)
    
    assert 'WRK-DIFF-001' not in res
    assert 'WRK-DIFF-002' not in res

def test_duplicate_different_location_penalty(base_works_df):
    """
    Two rows with high text similarity (> 0.85) but DIFFERENT village names extractable
    (e.g., "...at village ramnagar..." vs "...at village shyampur...")
    -> same_village_gp_indicated == 'False' AND duplicate_score < cosine_similarity.
    """
    s1 = 'construction of community hall shed building concrete floor boundary wall main gate electrical works drinking water facility at village ramnagar district amritsar'
    s2 = 'construction of community hall shed building concrete floor boundary wall main gate electrical works drinking water facility at village shyampur district amritsar'
    
    rows = [
        {
            'work_id': 'WRK-LOC-001',
            'state': 'Punjab',
            'category': 'Normal/Others',
            'constituency': 'Amritsar',
            'work_description': s1
        },
        {
            'work_id': 'WRK-LOC-002',
            'state': 'Punjab',
            'category': 'Normal/Others',
            'constituency': 'Amritsar',
            'work_description': s2
        }
    ]
    df = pd.concat([base_works_df, pd.DataFrame(rows)], ignore_index=True)
    res = detect_duplicates(df)
    
    assert 'WRK-LOC-001' in res
    item = res['WRK-LOC-001']
    assert item['same_village_gp_indicated'] == 'False'
    assert item['duplicate_score'] < item['cosine_similarity']
