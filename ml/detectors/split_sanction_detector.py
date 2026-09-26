import pandas as pd
import numpy as np
from typing import Dict, Any, List
from ml.utils.text_preprocessing import extract_trust_name, normalize_text

# ==============================================================================
# MPLADS GUIDELINE CAP CONSTANTS
# ==============================================================================
# TRUST_SOCIETY_LIFETIME_CAP = 5000000 # ₹50 Lakh lifetime cap per MPLADS Pocket Book (verifiable against MPLADSGuidelineApril2023.pdf)
TRUST_SOCIETY_LIFETIME_CAP = 5000000

# OUT_OF_CONSTITUENCY_ANNUAL_CAP = 2500000 # ₹25 Lakh annual cap per MP for out-of-constituency works
OUT_OF_CONSTITUENCY_ANNUAL_CAP = 2500000
# ==============================================================================

def detect_split_and_compliance(df: pd.DataFrame, df_alloc: pd.DataFrame = None) -> Dict[str, Dict[str, Any]]:
    """
    Detects compliance breaches and work fragmentation patterns under MPLADS Guidelines:
    1. FLAG_TRUST_CAP_CIRCUMVENTION: Lifetime Trust/Society funding approaching (>90%) or breaching (>100%) ₹50 Lakh cap.
    2. FLAG_OUT_OF_CONSTITUENCY_CAP_BREACH: Out-of-constituency annual expenditure exceeding ₹25 Lakh in a Financial Year.
    3. FLAG_RAPID_SUBTHRESHOLD_SANCTIONS: Rapid repeated sanctions (<14 days) to same IDA under round amounts (pattern worth reviewing).
    
    Returns dict: work_id -> {
        'split_compliance_score': float (0.0 to 1.0),
        'flags': list[str],
        'details': str
    }
    """
    results = {}
    
    # --------------------------------------------------------------------------
    # 1. FLAG_TRUST_CAP_CIRCUMVENTION Detection
    # --------------------------------------------------------------------------
    df['trust_entity'] = df.apply(
        lambda r: extract_trust_name(r.get('work_description', ''), r.get('ida', '')),
        axis=1
    )
    
    # Also tag works explicitly categorized under Trust & Society
    trust_category_mask = df['category'].astype(str).str.lower().str.contains('trust|society')
    
    # Combine trust records
    trust_df = df[trust_category_mask | (df['trust_entity'] != '')].copy()
    
    for (mp, entity), group in trust_df.groupby(['mp_name', 'trust_entity']):
        tot_sanctioned = group['sanction_amount'].sum()
        
        if tot_sanctioned >= 0.90 * TRUST_SOCIETY_LIFETIME_CAP:
            pct = (tot_sanctioned / TRUST_SOCIETY_LIFETIME_CAP) * 100
            flag_name = 'FLAG_TRUST_CAP_CIRCUMVENTION'
            
            for idx, row in group.iterrows():
                w_id = row['work_id']
                if w_id not in results:
                    results[w_id] = {'split_compliance_score': 0.0, 'flags': [], 'details': []}
                    
                results[w_id]['flags'].append(flag_name)
                
                tot_str = f"₹{tot_sanctioned/100000:.2f} Lakh" if tot_sanctioned >= 100000 else f"₹{tot_sanctioned:,.0f}"
                if tot_sanctioned > TRUST_SOCIETY_LIFETIME_CAP:
                    results[w_id]['split_compliance_score'] += 0.8
                    results[w_id]['details'].append(f"MPLADS Guideline Breach (Para 3.21): Cumulative lifetime grants to Trust/Society '{entity}' reached {tot_str}, breaching the official ₹50.00 Lakh lifetime ceiling ({pct:.1f}%)")
                else:
                    results[w_id]['split_compliance_score'] += 0.5
                    results[w_id]['details'].append(f"MPLADS Guideline Risk (Para 3.21): Cumulative lifetime grants to Trust/Society '{entity}' reached {tot_str} ({pct:.1f}% of official ₹50.00 Lakh ceiling)")

    # --------------------------------------------------------------------------
    # 2. FLAG_OUT_OF_CONSTITUENCY_CAP_BREACH Detection
    # --------------------------------------------------------------------------
    # Build mapping of MP -> Home Constituency from allocated_limits reference table
    mp_home_map = {}
    if df_alloc is not None and not df_alloc.empty:
        for idx, r in df_alloc.iterrows():
            mp_name_norm = normalize_text(r.get('mp_name'))
            home_const = normalize_text(r.get('constituency'))
            if mp_name_norm and home_const:
                mp_home_map[mp_name_norm] = home_const

    # Function to extract Financial Year from date (e.g. 2024-05-10 -> FY2024-25)
    def get_financial_year(date_str):
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

    df['fy'] = df['sanction_date'].fillna(df['recommended_date']).apply(get_financial_year)
    df['norm_mp'] = df['mp_name'].apply(normalize_text)
    df['norm_const'] = df['constituency'].apply(normalize_text)
    
    for (mp_norm, fy), group in df.groupby(['norm_mp', 'fy']):
        if fy == "UNKNOWN" or not mp_norm:
            continue
            
        home_const = mp_home_map.get(mp_norm, '')
        if not home_const:
            continue
            
        # Filter works where constituency differs from MP home constituency
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
                results[w_id]['details'].append(f"MPLADS Guideline Risk: Annual out-of-constituency recommendations reached {tot_out_str} in {fy}, breaching the official ₹25.00 Lakh annual limit per MP")

    # --------------------------------------------------------------------------
    # 3. FLAG_RAPID_SUBTHRESHOLD_SANCTIONS (Pattern worth reviewing)
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
                # Check if all amounts are under round numbers like ₹5L (4,00,000 - 4,99,999)
                if all(a is not None and 350000 <= a <= 499999 for a in sub_amounts):
                    for k in range(i, i+3):
                        w_id = w_ids[k]
                        if w_id not in results:
                            results[w_id] = {'split_compliance_score': 0.0, 'flags': [], 'details': []}
                            
                        if 'FLAG_RAPID_SUBTHRESHOLD_SANCTIONS' not in results[w_id]['flags']:
                            results[w_id]['flags'].append('FLAG_RAPID_SUBTHRESHOLD_SANCTIONS')
                            results[w_id]['split_compliance_score'] += 0.35  # Lower weight as specified
                            results[w_id]['details'].append("Pattern Review Notice: 3+ works sanctioned to same agency within 14 days under ₹5.00 Lakh (commonly reviewed for potential work splitting)")


    # Post-process details formatting
    final_output = {}
    for w_id, data in results.items():
        final_output[w_id] = {
            'split_compliance_score': round(min(1.0, data['split_compliance_score']), 3),
            'flags': data['flags'],
            'details': " | ".join(data['details'])
        }
        
    return final_output
