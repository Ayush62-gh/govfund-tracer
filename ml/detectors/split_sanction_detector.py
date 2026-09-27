import pandas as pd
import numpy as np
from typing import Dict, Any, List
from ml.utils.text_preprocessing import extract_trust_name, normalize_text

# ==============================================================================
# MPLADS GUIDELINE CAP CONSTANTS
# ==============================================================================
# TRUST_SOCIETY_LIFETIME_CAP = 5000000 # ₹50 Lakh lifetime cap per Trust/Society (MPLADS Guidelines Para 3.21.2)
TRUST_SOCIETY_LIFETIME_CAP = 5000000

# DEPRIVED_SEGMENT_LIFETIME_CAP = 10000000 # ₹1 Crore relaxed lifetime cap for deprived-segment charitable trusts (Para 3.21.5)
DEPRIVED_SEGMENT_LIFETIME_CAP = 10000000

# TRUST_SOCIETY_ANNUAL_AGGREGATE_CAP = 10000000 # ₹1 Crore annual aggregate cap per MP across ALL trusts/societies combined
TRUST_SOCIETY_ANNUAL_AGGREGATE_CAP = 10000000

# OUT_OF_CONSTITUENCY_ANNUAL_CAP = 2500000 # ₹25 Lakh annual cap per MP for out-of-constituency works
OUT_OF_CONSTITUENCY_ANNUAL_CAP = 2500000

# Deprived segment keywords for relaxed lifetime cap eligibility (Para 3.21.5)
DEPRIVED_SEGMENT_KEYWORDS = [
    'orphan', 'anathalaya', 'yateemkhana', 'old age', 'aged', 'widow',
    'leper', 'leprosy', 'blind', 'spastic', 'mentally retarded', 'deaf', 'dumb', 'disabled'
]
# ==============================================================================

def get_financial_year(date_str):
    """Utility to compute Financial Year string from date (e.g. 2024-05-10 -> FY2024-25)."""
    if not date_str or pd.isna(date_str):
        return "UNKNOWN"
    try:
        dt = pd.to_datetime(date_str)
        year = dt.year
        if dt.month >= 4:
            return f"FY{year}-{str(year+1)[-2:]}"
        else:
            return f"FY{year-1}-{str(year)[-2:]}"
    except Exception:
        return "UNKNOWN"

def detect_split_and_compliance(df: pd.DataFrame, df_alloc: pd.DataFrame = None) -> Dict[str, Dict[str, Any]]:
    """
    Detects compliance breaches and work fragmentation patterns under MPLADS Guidelines:
    1. FLAG_TRUST_CAP_CIRCUMVENTION: Lifetime Trust/Society funding approaching (>90%) or breaching (>100%)
       the ₹50 Lakh lifetime cap (or ₹1 Crore relaxed cap for deprived-segment charities under Para 3.21.5).
    2. FLAG_TRUST_ANNUAL_AGGREGATE_BREACH: Combined recommendations to ALL trusts/societies by an MP exceeding
       the ₹1 Crore annual aggregate ceiling in a Financial Year.
    3. FLAG_OUT_OF_CONSTITUENCY_CAP_BREACH: Out-of-constituency annual expenditure exceeding ₹25 Lakh in a Financial Year.
    4. FLAG_RAPID_SUBTHRESHOLD_SANCTIONS: Rapid repeated sanctions (<14 days) to same IDA under round amounts.
    
    Returns dict: work_id -> {
        'split_compliance_score': float (0.0 to 1.0),
        'flags': list[str],
        'details': str
    }
    """
    results = {}
    
    # --------------------------------------------------------------------------
    # 1. FLAG_TRUST_CAP_CIRCUMVENTION & Deprived Segment Relaxed Cap Check
    # --------------------------------------------------------------------------
    df['trust_entity'] = df.apply(
        lambda r: extract_trust_name(r.get('work_description', ''), r.get('ida', '')),
        axis=1
    )
    
    # Tag works explicitly categorized under Trust & Society
    trust_category_mask = df['category'].astype(str).str.lower().str.contains('trust|society')
    trust_df = df[trust_category_mask | (df['trust_entity'] != '')].copy()
    
    for (mp, entity), group in trust_df.groupby(['mp_name', 'trust_entity']):
        tot_sanctioned = group['sanction_amount'].sum()
        
        # Check for deprived-segment keyword match in group work descriptions or entity name
        is_deprived = False
        for _, r in group.iterrows():
            combined_text = (str(r.get('work_description', '')) + " " + str(r.get('trust_entity', ''))).lower()
            if any(kw in combined_text for kw in DEPRIVED_SEGMENT_KEYWORDS):
                is_deprived = True
                break
                
        effective_cap = DEPRIVED_SEGMENT_LIFETIME_CAP if is_deprived else TRUST_SOCIETY_LIFETIME_CAP
        
        if tot_sanctioned >= 0.90 * effective_cap:
            pct = (tot_sanctioned / effective_cap) * 100
            flag_name = 'FLAG_TRUST_CAP_CIRCUMVENTION'
            
            for idx, row in group.iterrows():
                w_id = row['work_id']
                if w_id not in results:
                    results[w_id] = {'split_compliance_score': 0.0, 'flags': [], 'details': []}
                    
                results[w_id]['flags'].append(flag_name)
                
                tot_str = f"₹{tot_sanctioned/100000:.2f} Lakh" if tot_sanctioned >= 100000 else f"₹{tot_sanctioned:,.0f}"
                cap_str = "₹1.00 Crore" if is_deprived else "₹50.00 Lakh"
                relaxed_note = " (Relaxed ₹1 Crore deprived-segment cap applied per Para 3.21.5)" if is_deprived else ""
                
                if tot_sanctioned > effective_cap:
                    results[w_id]['split_compliance_score'] += 0.8
                    results[w_id]['details'].append(
                        f"MPLADS Guideline Breach (Para 3.21): Cumulative lifetime grants to Trust/Society '{entity}' "
                        f"reached {tot_str}, breaching the {cap_str} lifetime ceiling ({pct:.1f}%){relaxed_note}"
                    )
                else:
                    results[w_id]['split_compliance_score'] += 0.5
                    results[w_id]['details'].append(
                        f"MPLADS Guideline Risk (Para 3.21): Cumulative lifetime grants to Trust/Society '{entity}' "
                        f"reached {tot_str} ({pct:.1f}% of {cap_str} ceiling){relaxed_note}"
                    )

    # --------------------------------------------------------------------------
    # 2. FLAG_TRUST_ANNUAL_AGGREGATE_BREACH (₹1 Crore Aggregate Cap per MP per FY)
    # --------------------------------------------------------------------------
    if not trust_df.empty:
        trust_df['fy'] = trust_df['sanction_date'].fillna(trust_df['recommended_date']).apply(get_financial_year)
        
        for (mp, fy), group in trust_df.groupby(['mp_name', 'fy']):
            if fy == "UNKNOWN" or not mp:
                continue
                
            tot_trust_fy = group['sanction_amount'].sum()
            
            if tot_trust_fy > TRUST_SOCIETY_ANNUAL_AGGREGATE_CAP:
                tot_str = f"₹{tot_trust_fy/10000000:.2f} Crore" if tot_trust_fy >= 10000000 else f"₹{tot_trust_fy/100000:.2f} Lakh"
                for idx, row in group.iterrows():
                    w_id = row['work_id']
                    if w_id not in results:
                        results[w_id] = {'split_compliance_score': 0.0, 'flags': [], 'details': []}
                        
                    if 'FLAG_TRUST_ANNUAL_AGGREGATE_BREACH' not in results[w_id]['flags']:
                        results[w_id]['flags'].append('FLAG_TRUST_ANNUAL_AGGREGATE_BREACH')
                        results[w_id]['split_compliance_score'] += 0.75
                        results[w_id]['details'].append(
                            f"MPLADS Guideline Breach: Combined recommendations to ALL trusts/societies by this MP in {fy} "
                            f"reached {tot_str}, breaching the official ₹1 Crore annual aggregate ceiling across all trusts/societies."
                        )

    # --------------------------------------------------------------------------
    # 3. FLAG_OUT_OF_CONSTITUENCY_CAP_BREACH Detection
    # --------------------------------------------------------------------------
    mp_home_map = {}
    if df_alloc is not None and not df_alloc.empty:
        for idx, r in df_alloc.iterrows():
            mp_name_norm = normalize_text(r.get('mp_name'))
            home_const = normalize_text(r.get('constituency'))
            if mp_name_norm and home_const:
                mp_home_map[mp_name_norm] = home_const

    df['fy'] = df['sanction_date'].fillna(df['recommended_date']).apply(get_financial_year)
    df['norm_mp'] = df['mp_name'].apply(normalize_text)
    df['norm_const'] = df['constituency'].apply(normalize_text)
    
    for (mp_norm, fy), group in df.groupby(['norm_mp', 'fy']):
        if fy == "UNKNOWN" or not mp_norm:
            continue
            
        home_const = mp_home_map.get(mp_norm, '')
        if not home_const:
            continue
            
        out_of_const_group = group[group['norm_const'] != home_const]
        tot_out_of_const = out_of_const_group['sanction_amount'].sum()
        
        if tot_out_of_const > OUT_OF_CONSTITUENCY_ANNUAL_CAP:
            tot_out_str = f"₹{tot_out_of_const/100000:.2f} Lakh" if tot_out_of_const >= 100000 else f"₹{tot_out_of_const:,.0f}"
            for idx, row in out_of_const_group.iterrows():
                w_id = row['work_id']
                if w_id not in results:
                    results[w_id] = {'split_compliance_score': 0.0, 'flags': [], 'details': []}
                    
                results[w_id]['flags'].append('FLAG_OUT_OF_CONSTITUENCY_CAP_BREACH')
                results[w_id]['split_compliance_score'] += 0.7
                results[w_id]['details'].append(
                    f"MPLADS Guideline Risk: Annual out-of-constituency recommendations reached {tot_out_str} in {fy}, "
                    f"breaching the official ₹25.00 Lakh annual limit per MP"
                )

    # --------------------------------------------------------------------------
    # 4. FLAG_RAPID_SUBTHRESHOLD_SANCTIONS (Pattern worth reviewing)
    # --------------------------------------------------------------------------
    df['sanc_dt'] = pd.to_datetime(df['sanction_date'], errors='coerce')
    valid_dates_df = df[df['sanc_dt'].notna()].copy()
    
    for (mp, ida, cat), group in valid_dates_df.groupby(['mp_name', 'ida', 'category']):
        if len(group) < 3:
            continue
            
        group_sorted = group.sort_values('sanc_dt')
        dates = group_sorted['sanc_dt'].tolist()
        amounts = group_sorted['sanction_amount'].tolist()
        w_ids = group_sorted['work_id'].tolist()
        
        for i in range(len(group_sorted) - 2):
            time_window = (dates[i+2] - dates[i]).days
            if time_window <= 14:
                sub_amounts = amounts[i:i+3]
                if all(a is not None and 350000 <= a <= 499999 for a in sub_amounts):
                    for k in range(i, i+3):
                        w_id = w_ids[k]
                        if w_id not in results:
                            results[w_id] = {'split_compliance_score': 0.0, 'flags': [], 'details': []}
                            
                        if 'FLAG_RAPID_SUBTHRESHOLD_SANCTIONS' not in results[w_id]['flags']:
                            results[w_id]['flags'].append('FLAG_RAPID_SUBTHRESHOLD_SANCTIONS')
                            results[w_id]['split_compliance_score'] += 0.35
                            results[w_id]['details'].append(
                                "Pattern Review Notice: 3+ works sanctioned to same agency within 14 days under ₹5.00 Lakh "
                                "(commonly reviewed for potential work splitting)"
                            )

    # Post-process details formatting
    final_output = {}
    for w_id, data in results.items():
        final_output[w_id] = {
            'split_compliance_score': round(min(1.0, data['split_compliance_score']), 3),
            'flags': data['flags'],
            'details': " | ".join(data['details'])
        }
        
    return final_output
