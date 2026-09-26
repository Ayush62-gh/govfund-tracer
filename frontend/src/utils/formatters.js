/**
 * Formatters for Indian Currency, Dates, Percentages, and Risk Scores
 */

/**
 * Format number to Indian Rupees representation (Cr / Lakh / K / ₹)
 * @param {number} amount - Amount in INR
 * @param {boolean} full - If true, formats with Indian comma system
 * @returns {string} Formatted string
 */
export function formatINR(amount, full = false) {
  if (amount === undefined || amount === null || isNaN(amount)) return "₹0";

  if (full) {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  }

  const abs = Math.abs(amount);
  if (abs >= 10000000) {
    // 1 Crore = 10,000,000
    return `₹${(amount / 10000000).toFixed(2)} Cr`;
  } else if (abs >= 100000) {
    // 1 Lakh = 100,000
    return `₹${(amount / 100000).toFixed(2)} Lakh`;
  } else if (abs >= 1000) {
    return `₹${(amount / 1000).toFixed(1)}k`;
  }
  return `₹${amount.toLocaleString("en-IN")}`;
}

/**
 * Format standard Indian number grouping
 * @param {number} num 
 * @returns {string}
 */
export function formatNumber(num) {
  if (num === undefined || num === null) return "0";
  return Number(num).toLocaleString("en-IN");
}

/**
 * Format date to standard Indian institutional format (DD Mon YYYY)
 * @param {string|Date} dateStr 
 * @returns {string}
 */
export function formatDate(dateStr) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Get risk color classes and labels
 * @param {string} level - 'high', 'medium', 'low', 'compliant'
 * @returns {object} Tailwind classes and metadata
 */
export function getRiskMeta(level) {
  switch (level?.toLowerCase()) {
    case "high":
    case "critical":
      return {
        label: "High Risk",
        badgeBg: "bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800",
        dotBg: "bg-red-500",
        glow: "shadow-glow-red",
        barColor: "#EF4444",
        textClass: "text-red-600 dark:text-red-400",
        cardBorder: "border-red-300 dark:border-red-800/80 bg-red-50/20",
      };
    case "medium":
    case "moderate":
      return {
        label: "Moderate Risk",
        badgeBg: "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800",
        dotBg: "bg-amber-500",
        glow: "shadow-glow-amber",
        barColor: "#F59E0B",
        textClass: "text-amber-600 dark:text-amber-400",
        cardBorder: "border-amber-300 dark:border-amber-800/80 bg-amber-50/20",
      };
    case "low":
    case "compliant":
    default:
      return {
        label: "Low Risk",
        badgeBg: "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
        dotBg: "bg-emerald-500",
        glow: "shadow-glow-green",
        barColor: "#10B981",
        textClass: "text-emerald-600 dark:text-emerald-400",
        cardBorder: "border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/10",
      };
  }
}

/**
 * Get category badge color and human-readable icon name
 * @param {string} categoryKey 
 */
export function getCategoryMeta(categoryKey) {
  const map = {
    anom_cost_overrun: { label: "Cost Overrun", color: "text-red-600 bg-red-50 border-red-200 dark:bg-red-950/50 dark:text-red-300" },
    anom_duplicate: { label: "Duplicate Match", color: "text-purple-600 bg-purple-50 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300" },
    anom_delayed: { label: "Severe Inactivity", color: "text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300" },
    anom_payment: { label: "Payment Pattern", color: "text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300" },
    anom_deviation: { label: "Norm Deviation", color: "text-rose-600 bg-rose-50 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300" },
  };
  return map[categoryKey] || { label: "General Anomaly", color: "text-slate-600 bg-slate-50 border-slate-200" };
}
