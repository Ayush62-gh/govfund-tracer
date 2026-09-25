import os
import sys
import re
import json
import sqlite3
import pandas as pd

sys.stdout.reconfigure(encoding='utf-8')

def get_data_dir():
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    return os.path.abspath(os.path.join(backend_dir, '..', 'data', 'raw'))

def get_db_dir():
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    db_dir = os.path.join(backend_dir, 'db')
    os.makedirs(db_dir, exist_ok=True)
    return db_dir

def find_raw_file(base_dir, filename_options):
    for fn in filename_options:
        p = os.path.join(base_dir, fn)
        if os.path.exists(p):
            return p
    raise FileNotFoundError(f"Could not find any of {filename_options} in {base_dir}")

def clean_amount(val):
    if pd.isna(val) or val is None:
        return None
    s = str(val).strip().replace(',', '').replace('₹', '').strip()
    if not s or s.lower() in ['nan', 'none', 'n/a', '']:
        return None
    try:
        return float(s)
    except ValueError:
        return None

def clean_date_series(series):
    dt = pd.to_datetime(series, dayfirst=True, errors='coerce')
    return dt.dt.strftime('%Y-%m-%d').where(dt.notna(), None)

def normalize_str(val):
    if pd.isna(val) or val is None:
        return ""
    s = str(val).strip()
    return re.sub(r'\s+', ' ', s)

def make_composite_key(state, ida, mp, desc):
    st = normalize_str(state).lower()
    i = normalize_str(ida).lower()
    m = normalize_str(mp).lower()
    d = normalize_str(desc).lower()
    return f"{st}|{i}|{m}|{d}"

def validate_match(sanc_amt, comp_amt, rec_dt_str, sanc_dt_str, comp_dt_str):
    """
    Returns (is_valid: bool, reasons: list[str])
    """
    reasons = []
    
    # 1. Date check: completion date predates start date
    start_dt = None
    if rec_dt_str and sanc_dt_str:
        start_dt = min(rec_dt_str, sanc_dt_str)
    elif rec_dt_str:
        start_dt = rec_dt_str
    elif sanc_dt_str:
        start_dt = sanc_dt_str

    if comp_dt_str and start_dt:
        if comp_dt_str < start_dt:
            reasons.append(f"Completion date ({comp_dt_str}) predates start date ({start_dt})")

    # 2. Amount check: ratio > 1.5 and absolute difference > 50,000 INR
    if sanc_amt is not None and comp_amt is not None and sanc_amt > 0 and comp_amt > 0:
        ratio = max(sanc_amt, comp_amt) / min(sanc_amt, comp_amt)
        diff = abs(sanc_amt - comp_amt)
        if ratio > 1.5 and diff > 50000:
            reasons.append(f"Amount conflict: Sanctioned ₹{sanc_amt:,.2f} vs Disbursed ₹{comp_amt:,.2f} (Diff: ₹{diff:,.2f}, Ratio: {ratio:.2f})")

    return (len(reasons) == 0, reasons)

def ingest_data():
    raw_dir = get_data_dir()
    db_dir = get_db_dir()
    db_path = os.path.join(db_dir, 'govfund.db')
    report_path = os.path.join(db_dir, 'merge_report.txt')

    print(f"Reading CSV files from: {raw_dir}")
    alloc_file = find_raw_file(raw_dir, ['Allocated Limit for Honble MPs.csv', 'Allocated_Limit_for_Honble_MPs.csv'])
    sanc_file = find_raw_file(raw_dir, ['Works Sanctioned.csv', 'Works_Sanctioned.csv'])
    comp_file = find_raw_file(raw_dir, ['Works Completed.csv', 'Works_Completed.csv'])

    df_alloc = pd.read_csv(alloc_file)
    df_sanc = pd.read_csv(sanc_file)
    df_comp = pd.read_csv(comp_file)

    # Filter out footer Grand Total rows
    df_alloc = df_alloc[df_alloc.iloc[:, 0].astype(str).str.strip().str.lower() != 'grand total'].copy()
    df_sanc = df_sanc[df_sanc.iloc[:, 0].astype(str).str.strip().str.lower() != 'grand total'].copy()
    df_comp = df_comp[df_comp.iloc[:, 0].astype(str).str.strip().str.lower() != 'grand total'].copy()

    total_sanc_count = len(df_sanc)
    total_comp_count = len(df_comp)

    print(f"Cleaned counts -> Allocated: {len(df_alloc)}, Sanctioned: {total_sanc_count}, Completed: {total_comp_count}")

    # Process Allocated Limits
    amt_col_alloc = [c for c in df_alloc.columns if 'allocated' in c.lower() or 'amount' in c.lower()][0]
    mp_col_alloc = [c for c in df_alloc.columns if 'member' in c.lower() or 'mp' in c.lower()][0]

    alloc_rows = []
    for _, r in df_alloc.iterrows():
        alloc_rows.append((
            normalize_str(r.get('State')),
            normalize_str(r.get(mp_col_alloc)),
            normalize_str(r.get('Constituency')),
            clean_amount(r.get(amt_col_alloc))
        ))

    # Clean dates
    df_sanc['Rec_Date_Clean'] = clean_date_series(df_sanc['Recommended date'])
    df_sanc['Sanc_Date_Clean'] = clean_date_series(df_sanc['Sanction Date'])
    df_comp['Comp_Date_Clean'] = clean_date_series(df_comp['Completion Date'])

    sanc_amt_col = [c for c in df_sanc.columns if 'amount' in c.lower()][0]
    sanc_mp_col = [c for c in df_sanc.columns if 'member' in c.lower() or 'mp' in c.lower()][0]
    sanc_cat_col = [c for c in df_sanc.columns if 'category' in c.lower()][0]
    sanc_desc_col = [c for c in df_sanc.columns if 'description' in c.lower()][0]

    comp_amt_col = [c for c in df_comp.columns if 'disbursed' in c.lower() or 'amount' in c.lower()][0]
    comp_mp_col = [c for c in df_comp.columns if 'member' in c.lower() or 'mp' in c.lower()][0]
    comp_cat_col = [c for c in df_comp.columns if 'category' in c.lower()][0]
    comp_desc_col = [c for c in df_comp.columns if 'description' in c.lower()][0]

    # Organize Sanctioned rows
    sanc_dict = {}
    for idx, r in df_sanc.iterrows():
        state = normalize_str(r.get('State'))
        ida = normalize_str(r.get('IDA'))
        mp = normalize_str(r.get(sanc_mp_col))
        desc = normalize_str(r.get(sanc_desc_col))
        ck = make_composite_key(state, ida, mp, desc)

        rec = {
            'sr_no': r.get('Sr. No.'),
            'composite_key': ck,
            'work_code': normalize_str(r.get('Work')),
            'category': normalize_str(r.get(sanc_cat_col)),
            'state': state,
            'ida': ida,
            'mp_name': mp,
            'constituency': normalize_str(r.get('Constituency')),
            'work_description': desc,
            'recommended_date': r['Rec_Date_Clean'],
            'sanction_date': r['Sanc_Date_Clean'],
            'sanction_amount': clean_amount(r.get(sanc_amt_col)),
            'work_status': normalize_str(r.get('Work Status')) or 'Sanctioned',
            'matched': False
        }
        if ck not in sanc_dict:
            sanc_dict[ck] = []
        sanc_dict[ck].append(rec)

    matched_sample = []
    separated_conflicts = []

    # Process Completed rows and match against Sanctioned rows
    completed_records = []
    for idx, r in df_comp.iterrows():
        state = normalize_str(r.get('State'))
        ida = normalize_str(r.get('IDA'))
        mp = normalize_str(r.get(comp_mp_col))
        desc = normalize_str(r.get(comp_desc_col))
        ck = make_composite_key(state, ida, mp, desc)

        c_date = r['Comp_Date_Clean']
        disb = clean_amount(r.get(comp_amt_col))
        img = normalize_str(r.get('Image'))
        c_sr_no = r.get('Sr. No.')
        c_work_code = normalize_str(r.get('Work'))
        c_cat = normalize_str(r.get(comp_cat_col))
        c_const = normalize_str(r.get('Constituency'))

        comp_rec = {
            'sr_no': c_sr_no,
            'composite_key': ck,
            'work_code': c_work_code,
            'category': c_cat,
            'state': state,
            'ida': ida,
            'mp_name': mp,
            'constituency': c_const,
            'work_description': desc,
            'completion_date': c_date,
            'amount_disbursed': disb,
            'image': img
        }

        matched = False
        if ck in sanc_dict:
            for s_rec in sanc_dict[ck]:
                if not s_rec['matched']:
                    # Validate candidate match
                    is_valid, reasons = validate_match(
                        s_rec['sanction_amount'], disb,
                        s_rec['recommended_date'], s_rec['sanction_date'], c_date
                    )
                    if is_valid:
                        s_rec['matched'] = True
                        s_rec['completion_date'] = c_date
                        s_rec['amount_disbursed'] = disb
                        s_rec['image'] = img
                        if s_rec['work_status'] in ['Sanction', 'Physical Inspection', 'Vendor Identification', 'Time Estimation', 'Sanctioned']:
                            s_rec['work_status'] = 'Work Completed'
                        matched = True
                        
                        if len(matched_sample) < 10:
                            matched_sample.append((s_rec, comp_rec))
                        break
                    else:
                        separated_conflicts.append({
                            'composite_key': ck,
                            'sanctioned': s_rec,
                            'completed': comp_rec,
                            'reasons': reasons
                        })

        if not matched:
            completed_records.append(comp_rec)

    # Build final list of unified work rows
    all_works = []
    work_id_counter = 1

    count_matched = 0
    count_sanctioned_only = 0
    count_completed_only = 0

    # Add Sanctioned rows (either matched or sanctioned_only)
    for ck, s_list in sanc_dict.items():
        for s_rec in s_list:
            work_id = f"WRK-{work_id_counter:06d}"
            work_id_counter += 1
            if s_rec['matched']:
                source = 'matched'
                count_matched += 1
            else:
                source = 'sanctioned_only'
                count_sanctioned_only += 1

            all_works.append({
                'work_id': work_id,
                'source': source,
                'composite_key': s_rec['composite_key'],
                'work_code': s_rec['work_code'],
                'category': s_rec['category'],
                'state': s_rec['state'],
                'ida': s_rec['ida'],
                'mp_name': s_rec['mp_name'],
                'constituency': s_rec['constituency'],
                'work_description': s_rec['work_description'],
                'recommended_date': s_rec['recommended_date'],
                'sanction_date': s_rec['sanction_date'],
                'sanction_amount': s_rec['sanction_amount'],
                'completion_date': s_rec.get('completion_date'),
                'amount_disbursed': s_rec.get('amount_disbursed'),
                'image': s_rec.get('image'),
                'work_status': s_rec['work_status'],
                'risk_score': None,
                'flags': json.dumps([]),
                'explanation': None
            })

    # Add Unmatched Completed rows (completed_only)
    for c_rec in completed_records:
        work_id = f"WRK-{work_id_counter:06d}"
        work_id_counter += 1
        count_completed_only += 1

        all_works.append({
            'work_id': work_id,
            'source': 'completed_only',
            'composite_key': c_rec['composite_key'],
            'work_code': c_rec['work_code'],
            'category': c_rec['category'],
            'state': c_rec['state'],
            'ida': c_rec['ida'],
            'mp_name': c_rec['mp_name'],
            'constituency': c_rec['constituency'],
            'work_description': c_rec['work_description'],
            'recommended_date': None,
            'sanction_date': None,
            'sanction_amount': None,
            'completion_date': c_rec['completion_date'],
            'amount_disbursed': c_rec['amount_disbursed'],
            'image': c_rec['image'],
            'work_status': 'Work Completed',
            'risk_score': None,
            'flags': json.dumps([]),
            'explanation': None
        })

    print(f"Merge summary -> Total Works: {len(all_works)}")
    print(f"  Matched: {count_matched}")
    print(f"  Sanctioned Only: {count_sanctioned_only}")
    print(f"  Completed Only: {count_completed_only}")
    print(f"  Separated Conflicts: {len(separated_conflicts)}")

    # 1. Connect to SQLite and write database
    if os.path.exists(db_path):
        os.remove(db_path)

    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    cur.execute("""
    CREATE TABLE allocated_limits (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        state TEXT,
        mp_name TEXT,
        constituency TEXT,
        allocated_amount REAL
    );
    """)

    cur.execute("""
    CREATE TABLE works (
        work_id TEXT PRIMARY KEY,
        source TEXT,
        composite_key TEXT,
        work_code TEXT,
        category TEXT,
        state TEXT,
        ida TEXT,
        mp_name TEXT,
        constituency TEXT,
        work_description TEXT,
        recommended_date TEXT,
        sanction_date TEXT,
        sanction_amount REAL,
        completion_date TEXT,
        amount_disbursed REAL,
        image TEXT,
        work_status TEXT,
        risk_score REAL,
        flags TEXT,
        explanation TEXT
    );
    """)

    cur.executemany("""
    INSERT INTO allocated_limits (state, mp_name, constituency, allocated_amount)
    VALUES (?, ?, ?, ?);
    """, alloc_rows)

    work_tuples = [
        (
            w['work_id'], w['source'], w['composite_key'], w['work_code'], w['category'],
            w['state'], w['ida'], w['mp_name'], w['constituency'],
            w['work_description'], w['recommended_date'], w['sanction_date'],
            w['sanction_amount'], w['completion_date'], w['amount_disbursed'],
            w['image'], w['work_status'], w['risk_score'], w['flags'], w['explanation']
        )
        for w in all_works
    ]

    cur.executemany("""
    INSERT INTO works (
        work_id, source, composite_key, work_code, category, state, ida, mp_name, constituency,
        work_description, recommended_date, sanction_date, sanction_amount,
        completion_date, amount_disbursed, image, work_status, risk_score, flags, explanation
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    """, work_tuples)

    cur.execute("CREATE INDEX idx_works_state ON works(state);")
    cur.execute("CREATE INDEX idx_works_category ON works(category);")
    cur.execute("CREATE INDEX idx_works_status ON works(work_status);")
    cur.execute("CREATE INDEX idx_works_source ON works(source);")
    cur.execute("CREATE INDEX idx_works_composite_key ON works(composite_key);")

    conn.commit()
    conn.close()

    print(f"SQLite DB created successfully at: {db_path}")

    # 2. Output merge_report.txt
    report_lines = []
    report_lines.append("==========================================================================")
    report_lines.append("GOVFUND TRACER - WORK RECORDS MERGE & DEDUPLICATION REPORT")
    report_lines.append("==========================================================================")
    report_lines.append("")
    report_lines.append("1. SUMMARY METRICS:")
    report_lines.append(f"   - Total Sanctioned Input Rows: {total_sanc_count}")
    report_lines.append(f"   - Total Completed Input Rows  : {total_comp_count}")
    report_lines.append(f"   - Count Matched (Merged)      : {count_matched}")
    report_lines.append(f"   - Count Sanctioned Only       : {count_sanctioned_only}")
    report_lines.append(f"   - Count Completed Only        : {count_completed_only}")
    report_lines.append(f"   - Separated Conflicting Pairs : {len(separated_conflicts)}")
    report_lines.append(f"   - Total Unified Works in DB   : {len(all_works)}")
    report_lines.append("")
    report_lines.append("==========================================================================")
    report_lines.append("2. SAMPLE OF 10 MATCHED ROWS (SIDE BY SIDE):")
    report_lines.append("==========================================================================")

    for i, (s_rec, c_rec) in enumerate(matched_sample, 1):
        report_lines.append(f"\n--- MATCH {i:02d} ---")
        report_lines.append(f"State / IDA: {s_rec['state']} | {s_rec['ida']}")
        report_lines.append(f"MP Name    : {s_rec['mp_name']} ({s_rec['constituency']})")
        report_lines.append(f"Description: {s_rec['work_description']}")
        report_lines.append(f"SANCTIONED (Sr. No. {s_rec['sr_no']}): Code={s_rec['work_code']} | RecDate={s_rec['recommended_date']} | SancDate={s_rec['sanction_date']} | Amount=₹{s_rec['sanction_amount'] or 0:,.2f} | Status={s_rec['work_status']}")
        report_lines.append(f"COMPLETED  (Sr. No. {c_rec['sr_no']}): Code={c_rec['work_code']} | CompDate={c_rec['completion_date']} | Disbursed=₹{c_rec['amount_disbursed'] or 0:,.2f} | Image={c_rec['image']}")

    report_lines.append("")
    report_lines.append("==========================================================================")
    report_lines.append(f"3. CONFLICTING PAIRS SEPARATED INSTEAD OF MERGING ({len(separated_conflicts)} total):")
    report_lines.append("==========================================================================")

    if separated_conflicts:
        for i, conf in enumerate(separated_conflicts, 1):
            s_rec = conf['sanctioned']
            c_rec = conf['completed']
            report_lines.append(f"\n--- CONFLICT PAIR {i:02d} ---")
            report_lines.append(f"State / IDA: {s_rec['state']} | {s_rec['ida']}")
            report_lines.append(f"MP Name    : {s_rec['mp_name']} ({s_rec['constituency']})")
            report_lines.append(f"Description: {s_rec['work_description']}")
            report_lines.append(f"SANCTIONED RECORD (Sr. No. {s_rec['sr_no']}): Code={s_rec['work_code']} | RecDate={s_rec['recommended_date']} | SancDate={s_rec['sanction_date']} | Amount=₹{s_rec['sanction_amount'] or 0:,.2f}")
            report_lines.append(f"COMPLETED RECORD  (Sr. No. {c_rec['sr_no']}): Code={c_rec['work_code']} | CompDate={c_rec['completion_date']} | Disbursed=₹{c_rec['amount_disbursed'] or 0:,.2f}")
            report_lines.append(f"REASON(S) FOR SEPARATION: {'; '.join(conf['reasons'])}")
    else:
        report_lines.append("None - All candidate matches passed amount and date validation.")

    report_lines.append("")
    report_lines.append("==========================================================================")
    report_lines.append("END OF REPORT")

    with open(report_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(report_lines))

    print(f"Merge report generated successfully at: {report_path}")

if __name__ == '__main__':
    ingest_data()
