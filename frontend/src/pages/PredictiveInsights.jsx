import React from 'react';
import ChartCard from '../components/common/ChartCard';
import PaymentTimelineChart from '../components/analytics/PaymentTimelineChart';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
} from 'recharts';
import { MOCK_BENCHMARKS, MOCK_AGENCY_SCORECARDS } from '../data/mockData';
import { Sparkles, TrendingUp, Award, AlertTriangle, ShieldCheck, CheckCircle2 } from 'lucide-react';

/**
 * PredictiveInsights Page Component
 * ML forecast trajectories, comparative benchmarking vs state/national averages, and agency compliance scorecards.
 */
export const PredictiveInsights = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold font-display text-slate-900 dark:text-white flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-purple-600" />
          <span>Predictive Insights & Benchmarking</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Machine learning forecasts, multi-dimensional peer benchmarking, and implementing agency compliance scorecards
        </p>
      </div>

      {/* AI Forward Forecast Banner */}
      <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/60 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-purple-900 dark:text-purple-300">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span>AI Predictive Synthesis (FY 2026-27 Outlook)</span>
          </div>
          <p className="text-xs text-purple-950/80 dark:text-purple-200 mt-1 max-w-3xl leading-relaxed">
            Based on current disbursement velocity and seasonal monsoonal trends, Varanasi is projected to reach <strong>93.4% fund utilization</strong> by Q3 FY 2026-27. Reallocating ₹4.8 Cr from delayed Jal Nigam tenders will accelerate target completion by 48 days.
          </p>
        </div>

        <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-purple-600 text-white shrink-0">
          94.6% Model Confidence
        </span>
      </div>

      {/* Trajectory Forecast Chart */}
      <ChartCard
        title="Predictive Fund Trajectory & Anomaly Projection (Next 3 Quarters)"
        subtitle="ARIMA Time-series model projection calibrated with Weibull Hazard delay models"
      >
        <PaymentTimelineChart />
      </ChartCard>

      {/* Radar Comparative Benchmarking + Bar Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Radar Chart */}
        <div className="lg:col-span-6">
          <ChartCard
            title="Multi-Dimensional Peer Benchmarking"
            subtitle="Constituency vs State Average vs National Average (Scale 0-100)"
          >
            <div className="w-full h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart outerRadius={90} data={MOCK_BENCHMARKS}>
                  <PolarGrid stroke="#64748B" opacity={0.2} />
                  <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10, fill: '#64748B' }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9 }} />
                  <Radar
                    name="This Constituency"
                    dataKey="constituency"
                    stroke="#FF671F"
                    fill="#FF671F"
                    fillOpacity={0.4}
                  />
                  <Radar
                    name="State Average"
                    dataKey="stateAvg"
                    stroke="#1E4E8C"
                    fill="#1E4E8C"
                    fillOpacity={0.25}
                  />
                  <Radar
                    name="National Benchmark"
                    dataKey="nationalAvg"
                    stroke="#10B981"
                    fill="#10B981"
                    fillOpacity={0.15}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>

        {/* Agency Compliance Scorecard */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-gov flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 font-display flex items-center gap-2">
                  <Award className="w-4 h-4 text-orange-500" />
                  <span>Implementing Agency Compliance Scorecards</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Ranked by execution speed, UC compliance & anomaly incidence
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {MOCK_AGENCY_SCORECARDS.map((item) => (
                <div
                  key={item.agency}
                  className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-slate-100 truncate">
                        {item.agency}
                      </span>
                      <span
                        className={`px-2 py-0.2 rounded font-bold font-mono text-[10px] ${
                          item.grade.startsWith('A')
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : item.grade.startsWith('B')
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                        }`}
                      >
                        Grade {item.grade}
                      </span>
                    </div>

                    <div className="mt-1 flex items-center gap-3 text-[11px] text-slate-500">
                      <span>{item.works} Works</span>
                      <span>•</span>
                      <span>Avg Delay: {item.avgDelayDays} days</span>
                      <span>•</span>
                      <span>UC Rate: {item.ucRate}%</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-lg font-bold font-mono text-slate-900 dark:text-slate-100">
                      {item.score}/100
                    </div>
                    <div className="text-[10px] text-slate-400">Compliance Index</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-right">
            <span className="text-[11px] text-slate-500">
              Evaluated under MoSPI Performance Rating Framework 2026
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PredictiveInsights;
