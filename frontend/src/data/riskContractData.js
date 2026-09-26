/**
 * MPLADS AI Monitoring Platform - Risk Score JSON Contract Store
 * 
 * STRICT CONTRACT SPECIFICATION:
 * {
 *   "work_id": "...",
 *   "state": "...",
 *   "category": "...",
 *   "ida": "...",
 *   "risk_score": 0-100,
 *   "flags": [
 *     "cost_outlier",
 *     "possible_duplicate",
 *     "delayed",
 *     "fund_mismatch"
 *   ],
 *   "explanation": "human-readable string per flag"
 * }
 * 
 * PRIVACY & DEMO NOTICE:
 * All records strictly use synthetic/fictional agency and MP references per non-negotiable policy.
 */

export const KNOWN_FLAGS = {
  COST_OUTLIER: 'cost_outlier',
  POSSIBLE_DUPLICATE: 'possible_duplicate',
  DELAYED: 'delayed',
  FUND_MISMATCH: 'fund_mismatch',
};

export const FLAG_METADATA = {
  cost_outlier: {
    key: 'cost_outlier',
    label: 'Cost Outlier',
    shortDesc: 'Disproportionate cost estimate / rate deviation vs benchmarks',
    badgeClass: 'bg-red-50 text-red-700 dark:bg-red-950/70 dark:text-red-300 border-red-200 dark:border-red-800',
    iconName: 'TrendingUp',
    severity: 'high',
    color: '#EF4444',
  },
  possible_duplicate: {
    key: 'possible_duplicate',
    label: 'Possible Duplicate',
    shortDesc: 'Geospatial or semantic overlap with another sanctioned work',
    badgeClass: 'bg-purple-50 text-purple-700 dark:bg-purple-950/70 dark:text-purple-300 border-purple-200 dark:border-purple-800',
    iconName: 'Copy',
    severity: 'high',
    color: '#8B5CF6',
  },
  delayed: {
    key: 'delayed',
    label: 'Delayed',
    shortDesc: 'Inactivity or execution progress past target completion',
    badgeClass: 'bg-amber-50 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    iconName: 'Clock',
    severity: 'medium',
    color: '#F59E0B',
  },
  fund_mismatch: {
    key: 'fund_mismatch',
    label: 'Fund Mismatch',
    shortDesc: 'Disbursement pacing inconsistent with physical milestones',
    badgeClass: 'bg-rose-50 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300 border-rose-200 dark:border-rose-800',
    iconName: 'AlertTriangle',
    severity: 'high',
    color: '#E11D48',
  },
};

/**
 * Pure contract-compliant mock records covering all risk tiers and flag permutations.
 */
export const MOCK_RISK_RECORDS = [
  {
    work_id: "WORK-001",
    state: "Uttar Pradesh",
    category: "Road Development",
    ida: "IDA-001",
    risk_score: 82,
    flags: [
      "cost_outlier",
      "delayed"
    ],
    explanation: "The estimated project cost is significantly higher than similar works, and the project has exceeded its expected completion timeline."
  },
  {
    work_id: "WORK-002",
    state: "Uttar Pradesh",
    category: "Drinking Water & Sanitation",
    ida: "IDA-UP-004",
    risk_score: 94,
    flags: [
      "cost_outlier",
      "fund_mismatch"
    ],
    explanation: "Unit cost per filtration unit exceeds district standard Schedule of Rates by +51.5%, and 85% of total budget was disbursed in 9 days before foundation geo-inspection."
  },
  {
    work_id: "WORK-003",
    state: "Uttar Pradesh",
    category: "Road Development",
    ida: "IDA-UP-014",
    risk_score: 91,
    flags: [
      "possible_duplicate",
      "delayed"
    ],
    explanation: "High geospatial proximity (98.2% polygon overlap, 28m radius) with an existing State PWD scheme, and milestone reporting has halted for 140 days."
  },
  {
    work_id: "WORK-004",
    state: "Bihar",
    category: "Education & Skill Development",
    ida: "IDA-BR-015",
    risk_score: 88,
    flags: [
      "delayed",
      "fund_mismatch"
    ],
    explanation: "Project sanctioned 18 months ago with 30% mobilization advance disbursed; zero physical milestone logs uploaded for 312 consecutive days."
  },
  {
    work_id: "WORK-005",
    state: "Maharashtra",
    category: "Renewable Energy & Lighting",
    ida: "IDA-MH-008",
    risk_score: 76,
    flags: [
      "cost_outlier",
      "fund_mismatch"
    ],
    explanation: "Tender fragmented into 10 sub-vouchers near statutory bidding thresholds with frontloaded payment release ahead of physical equipment installation."
  },
  {
    work_id: "WORK-006",
    state: "Rajasthan",
    category: "Public Health & Sanitation",
    ida: "IDA-RJ-002",
    risk_score: 72,
    flags: [
      "cost_outlier"
    ],
    explanation: "Invoice line items include recurring consumables and non-capital expenses which exceed standard asset creation guidelines."
  },
  {
    work_id: "WORK-007",
    state: "West Bengal",
    category: "Drinking Water & Sanitation",
    ida: "IDA-WB-007",
    risk_score: 98,
    flags: [
      "cost_outlier",
      "possible_duplicate",
      "delayed",
      "fund_mismatch"
    ],
    explanation: "Multi-anomaly trigger: 100% fund disbursement with zero physical progress verification, 54% unit cost inflation above SOR, and duplicate coordinates matching a completed 2024 work."
  },
  {
    work_id: "WORK-008",
    state: "Bihar",
    category: "Public Health & Sanitation",
    ida: "IDA-BR-019",
    risk_score: 95,
    flags: [
      "cost_outlier",
      "possible_duplicate",
      "delayed"
    ],
    explanation: "Severe equipment cost deviation (+62%), redundant equipment line items overlapping with district hospital allocations, and prolonged 18-month execution stall."
  },
  {
    work_id: "WORK-009",
    state: "Karnataka",
    category: "Community Infrastructure & Halls",
    ida: "IDA-KA-011",
    risk_score: 65,
    flags: [
      "possible_duplicate"
    ],
    explanation: "GPS geofence polygon overlaps 88% with a municipal community center sanctioned in the adjacent ward boundary."
  },
  {
    work_id: "WORK-010",
    state: "Tamil Nadu",
    category: "Education & Skill Development",
    ida: "IDA-TN-005",
    risk_score: 58,
    flags: [
      "delayed"
    ],
    explanation: "Civil work execution has fallen 4 months behind the sanctioned milestone calendar due to delayed site handover."
  },
  {
    work_id: "WORK-011",
    state: "Madhya Pradesh",
    category: "Road Development",
    ida: "IDA-MP-014",
    risk_score: 62,
    flags: [
      "fund_mismatch"
    ],
    explanation: "Installment release pace does not align with structural foundation inspections; second tranche disbursed prior to first-stage geo-tag audit."
  },
  {
    work_id: "WORK-012",
    state: "Gujarat",
    category: "Drinking Water & Sanitation",
    ida: "IDA-GJ-003",
    risk_score: 48,
    flags: [
      "delayed"
    ],
    explanation: "Minor timeline slippage of 45 days recorded due to seasonal monsoon waterlogging at the pipeline trenching site."
  },
  {
    work_id: "WORK-013",
    state: "Uttar Pradesh",
    category: "Education & Skill Development",
    ida: "IDA-UP-001",
    risk_score: 18,
    flags: [],
    explanation: "All milestone disbursements, schedule benchmarks, and geo-tagged verification records are within normal baseline thresholds."
  },
  {
    work_id: "WORK-014",
    state: "Uttar Pradesh",
    category: "Public Health & Sanitation",
    ida: "IDA-UP-002",
    risk_score: 8,
    flags: [],
    explanation: "Work completed 100% on schedule with fully reconciled utilization certificates and verified before/after geotagged asset photos."
  },
  {
    work_id: "WORK-015",
    state: "Maharashtra",
    category: "Community Infrastructure & Halls",
    ida: "IDA-MH-012",
    risk_score: 22,
    flags: [],
    explanation: "Physical inspection verified on-site with normal fund pacing and no pricing deviations against Schedule of Rates."
  },
  {
    work_id: "WORK-016",
    state: "Punjab",
    category: "Renewable Energy & Lighting",
    ida: "IDA-PB-009",
    risk_score: 12,
    flags: [],
    explanation: "Standard procurement process executed via competitive e-tender with zero timeline or financial variance."
  },
  {
    work_id: "WORK-017",
    state: "Odisha",
    category: "Road Development",
    ida: "IDA-OD-006",
    risk_score: 84,
    flags: [
      "cost_outlier",
      "fund_mismatch"
    ],
    explanation: "Culvert construction rates priced 41% higher than state highway norms, with 90% funds drawn while culvert wing-walls remain unbuilt."
  },
  {
    work_id: "WORK-018",
    state: "Assam",
    category: "Drinking Water & Sanitation",
    ida: "IDA-AS-004",
    risk_score: 79,
    flags: [
      "possible_duplicate",
      "delayed"
    ],
    explanation: "Solar tube well coordinates match existing Jal Jeevan Mission borehole within 15 meters; work stalled pending field demarcation."
  }
];

/**
 * Validate that an object adheres strictly to the Risk Score JSON contract
 * @param {object} item 
 * @returns {{ isValid: boolean, errors: string[] }}
 */
export function validateRiskContract(item) {
  const errors = [];
  if (!item || typeof item !== 'object') {
    return { isValid: false, errors: ['Item must be a valid JSON object'] };
  }

  if (!item.work_id || typeof item.work_id !== 'string') {
    errors.push('Missing or invalid "work_id" (must be a non-empty string)');
  }
  if (!item.state || typeof item.state !== 'string') {
    errors.push('Missing or invalid "state" (must be a string)');
  }
  if (!item.category || typeof item.category !== 'string') {
    errors.push('Missing or invalid "category" (must be a string)');
  }
  if (!item.ida || typeof item.ida !== 'string') {
    errors.push('Missing or invalid "ida" (must be a string)');
  }
  if (typeof item.risk_score !== 'number' || item.risk_score < 0 || item.risk_score > 100) {
    errors.push('Missing or invalid "risk_score" (must be a number between 0 and 100)');
  }
  if (!Array.isArray(item.flags)) {
    errors.push('Missing or invalid "flags" (must be an array of strings)');
  } else {
    const validFlags = Object.values(KNOWN_FLAGS);
    item.flags.forEach((f, idx) => {
      if (typeof f !== 'string') {
        errors.push(`Flag at index ${idx} must be a string`);
      } else if (!validFlags.includes(f)) {
        errors.push(`Unknown flag "${f}" at index ${idx}. Expected one of: ${validFlags.join(', ')}`);
      }
    });
  }
  if (!item.explanation || typeof item.explanation !== 'string') {
    errors.push('Missing or invalid "explanation" (must be a non-empty human-readable string)');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Determine the risk tier based on numerical score (0-100)
 * Low: 0-39, Medium: 40-70, High: 71-100
 * @param {number} score 
 * @returns {'low' | 'medium' | 'high'}
 */
export function getRiskTier(score) {
  if (typeof score !== 'number' || isNaN(score)) return 'low';
  if (score >= 71) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

/**
 * Get comprehensive styling and badge metadata for a risk tier
 * @param {number|'low'|'medium'|'high'} tierOrScore 
 */
export function getRiskTierMeta(tierOrScore) {
  const tier = typeof tierOrScore === 'number' ? getRiskTier(tierOrScore) : (tierOrScore || 'low').toLowerCase();

  switch (tier) {
    case 'high':
    case 'critical':
      return {
        tier: 'high',
        label: 'High Risk',
        badgeBg: 'bg-red-50 text-red-700 dark:bg-red-950/80 dark:text-red-300 border border-red-200 dark:border-red-800',
        badgeColor: 'bg-red-600 text-white',
        borderClass: 'border-red-300 dark:border-red-800/80',
        bgClass: 'bg-red-50/30 dark:bg-red-950/20',
        dotColor: 'bg-red-500',
        barColor: '#EF4444',
        textColor: 'text-red-600 dark:text-red-400',
        glowClass: 'shadow-sm shadow-red-500/20',
        gradient: 'from-red-500 to-rose-600',
        thresholdLabel: 'Score 71 - 100',
        actionLabel: 'Immediate Vigilance Triage Required',
      };
    case 'medium':
    case 'moderate':
      return {
        tier: 'medium',
        label: 'Moderate Risk',
        badgeBg: 'bg-amber-50 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-200 dark:border-amber-800',
        badgeColor: 'bg-amber-500 text-white',
        borderClass: 'border-amber-300 dark:border-amber-800/80',
        bgClass: 'bg-amber-50/30 dark:bg-amber-950/20',
        dotColor: 'bg-amber-500',
        barColor: '#F59E0B',
        textColor: 'text-amber-600 dark:text-amber-400',
        glowClass: 'shadow-sm shadow-amber-500/20',
        gradient: 'from-amber-500 to-orange-500',
        thresholdLabel: 'Score 40 - 70',
        actionLabel: 'Clarification / Monitoring Recommended',
      };
    case 'low':
    case 'compliant':
    default:
      return {
        tier: 'low',
        label: 'Low Risk / Compliant',
        badgeBg: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800',
        badgeColor: 'bg-emerald-600 text-white',
        borderClass: 'border-emerald-200 dark:border-emerald-800/60',
        bgClass: 'bg-emerald-50/20 dark:bg-emerald-950/10',
        dotColor: 'bg-emerald-500',
        barColor: '#10B981',
        textColor: 'text-emerald-600 dark:text-emerald-400',
        glowClass: 'shadow-sm shadow-emerald-500/20',
        gradient: 'from-emerald-500 to-teal-600',
        thresholdLabel: 'Score 0 - 39',
        actionLabel: 'Standard Pacing & Compliant',
      };
  }
}
