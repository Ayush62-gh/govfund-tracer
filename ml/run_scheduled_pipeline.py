import os
import sys
import time
import json
import sqlite3
import traceback
import subprocess
from datetime import datetime
from typing import Dict, Any, Optional, Set

sys.stdout.reconfigure(encoding='utf-8')

# Ensure project root is in sys.path
ml_dir = os.path.dirname(os.path.abspath(__file__))
proj_root = os.path.abspath(os.path.join(ml_dir, '..'))
if proj_root not in sys.path:
    sys.path.insert(0, proj_root)

from ml.utils.db_sync import get_db_path
from ml.train_and_predict import run_pipeline

LOGS_DIR = os.path.join(ml_dir, 'logs')
LOCK_FILE = os.path.join(LOGS_DIR, '.pipeline.lock')
LOCK_MAX_AGE_SECONDS = 7200  # 2 hours
LOG_MAX_AGE_DAYS = 30


def cleanup_old_logs(logs_dir: str):
    """
    Deletes log files in ml/logs/ older than 30 days based on mtime.
    Never deletes .gitkeep or .pipeline.lock regardless of age.
    """
    if not os.path.exists(logs_dir):
        return

    now = time.time()
    cutoff = now - (LOG_MAX_AGE_DAYS * 86400)

    for fname in os.listdir(logs_dir):
        if fname in ('.gitkeep', '.pipeline.lock'):
            continue

        fpath = os.path.join(logs_dir, fname)
        if os.path.isfile(fpath):
            try:
                mtime = os.path.getmtime(fpath)
                if mtime < cutoff:
                    os.remove(fpath)
                    print(f"[LOG CLEANUP] Removed old log file: {fname}")
            except Exception as e:
                print(f"[LOG CLEANUP WARNING] Could not remove {fname}: {e}")


def acquire_lock(lock_file: str) -> bool:
    """
    Acquires file lock if not present or if older than 2 hours.
    Returns True if lock acquired, False if another active run is locked.
    """
    if os.path.exists(lock_file):
        try:
            mtime = os.path.getmtime(lock_file)
            age = time.time() - mtime
            if age < LOCK_MAX_AGE_SECONDS:
                print(f"❌ [LOCK ERROR] Pipeline run already in progress!")
                print(f"   Lock file '{lock_file}' exists and is {age/60:.1f} minutes old (< 2 hours).")
                print(f"   Exiting to prevent concurrent pipeline runs.")
                return False
            else:
                print(f"⚠️ [LOCK WARNING] Stale lock file found ({age/3600:.1f} hours old). Overwriting lock.")
        except Exception as e:
            print(f"⚠️ [LOCK WARNING] Error checking lock file age: {e}. Overwriting lock.")

    os.makedirs(os.path.dirname(lock_file), exist_ok=True)
    with open(lock_file, 'w', encoding='utf-8') as f:
        f.write(f"Locked at {datetime.now().isoformat()}\n")
    return True


def release_lock(lock_file: str):
    """Safely removes the lock file."""
    if os.path.exists(lock_file):
        try:
            os.remove(lock_file)
            print(f"🔒 [LOCK] Released lock file: {lock_file}")
        except Exception as e:
            print(f"⚠️ [LOCK WARNING] Failed to remove lock file {lock_file}: {e}")


def parse_flags(flags_val: Any) -> Set[str]:
    """Parses JSON-encoded flags string or list into a set of flag names."""
    if not flags_val:
        return set()
    if isinstance(flags_val, list):
        return set(flags_val)
    if isinstance(flags_val, str):
        try:
            parsed = json.loads(flags_val)
            if isinstance(parsed, list):
                return set(parsed)
        except Exception:
            pass
    return set()


def snapshot_db_state() -> Optional[Dict[str, Dict[str, Any]]]:
    """
    Snapshots current works table state: work_id -> {'risk_score': float, 'flags': set}.
    Returns None if DB or table does not exist.
    """
    db_path = get_db_path()
    if not os.path.exists(db_path):
        return None

    try:
        conn = sqlite3.connect(db_path)
        cur = conn.cursor()

        cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='works';")
        if not cur.fetchone():
            conn.close()
            return None

        cur.execute("SELECT work_id, risk_score, flags FROM works;")
        rows = cur.fetchall()
        conn.close()

        state = {}
        for w_id, r_score, flags_raw in rows:
            state[str(w_id)] = {
                'risk_score': float(r_score) if r_score is not None else 0.0,
                'flags': parse_flags(flags_raw)
            }
        return state
    except Exception as e:
        print(f"⚠️ [SNAPSHOT WARNING] Failed to read database snapshot: {e}")
        return None


def compute_snapshot_diff(prev_state: Dict[str, Dict[str, Any]], curr_state: Dict[str, Dict[str, Any]]) -> Dict[str, Any]:
    """
    Computes early warning diff between previous and current pipeline state.
    """
    newly_high_risk = []
    newly_flagged = []
    resolved = []
    risk_score_increased_significantly = []

    all_ids = set(prev_state.keys()).union(set(curr_state.keys()))

    for w_id in sorted(all_ids):
        prev = prev_state.get(w_id)
        curr = curr_state.get(w_id)

        prev_score = prev['risk_score'] if prev else 0.0
        curr_score = curr['risk_score'] if curr else 0.0

        prev_flags = prev['flags'] if prev else set()
        curr_flags = curr['flags'] if curr else set()

        # Newly high risk (score >= 66 now, was < 66 before or new record)
        if curr_score >= 66.0 and prev_score < 66.0:
            newly_high_risk.append(w_id)

        # Newly flagged (had 0 flags before, has >= 1 flag now)
        if len(prev_flags) == 0 and len(curr_flags) > 0:
            newly_flagged.append(w_id)

        # Resolved (had >= 1 flag before, has 0 flags now)
        if len(prev_flags) > 0 and len(curr_flags) == 0 and curr is not None:
            resolved.append(w_id)

        # Risk score increased significantly (> 15 points increase)
        if prev is not None and curr is not None and (curr_score - prev_score > 15.0):
            risk_score_increased_significantly.append(w_id)

    return {
        "newly_high_risk": newly_high_risk,
        "newly_flagged": newly_flagged,
        "resolved": resolved,
        "risk_score_increased_significantly": risk_score_increased_significantly,
        "summary_counts": {
            "newly_high_risk": len(newly_high_risk),
            "newly_flagged": len(newly_flagged),
            "resolved": len(resolved),
            "risk_score_increased_significantly": len(risk_score_increased_significantly)
        }
    }


def dev_git_checkout_cleanup():
    """
    Dev/demo-environment convenience step to keep working tree clean.
    Note: In a real production deployment, SQLite DB and output artifacts would
    not be tracked in Git.
    """
    try:
        cmd = ["git", "checkout", "backend/db/govfund.db", "ml/sample_output_validation.csv", "ml/sample_output_validation.json"]
        res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        if res.returncode == 0:
            print("🧹 [CLEANUP] Restored git-tracked DB and validation export files.")
        else:
            print(f"⚠️ [CLEANUP WARNING] git checkout returned code {res.returncode}: {res.stderr.strip()}")
    except Exception as e:
        print(f"⚠️ [CLEANUP WARNING] Could not run git checkout: {e}")


def main():
    timestamp_str = datetime.now().strftime("%Y%m%d_%H%M%S")
    iso_timestamp = datetime.now().isoformat()
    log_file_path = os.path.join(LOGS_DIR, f"pipeline_run_{timestamp_str}.log")
    diff_file_path = os.path.join(LOGS_DIR, f"diff_{timestamp_str}.json")

    # STEP 2: Log rotation/cleanup before acquiring lock
    cleanup_old_logs(LOGS_DIR)

    # STEP 1.1: Acquire lock
    if not acquire_lock(LOCK_FILE):
        sys.exit(1)

    lock_acquired = True

    try:
        # STEP 1.2: Snapshot BEFORE pipeline execution
        print("\n📸 [SNAPSHOT] Capturing database state BEFORE pipeline run...")
        prev_state = snapshot_db_state()
        if prev_state is None:
            print("   No previous snapshot found (first-ever run or DB empty).")
        else:
            print(f"   Captured snapshot of {len(prev_state)} records.")

        # STEP 1.3: Run ML Pipeline
        print("\n⚙️ [PIPELINE] Starting train_and_predict ML Risk Engine...")
        pipeline_summary = run_pipeline()

        # STEP 1.4: Snapshot AFTER pipeline execution & Compute Diff
        print("\n📸 [SNAPSHOT] Capturing database state AFTER pipeline run...")
        curr_state = snapshot_db_state()

        diff_data = None
        is_first_run = False

        if prev_state is None or len(prev_state) == 0:
            is_first_run = True
            print("ℹ️ First run — no previous snapshot to diff against.")
        else:
            diff_data = compute_snapshot_diff(prev_state, curr_state or {})
            diff_data["run_timestamp"] = iso_timestamp

            # Write diff JSON
            with open(diff_file_path, 'w', encoding='utf-8') as f:
                json.dump(diff_data, f, indent=2)
            print(f"💾 Saved early warning diff report to: {diff_file_path}")

        # STEP 1.5: Prepare Summary Output & Write Log File
        log_lines = []
        log_lines.append("=" * 75)
        log_lines.append(f"SCHEDULED PIPELINE RUN REPORT - {iso_timestamp}")
        log_lines.append("=" * 75)
        if pipeline_summary:
            log_lines.append(f"Total Records Processed : {pipeline_summary.get('total_records')}")
            log_lines.append(f"Total Flagged Records   : {pipeline_summary.get('flagged_total')}")
            log_lines.append(f"High Risk (66-100)      : {pipeline_summary.get('high_risk')}")
            log_lines.append(f"Medium Risk (31-65)    : {pipeline_summary.get('medium_risk')}")
            log_lines.append(f"Low Risk (0-30)        : {pipeline_summary.get('low_risk')}")
            log_lines.append(f"Execution Time          : {pipeline_summary.get('elapsed', 0):.2f}s")
        log_lines.append("-" * 75)
        log_lines.append("EARLY WARNING DIFF SUMMARY:")

        if is_first_run:
            log_lines.append("  First run — no previous snapshot to diff against.")
        elif diff_data:
            counts = diff_data["summary_counts"]
            log_lines.append(f"  - Newly High Risk Works (>=66 score)         : {counts['newly_high_risk']}")
            log_lines.append(f"  - Newly Flagged Works (0 -> >=1 flags)       : {counts['newly_flagged']}")
            log_lines.append(f"  - Resolved Flags (>=1 -> 0 flags)            : {counts['resolved']}")
            log_lines.append(f"  - Significant Risk Score Increase (>15 pts) : {counts['risk_score_increased_significantly']}")

        log_lines.append("=" * 75)

        summary_text = "\n".join(log_lines)
        print("\n" + summary_text)

        os.makedirs(LOGS_DIR, exist_ok=True)
        with open(log_file_path, 'w', encoding='utf-8') as f:
            f.write(summary_text + "\n")

        # STEP 1.7: Dev Git Cleanup
        dev_git_checkout_cleanup()

    except Exception as e:
        err_msg = f"❌ [PIPELINE ERROR] Scheduled pipeline run failed: {e}\n{traceback.format_exc()}"
        print(err_msg)
        os.makedirs(LOGS_DIR, exist_ok=True)
        with open(log_file_path, 'w', encoding='utf-8') as f:
            f.write(err_msg + "\n")
        sys.exit(1)

    finally:
        if lock_acquired:
            release_lock(LOCK_FILE)


if __name__ == "__main__":
    main()
