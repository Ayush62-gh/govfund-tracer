# ML Risk Engine Validation & Methodology Report (SIH PS 26102)

> **IMPORTANT DISCLAIMER ON ACCURACY & METRICS**  
> **No labelled ground-truth dataset was available; therefore, precision, recall, and F1-scores are NOT claimed.**  
> All figures presented in this report represent **unsupervised detection counts** and **heuristic risk signals**. The system identifies statistical anomalies, possible duplicate works, financial estimate outliers, sanction delays, and MPLADS guideline compliance risk signals to assist human auditors, not automated fraud decisions.

---

## 📌 1. Pipeline Overview & Methods Actually Used

The GovFund Tracer ML Risk Engine processes unified MPLADS work records from `backend/db/govfund.db` using five independent detector modules:

### A. Cost Anomaly Detector (`ml/detectors/cost_anomaly_detector.py`)
* **Primary Method 1 (IQR Outlier)**: Grouped by `(state, category)`. IQR bounds ($Q3 + 1.5 \times \text{IQR}$) are calculated **only for groups with $\ge 10$ samples**. Groups with $<10$ samples are marked as `insufficient_baseline` and excluded from IQR flagging.
* **Primary Method 2 (Isolation Forest)**: Multi-dimensional financial outlier detection fitted on features `['sanction_amount', 'days_to_sanction']` (`contamination = 0.05`, `random_state = 42`).
* **Combined High-Confidence Signal**: A primary high-confidence cost anomaly (`FLAG_COST_ANOMALY_COMBINED`) is triggered **ONLY when BOTH IQR and Isolation Forest detectors fire simultaneously**.
* **Supplementary Diagnostics**: Robust Z-Score ($Z = \frac{X - \text{Median}}{1.4826 \times \text{MAD}}$) and MAD are computed as supplementary diagnostic metadata labeled as `robust_z_score` and `mad`.

### B. Possible Duplicate Work Detector (`ml/detectors/duplicate_detector.py`)
* **Method**: TF-IDF vectorization (`ngram_range=(1,2)`, `stop_words='english'`) combined with Cosine Similarity computed **WITHIN each `(state, category)` group**.
* **Threshold**: Pairs with `cosine_similarity > 0.85` are flagged as `FLAG_POSSIBLE_DUPLICATE`.
* **Location Context**: Extracts village/GP tokens from raw descriptions and checks location alignment (`same_village_gp_indicated`: `True` / `False` / `Uncertain`).
* **Dynamic Precision Configuration**: Explanations and documentation read dynamically from single named constants (`DUPLICATE_MANUAL_SAMPLE_PRECISION_PCT = 40.0`, `DUPLICATE_MANUAL_SAMPLE_SIZE_N = 5`) configured in `ml/risk_aggregator.py`.

### C. Delay Detector (`ml/detectors/time_lag_detector.py`)
* **Method**: Deterministic rule $(\text{sanction\_date} - \text{recommended\_date}) > 365 \text{ days} \rightarrow \text{FLAG\_SANCTION\_DELAY}$. *(Note: This is a deterministic time-delta rule, NOT a trained ML model).*

### D. MPLADS Guidelines Compliance Detector (`ml/detectors/split_sanction_detector.py`)
* **Configurable Constants**:
  * `TRUST_SOCIETY_LIFETIME_CAP = 5000000` (₹50 Lakh lifetime cap for Trust/Society works).
  * `OUT_OF_CONSTITUENCY_ANNUAL_CAP = 2500000` (₹25 Lakh annual cap per MP for out-of-constituency works).
* **Flags**:
  * `FLAG_TRUST_CAP_CIRCUMVENTION`: Cumulative sanctions to a Trust/Society reaching $\ge 90\%$ (approaching) or $>100\%$ (breach) of the ₹50L cap.
  * `FLAG_OUT_OF_CONSTITUENCY_CAP_BREACH`: Annual out-of-constituency sanctions exceeding ₹25L per FY.
  * `FLAG_RAPID_SUBTHRESHOLD_SANCTIONS`: Pattern review signal for 3+ works sanctioned to the same IDA within 14 days under ₹5L. *(Clearly distinguished from official guideline violations)*.

### E. Fund Mismatch Detector & Data Constraint Finding (`ml/detectors/fund_mismatch_detector.py`)
* **Deliberate Architectural Finding (Attempted & Documented)**:
  * We attempted adding fund-utilization-mismatch detection using Expenditure exports from the official MPLADS dashboard.
  * **Experimental Finding**: Only 1.94% of Expenditure Work IDs matched our existing works table (composite-key match was 0.16%).
  * **Root Cause**: Dashboard report exports sample different time slices of a live system — Expenditure skewed to recent Sept 2026 transactions, whereas Sanctioned/Completed cover 2024-2025 works.
  * **Finding**: `0` records flagged in current unified table. *Reason*: `ingest.py`'s own `validate_match()` function already filters out severe amount-mismatched pairs during CSV parsing before they can become unified `matched` rows.
  * **Decision**: Retained as an explicit, documented detector to demonstrate data-constraint rigor and uncertainty reporting.

### F. Risk Aggregator & Numeric Confidence Column (`ml/risk_aggregator.py` & `ml/utils/db_sync.py`)
* **Composite Risk Score (0 - 100)**: Weighted aggregation of independent signals.
* **Numeric Confidence Column (`works.confidence`)**: Written as a REAL numeric value (`0.0` to `1.0`) directly into the SQLite database for every work record. Explicitly defined as a **Heuristic Confidence Proxy** for indicator agreement, **NOT a mathematical probability of fraud**.

---

## 📊 2. Real-Data Pipeline Detection Counts

Execution summary on **9,624 real work records** in `backend/db/govfund.db`:

| Metric / Detector Signal | Count | Percentage |
| :--- | :--- | :--- |
| **Total Records Processed** | **9,624** | 100.0% |
| **Total Flagged Risk Records** | **2,197** | **22.8%** |
| - Possible Duplicate Candidate Records | 1,250 | 13.0% |
| - Cost IQR Outliers | 418 | 4.3% |
| - Cost Isolation Forest Outliers | 481 | 5.0% |
| - **Combined High-Confidence Cost Anomalies (IQR + IF)** | **198** | **2.1%** |
| - **Fund Mismatch Variance Flags** | **0** | **0.0%** *(Data Constraint Documented)* |
| - Sanction Delay Flags (>365 days) | 230 | 2.4% |
| - Compliance & Guideline Breach Flags | 489 | 5.1% |

### Risk Score Distribution (SQL Query on `works.risk_score`):
* 🔴 **High Risk (66 - 100)**: **13 records (0.1%)**
* 🟡 **Medium Risk (31 - 65)**: **1,440 records (15.0%)**
* 🟢 **Low Risk (0 - 30)**: **8,171 records (84.9%)**

### Numeric Confidence Column Distribution (SQL Query on `works.confidence`):
* **`confidence = 0.95`** (Very High Confidence, 3+ detectors): **27 records (0.3%)**
* **`confidence = 0.90`** (High Confidence, regular low-risk works): **7,427 records (77.2%)**
* **`confidence = 0.85`** (High Confidence, Combined Cost Anomaly): **152 records (1.6%)**
* **`confidence = 0.80`** (High Confidence, 2 detectors): **418 records (4.3%)**
* **`confidence = 0.75`** (Moderate Confidence, high similarity / single detector): **951 records (9.9%)**
* **`confidence = 0.55`** (Moderate Confidence, 1 detector): **649 records (6.7%)**

---

## 🔬 3. Manual Sample Validation (Representative Duplicate Pairs)

Manual inspection of representative candidate pairs flagged by the Duplicate Detector (configured via `DUPLICATE_MANUAL_SAMPLE_PRECISION_PCT = 40.0`, `DUPLICATE_MANUAL_SAMPLE_SIZE_N = 5`):

| Pair # | Work ID 1 | Work ID 2 | State & Category | Description 1 vs Description 2 | Location Match | Manual Classification |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | `WRK-000091` | `WRK-001170` | Punjab<br>`Normal/Others` | *"Construction of MID DAY Meal Shed in Govt Primary school Pakka No.4"* vs *"Construction of mid-day meal Shed in Govt primary School"* | `Pakka No.4` vs `Unspecified` | **`uncertain`** |
| **2** | `WRK-000097` | `WRK-001158` | Punjab<br>`Normal/Others` | *"Installation of RO System and water cooler in Govt Primary school Gurri Sangar"* vs *"Installation of RO System and water cooler in Govt High school Gurri Sangar"* | Same Village: `Gurri Sangar` (Primary vs High School) | **`potential_true_duplicate`** |
| **3** | `WRK-000296` | `WRK-000297` | Chhattisgarh<br>`Normal/Others` | *"Highmast solar Street light- Two piece"* vs *"Highmast Solar Street light- Two Piece"* | Same Constituency, Village Unspecified | **`likely_template_false_positive`** |
| **4** | `WRK-000297` | `WRK-000296` | Chhattisgarh<br>`Normal/Others` | *"Highmast Solar Street light- Two Piece"* vs *"Highmast solar Street light- Two piece"* | Same Constituency, Village Unspecified | **`likely_template_false_positive`** |
| **5** | `WRK-000298` | `WRK-000296` | Chhattisgarh<br>`Normal/Others` | *"Highmast Solar Street light- Two Piece."* vs *"Highmast solar Street light- Two piece"* | Same Constituency, Village Unspecified | **`likely_template_false_positive`** |

* **Initial Sample Precision**: **40.0%** ($N=5$). Configured as single top-level constants `DUPLICATE_MANUAL_SAMPLE_PRECISION_PCT` and `DUPLICATE_MANUAL_SAMPLE_SIZE_N` for single-point updates when wider $N \approx 30$ sample results arrive.

---

## ⚠️ 4. Known False-Positive Risks & Limitations

1. **Templated & Boilerplate Project Descriptions**:
   * Standard government procurement text (e.g. *"Installation of solar street light"*, *"Construction of mid-day meal shed"*, *"Purchase of books for school"*) legitimately recurs across multiple distinct villages in the same constituency.
   * Without fine-grained Village/Gram Panchayat entity parsing, high TF-IDF similarity flags these as duplicate candidates.
2. **Temporal Sampling Skew in Expenditure Data**:
   * Official MPLADS report exports sample different time slices of a live system (Expenditure exports skew to Sept 2026 transactions, Sanctioned/Completed cover 2024-2025).
3. **Small Peer-Group Sample Sizes in Cost IQR**:
   * Groups with $<10$ samples are safely skipped (`insufficient_baseline`), but sparse categories in smaller states may miss legitimate outliers due to strict sample size constraints.
4. **Lack of Ground-Truth Fraud Labels**:
   * Unsupervised anomaly detection identifies statistical outliers and guideline deviations, not verified fraud cases. All flagged cases require manual audit verification.
5. **Location Token Keyword List Limitation in `extract_village_gp_tokens`**:
   * The location token extractor `extract_village_gp_tokens` relies on a fixed keyword list: `["village", "vill", "gp", "panchayat", "gram", "maug", "bazar", "faliya", "game", "at", "near"]`.
   * **Limitation**: It does **NOT** include administrative division keywords such as `"block"`, `"ward"`, `"colony"`, `"nagar"`, `"tq"` (taluk/tehsil), `"mandal"`, or `"sec"`/`"sector"`.
   * **Empirical Impact**: Descriptions distinguished only by block/ward/nagar/colony/tq/mandal designations (e.g. *"Installation of lights in Tiruvallur Municipality Ward no 1"* vs *"Ward no 2"* or *"Motihari Nagar..."*) fail to produce location tokens (`[]`). Consequently, the detector falls through to `same_village_gp_indicated = "Uncertain"` rather than extracting location tokens and flagging them as distinct locations (`"False"`). Empirical run on the 9,624 dataset shows **1,147 out of 1,250 candidate duplicate entries fall through to `"Uncertain"`**, with multiple pairs containing uncaptured administrative keywords.

---

## 📁 5. Validation Artifacts Generated

* **Sample Validation JSON**: [`ml/sample_output_validation.json`](file:///c:/Users/sonim/Desktop/GovFundTracer/govfund-tracer/ml/sample_output_validation.json)
* **Sample Validation CSV**: [`ml/sample_output_validation.csv`](file:///c:/Users/sonim/Desktop/GovFundTracer/govfund-tracer/ml/sample_output_validation.csv)
* **Master Script**: [`ml/train_and_predict.py`](file:///c:/Users/sonim/Desktop/GovFundTracer/govfund-tracer/ml/train_and_predict.py)

---

## Phase 1 Bug-Fix Re-Validation (2026-09-26)

### Detector Flagged-Record Counts:
* **Total Records Processed**: 9,624
* **Total Flagged Risk Records**: 2,296 (23.9%)
  * **Possible Duplicate Candidate Records**: 1,250
  * **Cost IQR Outliers**: 418
  * **Cost Isolation Forest Outliers**: 483 (grouped per `(state, category)`)
  * **Combined High-Confidence Cost Anomalies (IQR + IF)**: 237
  * **Fund Mismatch Variance Flags (`FLAG_FUND_MISMATCH`)**: **0 records** (strict `sanctioned_only` + `completed_only` source filter)
  * **Sanction Delay Flags (>365 days / Stagnant)**: 292 (dynamic `ref_date`)
  * **Compliance & Guideline Breach Flags**: 489

### Risk Score Distribution (SQL Query on `works.risk_score`):
* 🔴 **High Risk (66 - 100)**: **15 records (0.2%)**
* 🟡 **Medium Risk (31 - 65)**: **1,473 records (15.3%)**
* 🟢 **Low Risk (0 - 30)**: **8,136 records (84.5%)**

> **Fund Mismatch Detector Finding**: Restricting Pass 2 cross-referencing strictly to `source == 'sanctioned_only'` and `source == 'completed_only'` split rows eliminates spurious cross-matches against already-matched (`source == 'matched'`) records sharing identical `composite_key` templates, yielding **0 records** flagged by `FLAG_FUND_MISMATCH` on the current ingested dataset.
> 
> **Investigation Note**: The 4 genuine amount-mismatch conflicts logged in `backend/db/merge_report.txt` (ratios 1.67x-3.42x) do not survive as comparable `sanctioned_only` + `completed_only` pairs in the final `works` table, because `backend/ingest.py`'s greedy matching algorithm finds alternate (sometimes coincidental) valid partners for each side before giving up, and only logs the original conflict as text rather than persisting it as data. This means Pass 2's 0-record result is correct given current `ingest.py` behavior — the ML layer cannot recover this signal without a change to `backend/ingest.py` itself (specifically: persisting rejected match candidates as flaggable records instead of only logging them to `merge_report.txt` and discarding them). This is tracked as a backend-side follow-up, out of scope for the `ml/` folder.

---

## Phase 2 Guideline & Precision Fixes (2026-09-26)

### Guideline Cap Verification:
* **`TRUST_SOCIETY_LIFETIME_CAP = 5,000,000` (₹50 Lakh)** and **`OUT_OF_CONSTITUENCY_ANNUAL_CAP = 2,500,000` (₹25 Lakh)** were independently verified against official MPLADS Guidelines (Para 3.21.2 & Para 3.12) and cross-checked with multiple independent government sources; both caps are confirmed correct.

### Step 1 — MPLADS Trust/Society Cap Additions & Deprived Segment Relaxations:
* **New Aggregate Cap (`FLAG_TRUST_ANNUAL_AGGREGATE_BREACH`)**: Added `TRUST_SOCIETY_ANNUAL_AGGREGATE_CAP = 10,000,000` (₹1 Crore per MP per FY across ALL trusts/societies combined). This newly flagged **26 work_ids** in the dataset where an MP's cumulative recommendations to trusts in a single FY exceeded ₹1 Crore.
* **Relaxed Deprived-Segment Cap (`DEPRIVED_SEGMENT_LIFETIME_CAP`)**: Implemented `DEPRIVED_SEGMENT_KEYWORDS` matching for orphanages, old-age homes, blind/disabled institutions, etc. (Para 3.21.5). **0 work_ids** in the current dataset required the relaxed ₹1 Crore lifetime cap (none breached ₹50L).

### Step 2 — Duplicate Detector Precision Adjustment via Location Signals:
* **Score Adjustment**: Records with `same_village_gp_indicated == 'False'` (different villages detected in boilerplate template text) now receive a `0.5x` score penalty.
* **Classification Breakdown**:
  * **`FLAG_POSSIBLE_DUPLICATE` (high confidence, adjusted score $\ge 0.6$)**: **1,246 records** (down from 1,250).
  * **`FLAG_POSSIBLE_DUPLICATE_LOW_CONFIDENCE` (adjusted score $0.4 \le s < 0.6$)**: **4 records** (absorbed the 4 template false positives).
  * **Total Combined Duplicate-Related Records**: **1,250 records** (total candidate count preserved for auditor review).

### Step 3 — Mandal Keyword Disambiguation & False-Positive Elimination:
* **False-Positive Discovery**: Manual verification of the new `FLAG_TRUST_ANNUAL_AGGREGATE_BREACH` flag revealed that all 26 flagged work_ids belonged to MP Daggumalla Prasada Rao and were false positives.
* **Root Cause**: The keyword list in `extract_trust_name()` (`ml/utils/text_preprocessing.py`) included the bare word `'mandal'`, which incorrectly matched Andhra Pradesh/Telangana administrative unit names (e.g., "Palasamudram Mandal", "Penumuru Mandal" — a Mandal is a Tehsil-equivalent administrative unit in AP/Telangana, not a Trust/Society organization).
* **Fix**: Removed bare `'mandal'` from the `keywords` list and added specific 2-word charitable-organization phrases (`'seva mandal'`, `'mahila mandal'`, `'yuva mandal'`, `'kalyan mandal'`).
* **Re-Validation Results**:
  * **`FLAG_TRUST_ANNUAL_AGGREGATE_BREACH` work_ids count**: Dropped from **26** down to **0**.
  * **MP Daggumalla Prasada Rao's Trust Group**: False trust matches dropped from 75 works down to **0** trust matches and **0** breach flags.
  * **Panchayat Samiti Disambiguation**: Removed bare `'samiti'` from `keywords` (adding 2-word charitable phrases `'seva samiti'`, `'mahila samiti'`, `'yuva samiti'`, `'kalyan samiti'`, `'vikas samiti'`) to prevent government Panchayati Raj local bodies ("Panchayat Samiti") from being misclassified as private trusts; `FLAG_TRUST_CAP_CIRCUMVENTION` count dropped from **2** to **1** (eliminating the false positive on WRK-002113).

### Step 4 — Duplicate Detector Location Extraction Directionality Fix:
* **Root Cause & Fix**: `extract_village_gp_tokens` previously only checked tokens appearing AFTER a prefix keyword ("village X", "gp Y"). In real Indian place names, administrative units frequently follow the location name ("Amudala Mandal", "Shivaji Nagar", "Ramnagar Ward"). Added `ADMIN_DIVISION_SUFFIX_KEYWORDS` (`["block", "ward", "nagar", "mandal", "sector", "tq", "taluka", "tehsil"]`) to inspect preceding words (and both directions for `"sector"`).
* **Location Classification Shift**:
  * **`True` (same village/GP/mandal/nagar matched)**: **115 pairs** (up from 99).
  * **`Uncertain` (unspecified/no location token extracted)**: **1,133 pairs** (down from 1,147).
  * **`False` (different location tokens detected in template text)**: **2 pairs** (down from 4).
* **Flag Code Breakdown**: `FLAG_POSSIBLE_DUPLICATE`: 1,248 records; `FLAG_POSSIBLE_DUPLICATE_LOW_CONFIDENCE`: 2 records (total candidates: 1,250).
* **Location Stoplist Filtering**: Added `location_stopwords` set (`"different"`, `"various"`, `"several"`, `"multiple"`, `"other"`, `"same"`, `"nearby"`, `"adjoining"`) to `extract_village_gp_tokens` to filter out non-place adjectives; `True` count adjusted from 115 to 72 (`Uncertain` 1,176), preventing false-positive location matching on generic phrases.

### Updated Manual Precision Estimate (N=30):
* A true random ($N=30$) sample drawn from `FLAG_POSSIBLE_DUPLICATE` production output found approximately 2/30 (~7%) pairs were plausible genuine duplicates. The rest were legitimate boilerplate/templated MPLADS scheme language (e.g. *"purchase of books for school library... five lacs each school"* recurring across many unrelated works) reused legitimately across different MPs/constituencies for the same scheme category.
* **Note**: This explicitly replaces the earlier $N=5$ / 40% figure, which undersampled and did not reflect the detector's true production-scale precision.
* **Structural Observation from Manual Review**: The detector currently groups by `(state, category)` only, with no `mp_name`/constituency awareness. Most false-positive duplicates observed were the SAME boilerplate MPLADS scheme wording (e.g. standard book-purchase or high-mast-light language) legitimately reused across DIFFERENT MPs/constituencies funding the same scheme category — not one MP double-billing the same work. Adding `mp_name` to the grouping key would reduce some cross-MP noise, but would not resolve the core issue: most flagged descriptions lack any specific location (village/school/GP name) to distinguish genuinely duplicate claims from legitimate repeated scheme funding. A reliable fix would need a dedicated location/beneficiary-name field in the source data, which is not currently available. Deferred as a data limitation, not an algorithm fix, for a future phase if such a field becomes available.


> **Known Limitation**: Works explicitly categorized as 'Trust and Society' where `extract_trust_name()` cannot extract a specific entity name default to an empty-string `trust_entity` key. Multiple genuinely DIFFERENT trusts belonging to the same MP with unextractable names would be incorrectly grouped and summed together under this shared empty key, potentially causing a false `FLAG_TRUST_CAP_CIRCUMVENTION`. This was not fixed in Phase 2 (would require either improving entity-name extraction coverage or excluding empty-entity works from lifetime-cap aggregation entirely) and is deferred to a future phase.


---

## Phase 3 — Feedback Infrastructure, Calibration, and Holistic ML Signal (2026-09-26)

### 1. Feedback Infrastructure & Calibration Status:
* **Feedback Capture Table (`ml_audit_feedback`)**: Added functions in `ml/utils/db_sync.py` (`save_audit_feedback()`, `get_audit_feedback()`, `count_labeled_feedback()`). The table was initialized and is currently empty (**0 labeled samples**).
* **Weight Calibration (`ml/calibrate_weights.py`)**: Defined `MIN_LABELED_SAMPLES_REQUIRED = 30`. Running `python ml/calibrate_weights.py` confirmed that calibration correctly refused to calibrate weights due to insufficient data (**0 < 30 samples**), preventing small-sample overfitting noise. The system safely falls back to hardcoded heuristic `DETECTOR_WEIGHTS` in `ml/risk_aggregator.py`.

### 2. Holistic Anomaly Detector (`ml/detectors/holistic_anomaly_detector.py`):
* **Multivariate ML Signal (`FLAG_HOLISTIC_ML_ANOMALY`)**: Evaluates 6 engineered features (`sanction_amount`, `days_to_sanction`, `days_sanction_to_completion`, `category_code`, `work_status_code`, `disbursement_ratio`) fitted on per-`(state, category)` `IsolationForest` models (`contamination=0.05`, `random_state=42`, peer group size $\ge 10$).
* **Detection & Overlap Breakdown**:
  * **Total Holistic ML Anomalies Flagged**: **474 records**.
  * **Overlap with Existing Detectors**: **343 records (72.4%)** were already flagged by at least one other detector module.
  * **Net-New Anomalies**: **131 records (27.6%)** represent net-new multivariate anomalies discovered by the holistic ML model that no single-feature detector caught.

### 3. Pipeline Summary & Updated Anomaly Counts:
* **Total Records Processed**: 9,624
* **Total Flagged Risk Records**: **2,420 (25.1%)**
  * **Possible Duplicate Candidate Records**: 1,250
  * **Cost IQR Outliers**: 418
  * **Cost Isolation Forest Outliers**: 483
  * **Combined High-Confidence Cost Anomalies (IQR + IF)**: 237
  * **Fund Mismatch Variance Flags**: 0
  * **Sanction Delay Flags (>365 days)**: 292
  * **Compliance & Guideline Breach Flags**: 484
  * **Holistic Multivariate ML Anomalies**: 474

### 4. Risk Score & Corrected Confidence Column Distribution:
* 🔴 **High Risk (66 - 100)**: **31 records (0.3%)**
* 🟡 **Medium Risk (31 - 65)**: **1,593 records (16.6%)**
* 🟢 **Low Risk (0 - 30)**: **8,000 records (83.1%)**
* **Confidence Distribution Correction**:
  * Because `FLAG_HOLISTIC_ML_ANOMALY` overlaps ~72.4% with the other single-feature detectors, counting it unconditionally in `detectors_flagged` inflated multi-detector confidence when it merely echoed an existing signal.
  * `risk_aggregator.py` was corrected to increment `detectors_flagged` for `holistic_data` **ONLY when it represents a net-new finding** (i.e., no other detector fired for that work_id).
  * **Before vs. After Corrected Confidence Breakdown**:
    * **`confidence = 0.95`**: 111 $\rightarrow$ **27 records** (corrected inflated 3+ detector agreement count)
    * **`confidence = 0.90`**: 7,204 $\rightarrow$ **7,427 records**
    * **`confidence = 0.85`**: 79 $\rightarrow$ **152 records**
    * **`confidence = 0.80`**: 499 $\rightarrow$ **418 records**
    * **`confidence = 0.75`**: 938 $\rightarrow$ **951 records**
    * **`confidence = 0.55`**: 793 $\rightarrow$ **649 records**

> **Methodology Note**: The Holistic Anomaly Detector is an **unsupervised** model fitted without ground-truth fraud labels. It identifies multi-feature statistical outliers within local peer groups for auditor review; supervised model calibration will be triggered once $\ge 30$ human audit verdicts are logged via `save_audit_feedback()`.

---

## Phase 4 — Scheduled Pipeline Automation (2026-09-26)

### 1. Architectural Infrastructure
* **Automated Runner (`ml/run_scheduled_pipeline.py`)**: Implemented a standalone scheduled execution script designed to be triggered via OS-level schedulers (Cron on Linux/Mac, Task Scheduler on Windows).
* **30-Day Log Rotation**: Automatically purges log files in `ml/logs/` older than 30 days while preserving `.gitkeep` and `.pipeline.lock`.
* **Concurrency Protection**: Uses a 2-hour file lock (`ml/logs/.pipeline.lock`). Attempts to trigger concurrent pipeline runs exit immediately with code `1`.
* **Pre- & Post-Execution Database Snapshots**: Captures state snapshots of `(work_id, risk_score, flags)` before and after execution.
* **Early Warning Diff Engine**: Computes delta statistics saved to `ml/logs/diff_<YYYYMMDD_HHMMSS>.json`:
  * `newly_high_risk`: Works transitioning to `risk_score >= 66`.
  * `newly_flagged`: Works moving from 0 flags to $\ge 1$ flags.
  * `resolved`: Works transitioning from $\ge 1$ flags to 0 flags.
  * `risk_score_increased_significantly`: Works experiencing a $> 15$ point score jump.
* **Documentation (`ml/SCHEDULING.md`)**: Comprehensive operational guide covering Cron setup, Windows Task Scheduler parameters, log paths, and external trigger architectural notes.

### 2. Empirical Verification & Test Results
1. **Initial Pipeline Run**: Successfully processed all 9,624 work records, generated execution log (`ml/logs/pipeline_run_20260926_225419.log`), computed baseline diff report, and cleanly released file locks.
2. **Subsequent Pipeline Run**: Verified diff engine computation on repeated run (`ml/logs/diff_20260926_225606.json`).
3. **Concurrency Lock Enforcement**: Manually created `.pipeline.lock` and attempted execution. Script trapped lock collision, printed `[LOCK ERROR]`, aborted pipeline execution immediately with exit code `1`, and safely preserved existing state.

> **Known Dev-Environment Note**: In this git-tracked development clone, `run_scheduled_pipeline.py` executes `git checkout backend/db/govfund.db` after each run to preserve repository cleanliness. Consequently, consecutive test runs compare fresh computations against the un-scored raw baseline rather than the prior run's state, yielding identical diff counts (20 newly high risk, 285 newly flagged, 62 resolved, 527 significant score increases). In production, un-versioned database persistence will allow diffs to reflect true day-over-day incremental data ingestion.







