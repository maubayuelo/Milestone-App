import React, { useState } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { 
  TrendingUp, 
  Clock, 
  ShieldCheck, 
  AlertCircle, 
  Sparkles,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

// Weekly Freelance vs Retail Shift Data
export const WEEKLY_CAPACITY_DATA = [
  { day: 'Mon', freelance: 4.2, shift: 0, buffer: 2.5, totalAvailable: 6.7 },
  { day: 'Tue', freelance: 3.5, shift: 5.5, buffer: 1.0, totalAvailable: 4.5 },
  { day: 'Wed', freelance: 5.0, shift: 0, buffer: 3.0, totalAvailable: 8.0 },
  { day: 'Thu', freelance: 2.5, shift: 6.0, buffer: 1.0, totalAvailable: 3.5 },
  { day: 'Fri', freelance: 4.3, shift: 0, buffer: 1.5, totalAvailable: 5.8, isToday: true },
  { day: 'Sat', freelance: 6.0, shift: 0, buffer: 4.0, totalAvailable: 10.0 },
  { day: 'Sun', freelance: 2.0, shift: 6.75, buffer: 0.8, totalAvailable: 2.8 },
];

export const ENERGY_DISTRIBUTION = [
  { name: 'Deep Focus', value: 65, color: '#2563EB' },
  { name: 'Medium Load', value: 25, color: '#6366F1' },
  { name: 'Low Energy / Admin', value: 10, color: '#F59E0B' },
];

// Custom Tooltip styled like bento.webp with badge
const CustomAreaTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const freelanceHours = payload.find((p: any) => p.dataKey === 'freelance')?.value || 0;
    const shiftHours = payload.find((p: any) => p.dataKey === 'shift')?.value || 0;
    
    return (
      <div className="bg-slate-900 text-white p-2.5 px-3 rounded-xl shadow-xl text-xs space-y-1 select-none border border-slate-700">
        <div className="flex items-center justify-between gap-3 border-b border-slate-700 pb-1">
          <span className="font-bold text-white">{label}</span>
          {shiftHours > 0 ? (
            <span className="text-[10px] bg-amber-500/20 text-amber-300 font-semibold px-1.5 py-0.5 rounded">
              Retail Shift Day
            </span>
          ) : (
            <span className="text-[10px] bg-blue-500/20 text-blue-300 font-semibold px-1.5 py-0.5 rounded">
              Deep Work Day
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 pt-0.5">
          <span className="w-2 h-2 rounded-full bg-[#2563EB]" />
          <span className="text-slate-300">Freelance:</span>
          <span className="font-bold font-mono text-white">{freelanceHours}h</span>
        </div>
        {shiftHours > 0 && (
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#F0523C]" />
            <span className="text-slate-300">Retail Shift:</span>
            <span className="font-bold font-mono text-white">{shiftHours}h</span>
          </div>
        )}
      </div>
    );
  }
  return null;
};

// 1. Capacity & Workload Area Chart Card (Bento Span 2)
export const WorkloadCurveCard: React.FC<{ overageMinutes: number }> = ({ overageMinutes }) => {
  const [metricFilter, setMetricFilter] = useState<'all' | 'freelance'>('all');

  return (
    <div 
      id="bento-workload-curve"
      className="bg-white rounded-3xl border border-slate-100 p-5 sm:p-6 shadow-[0_2px_14px_rgba(0,0,0,0.03)] flex flex-col justify-between"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              Weekly Capacity & Shift Load
            </h3>
            <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
              UX Analytics
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Freelance focus hours safely buffered against Westport Provisions retail shifts
          </p>
        </div>

        {/* Filter Switcher */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl self-start sm:self-auto text-xs">
          <button
            onClick={() => setMetricFilter('all')}
            className={`px-3 py-1 rounded-lg font-semibold transition cursor-pointer ${
              metricFilter === 'all'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            All Hours
          </button>
          <button
            onClick={() => setMetricFilter('freelance')}
            className={`px-3 py-1 rounded-lg font-semibold transition cursor-pointer ${
              metricFilter === 'freelance'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Freelance Only
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4 pt-1">
        <div className="p-3 rounded-2xl bg-[#F8FAFC] border border-slate-100">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Total Freelance
          </div>
          <div className="text-xl font-bold text-slate-900 mt-0.5 flex items-baseline gap-1.5">
            <span>27.7h</span>
            <span className="text-xs font-semibold text-emerald-600 flex items-center">
              <ArrowUpRight className="w-3.5 h-3.5" /> +14%
            </span>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-[#F8FAFC] border border-slate-100">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Retail Commitments
          </div>
          <div className="text-xl font-bold text-slate-900 mt-0.5 flex items-baseline gap-1.5">
            <span>18.2h</span>
            <span className="text-xs font-semibold text-slate-500">
              3 shifts
            </span>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-[#F8FAFC] border border-slate-100 col-span-2 sm:col-span-1">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Today Status
          </div>
          <div className="text-xl font-bold text-slate-900 mt-0.5 flex items-baseline gap-1.5">
            {overageMinutes > 0 ? (
              <span className="text-[#F0523C] text-base font-bold">
                +{overageMinutes}m Overage
              </span>
            ) : (
              <span className="text-[#16A34A] text-base font-bold">
                Safe Buffer
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Area Chart Container */}
      <div className="h-56 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={WEEKLY_CAPACITY_DATA} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
            <defs>
              <linearGradient id="colorFreelance" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563EB" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="colorShift" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#F0523C" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#F0523C" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="day" 
              tickLine={false} 
              axisLine={{ stroke: '#E2E8F0' }} 
              tick={{ fill: '#64748B', fontSize: 12 }} 
            />
            <YAxis 
              tickLine={false} 
              axisLine={false} 
              tick={{ fill: '#94A3B8', fontSize: 11 }}
              unit="h" 
            />
            <Tooltip content={<CustomAreaTooltip />} />
            
            <Area
              type="monotone"
              dataKey="freelance"
              stroke="#2563EB"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorFreelance)"
              activeDot={{ r: 6, fill: '#2563EB', stroke: '#FFFFFF', strokeWidth: 2 }}
            />
            
            {metricFilter === 'all' && (
              <Area
                type="monotone"
                dataKey="shift"
                stroke="#F0523C"
                strokeWidth={2.5}
                strokeDasharray="4 4"
                fillOpacity={1}
                fill="url(#colorShift)"
                activeDot={{ r: 5, fill: '#F0523C', stroke: '#FFFFFF', strokeWidth: 2 }}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// 2. Radial Shift Buffer Health Gauge Card (Bento Span 1)
export const BufferGaugeCard: React.FC<{
  overageMinutes: number;
  onAutoRebalance: () => void;
}> = ({ overageMinutes, onAutoRebalance }) => {
  const percentage = overageMinutes > 0 ? 75 : 94;
  const strokeDashoffset = 283 - (283 * percentage) / 100;

  return (
    <div 
      id="bento-radial-gauge"
      className="bg-white rounded-3xl border border-slate-100 p-5 sm:p-6 shadow-[0_2px_14px_rgba(0,0,0,0.03)] flex flex-col justify-between items-center text-center"
    >
      <div className="w-full flex items-center justify-between text-xs text-slate-500 mb-2">
        <span className="font-bold uppercase tracking-wider text-slate-400 text-[10px]">
          Buffer Safety
        </span>
        <span className="inline-flex items-center gap-1 font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
          <ShieldCheck className="w-3 h-3" /> Retail Aware
        </span>
      </div>

      {/* SVG Radial Gauge */}
      <div className="relative w-36 h-36 my-2 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="transparent"
            stroke="#F1F5F9"
            strokeWidth="8"
          />
          {/* Active progress ring */}
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="transparent"
            stroke={overageMinutes > 0 ? '#F59E0B' : '#2563EB'}
            strokeWidth="8"
            strokeDasharray="264"
            strokeDashoffset={264 - (264 * percentage) / 100}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {percentage}%
          </span>
          <span className="text-[10px] font-bold text-slate-400 uppercase">
            Buffer Safe
          </span>
        </div>
      </div>

      {/* Description & Action */}
      <div className="w-full mt-2">
        <p className="text-xs text-slate-600 leading-relaxed">
          {overageMinutes > 0 ? (
            <span className="text-slate-800">
              <strong className="text-[#F0523C]">{overageMinutes} min overage</strong> impairs Friday downtime before Sunday shift.
            </span>
          ) : (
            <span className="text-slate-800">
              Schedule balanced. Rest buffer before Sunday retail shift fully preserved.
            </span>
          )}
        </p>

        {overageMinutes > 0 && (
          <button
            onClick={onAutoRebalance}
            className="mt-3 w-full py-2 px-3 rounded-xl bg-[#2563EB] hover:bg-blue-700 active:scale-98 text-white font-semibold text-xs shadow-xs transition cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Rebalance to 100% Safe</span>
          </button>
        )}
      </div>
    </div>
  );
};

// 3. Weekly Hourly Distribution Bar Chart (Bento Span 2)
export const WorkloadBarCard: React.FC = () => {
  return (
    <div 
      id="bento-workload-bars"
      className="bg-white rounded-3xl border border-slate-100 p-5 sm:p-6 shadow-[0_2px_14px_rgba(0,0,0,0.03)] flex flex-col justify-between"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 tracking-tight">
            Daily Hours Breakdown
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Visualizing freelance dev vs physical retail shift hours
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-600">
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#2563EB]" /> Freelance
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#F0523C]" /> Retail Shift
          </span>
        </div>
      </div>

      <div className="h-48 w-full pt-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={WEEKLY_CAPACITY_DATA} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
            <XAxis 
              dataKey="day" 
              tickLine={false} 
              axisLine={{ stroke: '#E2E8F0' }} 
              tick={{ fill: '#64748B', fontSize: 12 }} 
            />
            <YAxis 
              tickLine={false} 
              axisLine={false} 
              tick={{ fill: '#94A3B8', fontSize: 11 }}
              unit="h" 
            />
            <Tooltip content={<CustomAreaTooltip />} />
            <Bar dataKey="freelance" fill="#2563EB" radius={[4, 4, 0, 0]} maxBarSize={28} />
            <Bar dataKey="shift" fill="#F0523C" radius={[4, 4, 0, 0]} maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// 4. Energy Load Donut Chart Card (Bento Span 1)
export const EnergyDonutCard: React.FC = () => {
  return (
    <div 
      id="bento-energy-donut"
      className="bg-white rounded-3xl border border-slate-100 p-5 sm:p-6 shadow-[0_2px_14px_rgba(0,0,0,0.03)] flex flex-col justify-between"
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-base font-bold text-slate-900 tracking-tight">
          Energy Allocation
        </h3>
        <span className="text-[11px] font-bold text-slate-400 uppercase">
          Fatigue Safety
        </span>
      </div>

      <div className="relative h-40 w-full flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={ENERGY_DISTRIBUTION}
              innerRadius={45}
              outerRadius={65}
              paddingAngle={4}
              dataKey="value"
            >
              {ENERGY_DISTRIBUTION.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: any) => [`${value}% of total effort`, 'Energy Demand']}
              contentStyle={{ backgroundColor: '#0F172A', borderRadius: '8px', color: '#FFF', fontSize: '11px' }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-lg font-bold text-slate-800">65%</span>
          <span className="text-[9px] font-semibold text-slate-400 uppercase">Deep Work</span>
        </div>
      </div>

      <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
        {ENERGY_DISTRIBUTION.map((item) => (
          <div key={item.name} className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
              {item.name}
            </span>
            <span className="font-mono font-semibold text-slate-800">{item.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};
