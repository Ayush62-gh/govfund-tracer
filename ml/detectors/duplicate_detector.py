import pandas as pd
import numpy as np
from typing import Dict, Any, List
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
try:
    from rapidfuzz import fuzz
except ImportError:
    fuzz = None

from ml.utils.text_preprocessing import normalize_text

def detect_duplicates(df: pd.DataFrame) -> Dict[str, Dict[str, Any]]:
    """
    Detects potential duplicate works based on TF-IDF textual similarity,
    fuzzy string matching, and financial proximity within the same Constituency/State.
    
    Returns a dict mapping work_id -> {
        'duplicate_score': float (0.0 to 1.0),
        'matched_work_id': str,
        'similarity_pct': float,
        'flag': bool
    }
    """
    results = {}
    
    # Pre-clean descriptions
    df['clean_desc'] = df['work_description'].apply(normalize_text)
    
    # Group by constituency for fast localized comparison
    # If constituency is missing, fallback to state
    df['group_key'] = df['constituency'].fillna(df['state']).fillna('UNKNOWN').astype(str).str.lower()
    
    for group_val, group_df in df.groupby('group_key'):
        if len(group_df) < 2:
            continue
            
        indices = group_df.index.tolist()
        descriptions = group_df['clean_desc'].tolist()
        work_ids = group_df['work_id'].tolist()
        amounts = group_df['sanction_amount'].tolist()
        
        # TF-IDF Vectorization
        vectorizer = TfidfVectorizer(ngram_range=(1, 2), min_df=1, stop_words='english')
        try:
            tfidf_matrix = vectorizer.fit_transform(descriptions)
            sim_matrix = cosine_similarity(tfidf_matrix)
        except Exception:
            sim_matrix = np.zeros((len(group_df), len(group_df)))
            
        n = len(group_df)
        for i in range(n):
            w_id_i = work_ids[i]
            desc_i = descriptions[i]
            amt_i = amounts[i]
            
            best_match_id = None
            max_sim = 0.0
            
            for j in range(n):
                if i == j:
                    continue
                
                tfidf_sim = sim_matrix[i, j]
                
                # If TF-IDF similarity is high (> 0.75), calculate fuzzy ratio & amount check
                if tfidf_sim > 0.65:
                    fuzzy_ratio = 0.0
                    if fuzz:
                        fuzzy_ratio = fuzz.token_set_ratio(desc_i, descriptions[j]) / 100.0
                    else:
                        fuzzy_ratio = tfidf_sim
                        
                    combined_sim = 0.6 * tfidf_sim + 0.4 * fuzzy_ratio
                    
                    # Amount proximity check (bonus if amounts are within 15%)
                    amt_j = amounts[j]
                    if amt_i is not None and amt_j is not None and amt_i > 0 and amt_j > 0:
                        amt_diff_ratio = abs(amt_i - amt_j) / max(amt_i, amt_j)
                        if amt_diff_ratio < 0.15:
                            combined_sim += 0.10
                            
                    combined_sim = min(1.0, combined_sim)
                    
                    if combined_sim > max_sim:
                        max_sim = combined_sim
                        best_match_id = work_ids[j]
                        
            if max_sim >= 0.80 and best_match_id:
                results[w_id_i] = {
                    'duplicate_score': round(max_sim, 3),
                    'matched_work_id': best_match_id,
                    'similarity_pct': round(max_sim * 100, 1),
                    'flag': True
                }
                
    return results
