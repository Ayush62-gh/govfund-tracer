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

def test_duplicate_different_constituency_penalty(base_works_df):
    """
    Two rows, same state+category, IDENTICAL boilerplate description
    (no village mentioned at all, so same_village_gp_indicated would be 'Uncertain'),
    but DIFFERENT constituency values
    -> assert duplicate_score is reduced (0.5x) despite same_village_gp_indicated being 'Uncertain'.
    """
    s = 'construction of community hall shed building concrete floor boundary wall main gate electrical works drinking water facility'
    
    rows = [
        {
            'work_id': 'WRK-CONST-001',
            'state': 'Punjab',
            'category': 'Normal/Others',
            'constituency': 'Amritsar',
            'work_description': s
        },
        {
            'work_id': 'WRK-CONST-002',
            'state': 'Punjab',
            'category': 'Normal/Others',
            'constituency': 'Jalandhar',
            'work_description': s
        }
    ]
    df = pd.concat([base_works_df, pd.DataFrame(rows)], ignore_index=True)
    res = detect_duplicates(df)
    
    assert 'WRK-CONST-001' in res
    item = res['WRK-CONST-001']
    assert item['same_constituency'] is False
    assert item['same_village_gp_indicated'] == 'Uncertain'
    assert item['location_match_basis'] == 'constituency_mismatch'
    assert item['duplicate_score'] < item['cosine_similarity']
    assert round(item['duplicate_score'], 4) == round(item['cosine_similarity'] * 0.5, 4)

