import re
import pandas as pd
import numpy as np
from typing import Dict, Any, List
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from ml.utils.text_preprocessing import normalize_text

def extract_village_gp_tokens(text: str) -> List[str]:
    """
    Extracts potential Village / Gram Panchayat / Location tokens from description string.
    Looks for indicators like 'village X', 'gp Y', 'at Z', 'panchayat W', 'gram V'.
    """
    norm = normalize_text(text)
    words = norm.split()
    tokens = []
    
    keywords = ["village", "vill", "gp", "panchayat", "gram", "maug", "bazar", "faliya", "game", "at", "near"]
    for idx, w in enumerate(words):
        if w in keywords and idx + 1 < len(words):
            next_word = words[idx + 1]
            if len(next_word) > 2 and next_word not in keywords:
                tokens.append(next_word)
                
    return tokens

def detect_duplicates(df: pd.DataFrame) -> Dict[str, Dict[str, Any]]:
    """
    Detects possible duplicate works within each (state, category) group using:
    1. TF-IDF (ngram_range=(1,2), stop_words='english')
    2. Cosine Similarity > 0.85
    3. Location/Village GP token extraction for false-positive inspection.
    
    Returns dict mapping work_id -> {
        'duplicate_score': float (0.0 to 1.0),
        'cosine_similarity': float,
        'matched_work_id': str,
        'flag': bool,
        'flag_code': 'FLAG_POSSIBLE_DUPLICATE',
        'location_1': str,
        'location_2': str,
        'village_gp_1': str,
        'village_gp_2': str,
        'same_village_gp_indicated': str ('True', 'False', 'Uncertain')
    }
    """
    results = {}
    
    df_calc = df.copy()
    df_calc['clean_desc'] = df_calc['work_description'].apply(normalize_text)
    
    # Compute similarity WITHIN each (state, category) group
    for (st, cat), group in df_calc.groupby(['state', 'category']):
        if len(group) < 2:
            continue
            
        descriptions = group['clean_desc'].tolist()
        work_ids = group['work_id'].tolist()
        raw_descs = group['work_description'].tolist()
        constituencies = group['constituency'].tolist()
        amounts = group['sanction_amount'].tolist()
        
        # TF-IDF Vectorization: stop_words='english', ngram_range=(1,2)
        vectorizer = TfidfVectorizer(ngram_range=(1, 2), stop_words='english', min_df=1)
        try:
            tfidf_matrix = vectorizer.fit_transform(descriptions)
            sim_matrix = cosine_similarity(tfidf_matrix)
        except Exception:
            sim_matrix = np.zeros((len(group), len(group)))
            
        n = len(group)
        for i in range(n):
            w_id_i = work_ids[i]
            desc_i = descriptions[i]
            amt_i = amounts[i]
            const_i = constituencies[i]
            
            best_match_id = None
            max_sim = 0.0
            best_j_idx = -1
            
            for j in range(n):
                if i == j:
                    continue
                
                sim_val = float(sim_matrix[i, j])
                
                if sim_val > 0.85 and sim_val > max_sim:
                    max_sim = sim_val
                    best_match_id = work_ids[j]
                    best_j_idx = j
                    
            if max_sim > 0.85 and best_match_id and best_j_idx != -1:
                tokens_i = extract_village_gp_tokens(raw_descs[i])
                tokens_j = extract_village_gp_tokens(raw_descs[best_j_idx])
                
                v_gp_i = ", ".join(tokens_i) if tokens_i else "Unspecified"
                v_gp_j = ", ".join(tokens_j) if tokens_j else "Unspecified"
                
                same_village = "Uncertain"
                if tokens_i and tokens_j:
                    if any(t in tokens_j for t in tokens_i):
                        same_village = "True"
                    else:
                        same_village = "False"  # Different village names detected in template text
                elif tokens_i or tokens_j:
                    same_village = "Uncertain"
                    
                results[w_id_i] = {
                    'duplicate_score': round(max_sim, 4),
                    'cosine_similarity': round(max_sim, 4),
                    'matched_work_id': best_match_id,
                    'flag': True,
                    'flag_code': 'FLAG_POSSIBLE_DUPLICATE',
                    'location_1': f"{const_i}, {st}",
                    'location_2': f"{constituencies[best_j_idx]}, {st}",
                    'village_gp_1': v_gp_i,
                    'village_gp_2': v_gp_j,
                    'same_village_gp_indicated': same_village
                }
                
    return results
