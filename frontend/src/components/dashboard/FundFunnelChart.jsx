import React from 'react';
import PropTypes from 'prop-types';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { MOCK_FUNNEL } from '../../data/mockData';
import { formatINR } from '../../utils/formatters';

/**
 * FundFunnelChart Component
 * Visualizes the sanction-to-expenditure pipeline and intermediate drops.
 */
export const FundFunnelChart = () => {
  const colors = ['#0A2540', '#1E4E8C', '#2563EB', '#F59E0B', '#10B981'];

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white p-3 rounded-lg text-xs shadow-xl border border-slate-700">
          <div className="font-bold">{data.stage}</div>
          <div className="mt-1 text-emerald-400 font-mono font-bold">
            Total: ₹{data.amount} Cr
          </div>
          <div className="text-slate-300 text-[11px]">
            Active Works: {data.count?.toLocaleString()}
          </div>
          {data.dropPct !== '0%' && (
            <div className="text-red-400 text-[11px] mt-1">
              Drop from prior: {data.dropPct}
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={MOCK_FUNNEL}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
        >
          <XAxis type="number" tickFormatter={(v) => `₹${v}Cr`} tick={{ fontSize: 11, fill: '#64748B' }} />
          <YAxis
            type="category"
            dataKey="stage"
            tick={{ fontSize: 11, fill: '#64748B', width: 140 }}
            width={160}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="amount" radius={[0, 6, 6, 0]}>
            {MOCK_FUNNEL.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default FundFunnelChart;
