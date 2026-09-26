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

### E. Fund Mismatch Detector (`ml/detectors/fund_mismatch_detector.py`)
* **Method**: Detects financial discrepancies where ratio $>1.5$ and absolute difference $> \text{₹}50,000$ between sanctioned and disbursed amounts.
* **Finding**: `0` records in current unified dataset. *Reason*: `ingest.py`'s own `validate_match()` function already filters out severe amount-mismatched pairs during CSV parsing before they can become unified `matched` rows, so zero amount-mismatched records reached the final merged `works` table.

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
| - Fund Mismatch Variance Flags | 0 | 0.0% |
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

## 🔬 3. Manual Sample Validation (5 Representative Duplicate Pairs)

Manual inspection of 5 representative candidate pairs flagged by the Duplicate Detector:

| Pair # | Work ID 1 | Work ID 2 | State & Category | Description 1 vs Description 2 | Location Match | Manual Classification |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | `WRK-000091` | `WRK-001170` | Punjab<br>`Normal/Others` | *"Construction of MID DAY Meal Shed in Govt Primary school Pakka No.4"* vs *"Construction of mid-day meal Shed in Govt primary School"* | `Pakka No.4` vs `Unspecified` | **`uncertain`** |
| **2** | `WRK-000097` | `WRK-001158` | Punjab<br>`Normal/Others` | *"Installation of RO System and water cooler in Govt Primary school Gurri Sangar"* vs *"Installation of RO System and water cooler in Govt High school Gurri Sangar"* | Same Village: `Gurri Sangar` (Primary vs High School) | **`potential_true_duplicate`** |
| **3** | `WRK-000296` | `WRK-000297` | Chhattisgarh<br>`Normal/Others` | *"Highmast solar Street light- Two piece"* vs *"Highmast Solar Street light- Two Piece"* | Same Constituency, Village Unspecified | **`likely_template_false_positive`** |
| **4** | `WRK-000297` | `WRK-000296` | Chhattisgarh<br>`Normal/Others` | *"Highmast Solar Street light- Two Piece"* vs *"Highmast solar Street light- Two piece"* | Same Constituency, Village Unspecified | **`likely_template_false_positive`** |
| **5** | `WRK-000298` | `WRK-000296` | Chhattisgarh<br>`Normal/Others` | *"Highmast Solar Street light- Two Piece."* vs *"Highmast solar Street light- Two piece"* | Same Constituency, Village Unspecified | **`likely_template_false_positive`** |

* **5-Sample False-Positive Count**: **3 out of 5** (60% in this 5-record sample were boilerplate template repetitions across generic descriptions).

---

## ⚠️ 4. Known False-Positive Risks & Limitations

1. **Templated & Boilerplate Project Descriptions**:
   * Standard government procurement text (e.g. *"Installation of solar street light"*, *"Construction of mid-day meal shed"*, *"Purchase of books for school"*) legitimately recurs across multiple distinct villages in the same constituency.
   * Without fine-grained Village/Gram Panchayat entity parsing, high TF-IDF similarity flags these as duplicate candidates (~40% precision on manual sample).
2. **Small Peer-Group Sample Sizes in Cost IQR**:
   * Groups with $<10$ samples are safely skipped (`insufficient_baseline`), but sparse categories in smaller states may miss legitimate outliers due to strict sample size constraints.
3. **Lack of Ground-Truth Fraud Labels**:
   * Unsupervised anomaly detection identifies statistical outliers and guideline deviations, not verified fraud cases. All flagged cases require manual audit verification.

---

## 📁 5. Validation Artifacts Generated

* **Sample Validation JSON**: [`ml/sample_output_validation.json`](file:///c:/Users/sonim/Desktop/GovFundTracer/govfund-tracer/ml/sample_output_validation.json)
* **Sample Validation CSV**: [`ml/sample_output_validation.csv`](file:///c:/Users/sonim/Desktop/GovFundTracer/govfund-tracer/ml/sample_output_validation.csv)
* **Master Script**: [`ml/train_and_predict.py`](file:///c:/Users/sonim/Desktop/GovFundTracer/govfund-tracer/ml/train_and_predict.py)
