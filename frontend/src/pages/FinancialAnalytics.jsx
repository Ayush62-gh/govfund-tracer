import React from 'react';
import ChartCard from '../components/common/ChartCard';
import KpiCard from '../components/common/KpiCard';
import FundFunnelChart from '../components/dashboard/FundFunnelChart';
import CostEstimateChart from '../components/analytics/CostEstimateChart';
import PaymentTimelineChart from '../components/analytics/PaymentTimelineChart';
import IdleFundTracker from '../components/analytics/IdleFundTracker';
import { IndianRupee, TrendingUp, AlertTriangle, Clock, ArrowUpRight, BarChart3, MapPin } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { formatINR } from '../utils/formatters';

/**
 * FinancialAnalytics Page Component
 * Detailed fiscal analytics, cost estimates vs actuals, payment velocities, and idle fund tracking.
 * Scoped to user jurisdiction under RBAC policies.
 */
export const FinancialAnalytics = () => {
  const { roleKpis } = useData();
  const { currentUser } = useAuth();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded">
            {currentUser.jurisdiction}
          </span>
        </div>
        <h2 className="text-xl sm:text-2xl font-extrabold font-display text-slate-900 dark:text-white flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-blue-600" />
          <span>Fund Utilization & Financial Analytics</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Detailed breakdown of sanction velocity, cost deviations, disbursement anomalies, and idle balances
        </p>
      </div>

      {/* Primary Financial KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total Sanctioned"
          value={formatINR(roleKpis.totalSanctioned)}
          subtitle={`${currentUser.jurisdiction} allocation`}
          icon={<IndianRupee className="w-5 h-5 text-blue-600" />}
          variant="blue"
        />
        <KpiCard
          title="Total Expended"
          value={formatINR(roleKpis.totalUtilized)}
          subtitle={`Overall Utilization: ${roleKpis.utilizationRate}%`}
          progress={roleKpis.utilizationRate}
          icon={<TrendingUp className="w-5 h-5 text-emerald-600" />}
          variant="green"
        />
        <KpiCard
          title="Idle / Parking Funds"
          value={formatINR(roleKpis.unutilizedBalance)}
          subtitle="Unutilized balance in accounts"
          icon={<Clock className="w-5 h-5 text-amber-600" />}
          variant="amber"
          badge="Dormant"
        />
        <KpiCard
          title="UC Submission Rate"
          value={`${roleKpis.ucSubmissionRate}%`}
          subtitle="Audited utilization certificates"
          icon={<IndianRupee className="w-5 h-5 text-purple-600" />}
          variant="default"
          badge="Audit Verified"
        />
      </div>

      {/* Row 1: Funnel + Cost Overrun Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6">
          <ChartCard
            title="Sanction-to-Expenditure Pipeline"
            subtitle="Drop-off points from recommendation to audit certification"
          >
            <FundFunnelChart />
          </ChartCard>
        </div>

        <div className="lg:col-span-6">
          <ChartCard
            title="Estimated Cost vs Actual Expenditure by Category"
            subtitle="Comparing initial technical estimate with final billed cost (₹ Cr)"
            infoTooltip="High variance in Roads and Drinking water indicates frequent contractor escalation revisions"
          >
            <CostEstimateChart />
          </ChartCard>
        </div>
      </div>

      {/* Row 2: Payment Timeline Trajectory */}
      <ChartCard
        title="Payment Timeline & Quarterly Disbursement Velocity"
        subtitle="Historical quarterly trend with ML forward projections"
      >
        <PaymentTimelineChart />
      </ChartCard>

      {/* Row 3: Idle Fund Lapsation Tracker */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-gov">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 font-display mb-1">
          Fund Lapsation & Dormancy Matrix
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Tracking unspent balances past 12 and 24 months for automatic clawback or re-allocation notices.
        </p>
        <IdleFundTracker />
      </div>
    </div>
  );
};

export default FinancialAnalytics;
