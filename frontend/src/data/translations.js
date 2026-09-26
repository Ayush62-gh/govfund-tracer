/**
 * Bilingual Translations Dictionary (English / Hindi)
 * Supports all navigation, dashboards, analytics, alerts, and system controls.
 */
export const translations = {
  en: {
    // Branding & Header
    appTitle: "MPLADS e-Samiksha AI",
    govOrg: "Ministry of Statistics & Programme Implementation (MoSPI)",
    govSub: "Government of India",
    tagline: "AI-Powered Scheme Monitoring, Anomaly Detection & Predictive Analytics",
    
    // Roles
    role_mp: "Member of Parliament (Lok Sabha)",
    role_state: "State Nodal Authority (SNA)",
    role_district: "District Authority / DM",
    role_ministry: "Ministry / MoSPI Apex Officer",
    role_admin: "System Administrator",

    // Navigation
    nav_dashboard: "Executive Dashboard",
    nav_alerts: "Alerts & Anomaly Center",
    nav_financial: "Financial & Fund Analytics",
    nav_tracker: "Work Progress Tracker",
    nav_predictive: "Predictive & ML Insights",
    nav_reports: "Reports & Compliance",
    nav_admin: "Admin Control Panel",

    // Common Actions
    switchRole: "Switch Role",
    logout: "Logout",
    search: "Search works, schemes, or districts...",
    filter: "Filter",
    export: "Export Dossier",
    exportCsv: "Export CSV",
    exportPdf: "Export PDF",
    apply: "Apply",
    reset: "Reset",
    close: "Close",
    viewDetails: "View Details",
    takeAction: "Take Action",
    markReviewed: "Mark Reviewed",
    escalate: "Escalate to Vigilance",
    requestClarification: "Request Clarification",
    resolveAlert: "Resolve & Close",
    refresh: "Live Sync",
    simulateAI: "Run AI Diagnostics",
    status: "Status",
    date: "Date",
    amount: "Amount (₹)",
    riskScore: "Risk Score",
    category: "Category",
    district: "District",
    agency: "Implementing Agency",

    // Risk levels
    risk_high: "High Risk",
    risk_medium: "Moderate Risk",
    risk_low: "Low Risk",
    risk_compliant: "Compliant",

    // KPI Cards
    kpi_sanctioned: "Total Sanctioned",
    kpi_utilized: "Total Utilized",
    kpi_unutilized: "Idle / Unspent Balance",
    kpi_pending: "Disbursement Pending",
    kpi_utilizationRate: "Utilization Rate",
    kpi_flaggedCount: "Flagged High Anomalies",
    kpi_delayLikelihood: "Works at Delay Risk",

    // Dashboard sections
    riskOverview: "Risk Overview & Anomalies",
    fundFlowTrend: "Sanctioned vs Expenditure Trajectory",
    geographicHeatmap: "Geographic Utilization & Anomaly Heatmap",
    topAlertsTitle: "Top Priority Alerts (Requires Immediate Action)",
    viewAllAlerts: "View All Alerts",
    schemeFunnel: "Sanction-to-Expenditure Pipeline",

    // Anomaly Categories
    anom_cost_overrun: "Cost Overrun & Escalation",
    anom_duplicate: "Duplicate Work / Geo Match",
    anom_delayed: "Execution Delay / Inactivity",
    anom_payment: "Unusual Payment Pattern",
    anom_deviation: "Deviation from MPLADS Norms",

    // Work Tracker
    stages_sanctioned: "Sanctioned",
    stages_inprogress: "In Progress",
    stages_delayed: "Delayed / At Risk",
    stages_completed: "Physically Completed",
    photoVerification: "Asset Geotag & Photo Verification",
    beforePhoto: "Before Inception",
    afterPhoto: "Current Site Status",

    // Predictive & Scorecards
    utilizationForecast: "ML Utilization Forecast (Next 3 Quarters)",
    agencyScorecard: "Implementing Agency Compliance Scorecard",
    duplicateDetection: "AI Duplicate Work Detector",
    similarityScore: "Similarity Score",
    tamperCheck: "AI Image Tamper Verification",

    // Status strings
    resolved: "Resolved",
    inReview: "Under Review",
    escalated: "Escalated to Vigilance",
    active: "Active",
  },
  hi: {
    // Branding & Header
    appTitle: "सांसद निधि ई-समीक्षा AI",
    govOrg: "सांख्यिकी और कार्यक्रम कार्यान्वयन मंत्रालय (MoSPI)",
    govSub: "भारत सरकार",
    tagline: "एआई-संचालित योजना निगरानी, विसंगति पहचान और भविष्य कहनेवाला विश्लेषण",

    // Roles
    role_mp: "संसद सदस्य (लोकसभा)",
    role_state: "राज्य नोडल प्राधिकरण (SNA)",
    role_district: "जिला प्राधिकरण / जिलाधिकारी",
    role_ministry: "मंत्रालय / MoSPI शीर्ष अधिकारी",
    role_admin: "सिस्टम व्यवस्थापक",

    // Navigation
    nav_dashboard: "कार्यकारी डैशबोर्ड",
    nav_alerts: "अलर्ट और विसंगति केंद्र",
    nav_financial: "वित्तीय एवं निधि विश्लेषण",
    nav_tracker: "कार्य प्रगति ट्रैकर",
    nav_predictive: "पूर्वानुमान एवं एआई अंतर्दृष्टि",
    nav_reports: "रिपोर्ट और अनुपालन",
    nav_admin: "व्यवस्थापक नियंत्रण कक्ष",

    // Common Actions
    switchRole: "भूमिका बदलें",
    logout: "लॉग आउट",
    search: "कार्य, योजना या जिला खोजें...",
    filter: "फ़िल्टर",
    export: "डोज़ियर निर्यात करें",
    exportCsv: "CSV निर्यात",
    exportPdf: "PDF निर्यात",
    apply: "लागू करें",
    reset: "रीसेट करें",
    close: "बंद करें",
    viewDetails: "विवरण देखें",
    takeAction: "कार्रवाई करें",
    markReviewed: "समीक्षित चिह्नित करें",
    escalate: "सतर्कता को अग्रेषित करें",
    requestClarification: "स्पष्टीकरण का अनुरोध करें",
    resolveAlert: "समाधान करें एवं बंद करें",
    refresh: "लाइव सिंक",
    simulateAI: "एआई निदान चलाएं",
    status: "स्थिति",
    date: "दिनांक",
    amount: "राशि (₹)",
    riskScore: "जोखिम स्कोर",
    category: "श्रेणी",
    district: "जिला",
    agency: "कार्यान्वयन एजेंसी",

    // Risk levels
    risk_high: "उच्च जोखिम",
    risk_medium: "मध्यम जोखिम",
    risk_low: "कम जोखिम",
    risk_compliant: "अनुपालन",

    // KPI Cards
    kpi_sanctioned: "कुल स्वीकृत निधि",
    kpi_utilized: "कुल उपयोग की गई",
    kpi_unutilized: "अप्रयुक्त / निष्क्रिय शेष",
    kpi_pending: "वितरण लंबित",
    kpi_utilizationRate: "उपयोगिता दर",
    kpi_flaggedCount: "चिह्नित गंभीर विसंगतियां",
    kpi_delayLikelihood: "विलंब जोखिम वाले कार्य",

    // Dashboard sections
    riskOverview: "जोखिम अवलोकन एवं विसंगतियां",
    fundFlowTrend: "स्वीकृत बनाम व्यय प्रक्षेपवक्र",
    geographicHeatmap: "भौगोलिक उपयोग एवं विसंगति हीटमैप",
    topAlertsTitle: "शीर्ष प्राथमिकता वाले अलर्ट (तत्काल कार्रवाई आवश्यक)",
    viewAllAlerts: "सभी अलर्ट देखें",
    schemeFunnel: "स्वीकृति से व्यय पाइपलाइन",

    // Anomaly Categories
    anom_cost_overrun: "लागत वृद्धि एवं अतिव्यय",
    anom_duplicate: "समान / दोहराव कार्य मिलान",
    anom_delayed: "निष्पादन में देरी / निष्क्रियता",
    anom_payment: "असामान्य भुगतान पैटर्न",
    anom_deviation: "सांसद निधि मानदंडों से विचलन",

    // Work Tracker
    stages_sanctioned: "स्वीकृत",
    stages_inprogress: "प्रगति पर",
    stages_delayed: "विलंबित / जोखिम",
    stages_completed: "भौतिक रूप से पूर्ण",
    photoVerification: "परिसंपत्ति जियोटैग एवं फोटो सत्यापन",
    beforePhoto: "कार्य प्रारंभ से पूर्व",
    afterPhoto: "वर्तमान साइट स्थिति",

    // Predictive & Scorecards
    utilizationForecast: "एमएल उपयोग पूर्वानुमान (अगली 3 तिमाही)",
    agencyScorecard: "कार्यान्वयन एजेंसी अनुपालन स्कोरकार्ड",
    duplicateDetection: "एआई दोहराव कार्य डिटेक्टर",
    similarityScore: "समानता स्कोर",
    tamperCheck: "एआई छवि छेड़छाड़ सत्यापन",

    // Status strings
    resolved: "समाधान हुआ",
    inReview: "समीक्षाधीन",
    escalated: "सतर्कता को भेजा गया",
    active: "सक्रिय",
  }
};
