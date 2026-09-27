import pytest
import pandas as pd

@pytest.fixture
def base_works_df() -> pd.DataFrame:
    """
    Returns a minimal valid works DataFrame schema containing all columns accessed across detectors.
    Individual tests should build on top of this schema by appending rows.
    """
    columns = [
        'work_id', 'source', 'composite_key', 'work_code', 'category', 'state',
        'ida', 'mp_name', 'constituency', 'work_description', 'recommended_date',
        'sanction_date', 'sanction_amount', 'completion_date', 'amount_disbursed',
        'image', 'work_status'
    ]
    return pd.DataFrame(columns=columns)
