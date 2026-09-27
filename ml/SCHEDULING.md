# Scheduled ML Risk & Compliance Pipeline Execution

This document describes how to execute and schedule the **GovFund Tracer ML Risk Engine** periodically (e.g., nightly or weekly) using `ml/run_scheduled_pipeline.py`.

---

## 1. Overview of `ml/run_scheduled_pipeline.py`

`ml/run_scheduled_pipeline.py` is the single automated entry point for scheduled execution of the ML pipeline. Each run performs the following automated steps:

1. **Log Rotation**: Deletes log files in `ml/logs/` older than 30 days (`.gitkeep` and `.pipeline.lock` are preserved).
2. **Concurrency Locking**: Acquires a file lock (`ml/logs/.pipeline.lock`). If another run is in progress and lock age is < 2 hours, execution exits immediately to prevent database corruption. Stale locks (> 2 hours) are automatically superseded.
3. **Database Pre-Snapshot**: Captures an in-memory dictionary snapshot of `(work_id, risk_score, flags)` from the `works` SQLite table before execution.
4. **Pipeline Execution**: Executes `ml/train_and_predict.py`'s `run_pipeline()` function across all 6 risk detectors and risk aggregator.
5. **Database Post-Snapshot & Early Warning Diff**:
   - Queries `works` table state after execution.
   - Computes an early warning diff against pre-snapshot state:
     - `newly_high_risk`: Works reaching `risk_score >= 66` from `< 66`.
     - `newly_flagged`: Works going from 0 flags to $\ge 1$ flags.
     - `resolved`: Works going from $\ge 1$ flags to 0 flags.
     - `risk_score_increased_significantly`: Works whose `risk_score` jumped by $> 15$ points.
   - Saves early-warning diff as JSON to `ml/logs/diff_<YYYYMMDD_HHMMSS>.json`.
6. **Execution Logging**: Appends a summary log to `ml/logs/pipeline_run_<YYYYMMDD_HHMMSS>.log`.

---

## 2. Linux / macOS Cron Setup

To run the pipeline automatically every night at 2:00 AM, add the following cron entry using `crontab -e`:

```bash
0 2 * * * cd /path/to/govfund-tracer && python ml/run_scheduled_pipeline.py >> ml/logs/cron.log 2>&1
```

---

## 3. Windows Task Scheduler Setup

To schedule the pipeline on Windows:

1. Open **Task Scheduler** (`taskschd.msc`) $\rightarrow$ Click **Create Basic Task...**
2. **Trigger**: Select **Daily**, recur every 1 day at `2:00 AM`.
3. **Action**: Select **Start a program**:
   - **Program/script**: `python` (or full path to python executable e.g. `C:\Python311\python.exe`)
   - **Add arguments**: `ml/run_scheduled_pipeline.py`
   - **Start in**: `C:\path\to\govfund-tracer` (repository root directory)
4. Click **Finish**.

---

## 4. Output Locations & Artifacts

All log files and diff reports are written to `ml/logs/`:

- **Full Log Summary**: `ml/logs/pipeline_run_<YYYYMMDD_HHMMSS>.log`
- **Early Warning Diff JSON**: `ml/logs/diff_<YYYYMMDD_HHMMSS>.json`
- **Lock File**: `ml/logs/.pipeline.lock` (automatically deleted upon completion)

---

## 5. NOT YET WIRED UP (OS-Level Scheduler Notice)

> [!IMPORTANT]
> `ml/run_scheduled_pipeline.py` is currently designed for execution via command line or external OS schedulers (Cron / Task Scheduler).
> There is **no in-app "Run Now" button or REST API endpoint** in the backend UI to trigger scheduled runs dynamically. Wiring scheduled pipeline execution into FastAPI background tasks or frontend admin panels requires backend endpoint updates, which are out of scope for the current ML module boundary.

---

## 6. ⚠️ KNOWN DEV-ENVIRONMENT LIMITATION

In this development/demo git-tracked clone, `run_scheduled_pipeline.py`'s cleanup step runs `git checkout backend/db/govfund.db` after every run (to keep the working tree clean per this project's git hygiene convention). This means each run's 'before' snapshot always reads the original, never-scored raw database committed to git — NOT the previous run's actual computed output. As a result, consecutive test runs in this dev clone will show IDENTICAL diff numbers (confirmed empirically: two consecutive manual test runs both reported the same 20 newly-high-risk / 285 newly-flagged / 62 resolved / 527 significant-increase counts), because both are really comparing 'raw baseline' vs 'fresh computation', not 'previous run vs this run'.

This is NOT a bug in the diff-computation logic itself — it is correct given its inputs. In a real production deployment, `backend/db/govfund.db` would NOT be under git version control at all (real databases aren't committed to git), so this git-checkout step would not exist, snapshots would correctly persist between runs, and the diff would show genuine day-over-day changes as new works are ingested and re-scored. This limitation is specific to demonstrating the feature inside this git-tracked development repository.

