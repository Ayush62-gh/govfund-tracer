import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { MOCK_TRENDS } from '../../data/mockData';

/**
 * PaymentTimelineChart Component
 * Trajectory of Sanctioned funds vs Actual Expenditure, including ML future forecasts.
 */
export const PaymentTimelineChart = () => {
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white p-3 rounded-lg text-xs shadow-xl border border-slate-700">
          <div className="font-bold text-sm mb-1">{label}</div>
          <div className="text-blue-300 font-mono">
            Sanctioned: ₹{data.sanctioned} Cr
          </div>
          {data.expenditure !== null && (
            <div className="text-emerald-400 font-mono">
              Expenditure: ₹{data.expenditure} Cr
            </div>
          )}
          {data.isForecast && (
            <div className="text-purple-300 font-mono">
              ML Projected Exp: ₹{data.projectedExp} Cr
            </div>
          )}
          <div className="text-red-400 text-[11px] mt-1">
            Anomalies Detected: {data.riskFlagged}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={MOCK_TRENDS}
          margin={{ top: 10, right: 20, left: 10, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.15} />
          <XAxis dataKey="quarter" tick={{ fontSize: 11, fill: '#64748B' }} />
          <YAxis
            tickFormatter={(v) => `₹${v}Cr`}
            tick={{ fontSize: 11, fill: '#64748B' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: '11px' }} />

          <Area
            type="monotone"
            dataKey="sanctioned"
            name="Sanctioned Cumulative"
            fill="#E8F1FC"
            stroke="#1E4E8C"
            strokeWidth={2}
          />
          <Line
            type="monotone"
            dataKey="expenditure"
            name="Actual Expended"
            stroke="#10B981"
            strokeWidth={3}
            dot={{ r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="projectedExp"
            name="ML Projected Exp (Forecast)"
            stroke="#9333EA"
            strokeDasharray="5 5"
            strokeWidth={2.5}
            dot={{ r: 4 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PaymentTimelineChart;
