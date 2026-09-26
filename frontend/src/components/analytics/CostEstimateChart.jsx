import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { MOCK_CATEGORY_COSTS } from '../../data/mockData';

/**
 * CostEstimateChart Component
 * Category-wise comparison of Estimated vs Actual Expenditure.
 */
export const CostEstimateChart = () => {
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white p-3 rounded-lg text-xs shadow-xl border border-slate-700">
          <div className="font-bold text-sm mb-1">{label}</div>
          <div className="text-blue-300">Sanctioned Estimate: ₹{data.estimated} Cr</div>
          <div className="text-emerald-300">Actual Disbursed: ₹{data.actual} Cr</div>
          <div className="mt-1 text-red-400 font-mono font-bold">
            Cost Variance: {data.variance}
          </div>
          <div className="text-slate-400 text-[10px] mt-0.5">
            Total Projects: {data.count?.toLocaleString()} • Flagged: {data.highRisk}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={MOCK_CATEGORY_COSTS}
          margin={{ top: 10, right: 10, left: 0, bottom: 25 }}
        >
          <XAxis
            dataKey="category"
            tick={{ fontSize: 10, fill: '#64748B' }}
            interval={0}
            angle={-15}
            textAnchor="end"
          />
          <YAxis
            tickFormatter={(v) => `₹${v}Cr`}
            tick={{ fontSize: 11, fill: '#64748B' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
          <Bar dataKey="estimated" name="Estimated Cost" fill="#1E4E8C" radius={[4, 4, 0, 0]} />
          <Bar dataKey="actual" name="Actual Expenditure" fill="#F59E0B" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CostEstimateChart;
