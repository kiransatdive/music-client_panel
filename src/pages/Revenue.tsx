import { useEffect, useState } from 'react';
import axios from 'axios';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DollarSign, TrendingUp, Download, ArrowUpRight } from 'lucide-react';

interface RevenueData {
  month: string;
  revenue: number;
  streams: number;
}

const mockPlatforms = [
  { name: 'Spotify', percentage: 48, revenue: 408.00, streams: 96000, color: 'bg-emerald-500' },
  { name: 'Apple Music', percentage: 30, revenue: 255.00, streams: 60000, color: 'bg-rose-500' },
  { name: 'YouTube Music', percentage: 14, revenue: 119.00, streams: 28000, color: 'bg-red-600' },
  { name: 'Amazon Music', percentage: 8, revenue: 68.00, streams: 16000, color: 'bg-sky-500' },
];

export default function Revenue() {
  const [data, setData] = useState<RevenueData[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalStreams, setTotalStreams] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRevenueData();
  }, []);

  const fetchRevenueData = async () => {
    try {
      const response = await axios.get('/api/release/revenue');
      setData(response.data.monthly || []);
      setTotalRevenue(response.data.totalRevenue || 0);
      setTotalStreams(response.data.totalStreams || 0);
    } catch (error) {
      console.error('Failed to fetch revenue data');
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = () => {
    alert("Exporting financial statement to PDF...");
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 dark:text-white">Revenue & Analytics</h1>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Track earnings and platform distribution statistics</p>
        </div>
        <button
          onClick={handleExportPDF}
          className="btn-primary inline-flex items-center gap-2 text-sm justify-center py-2.5"
        >
          <Download size={18} />
          <span>Export PDF Statement</span>
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500"></div>
        </div>
      ) : (
        <>
          {/* Metrics Grids */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card hover:translate-y-[-2px]">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-slate-400 dark:text-slate-500 text-xs font-semibold uppercase tracking-wider">Total Net Revenue</span>
                  <p className="text-4xl font-extrabold mt-1 text-slate-800 dark:text-white">${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="h-14 w-14 rounded-2xl bg-rose-50 dark:bg-rose-950/20 flex items-center justify-center text-rose-500 shadow-sm border border-rose-500/5">
                  <DollarSign className="h-7 w-7" />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-400">
                <span className="text-emerald-500 font-bold inline-flex items-center">
                  +12.4% <ArrowUpRight size={14} />
                </span>
                <span>compared to last statement period</span>
              </div>
            </div>

            <div className="card hover:translate-y-[-2px]">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-slate-400 dark:text-slate-500 text-xs font-semibold uppercase tracking-wider">Total Accumulated Streams</span>
                  <p className="text-4xl font-extrabold mt-1 text-slate-800 dark:text-white">{totalStreams.toLocaleString()}</p>
                </div>
                <div className="h-14 w-14 rounded-2xl bg-violet-50 dark:bg-violet-950/20 flex items-center justify-center text-violet-500 shadow-sm border border-violet-500/5">
                  <TrendingUp className="h-7 w-7" />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-400">
                <span className="text-emerald-500 font-bold inline-flex items-center">
                  +8.7% <ArrowUpRight size={14} />
                </span>
                <span>growth trend in listener reach</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Monthly Trend Area Chart */}
            <div className="card lg:col-span-2">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">Earnings Trend</h2>
                <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Monthly distribution performance</p>
              </div>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00aeef" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#00aeef" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(203, 213, 225, 0.1)" />
                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{ 
                        backgroundColor: 'rgba(15, 23, 42, 0.95)', 
                        borderColor: 'rgba(30, 41, 59, 0.8)',
                        borderRadius: '12px',
                        color: '#fff',
                        fontSize: '13px'
                      }}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#00aeef" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Platform Analytics Card */}
            <div className="card">
              <h2 className="text-xl font-bold mb-2 text-slate-800 dark:text-white">Store Share</h2>
              <p className="text-sm text-slate-400 dark:text-slate-500 mb-6">Distribution across global DSPs</p>
              
              <div className="space-y-5">
                {mockPlatforms.map((platform, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex items-center justify-between text-sm font-semibold">
                      <span className="text-slate-700 dark:text-slate-300">{platform.name}</span>
                      <span className="text-slate-800 dark:text-white">{platform.percentage}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className={`h-full ${platform.color} rounded-full`} style={{ width: `${platform.percentage}%` }}></div>
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-400 font-medium">
                      <span>{platform.streams.toLocaleString()} streams</span>
                      <span>${platform.revenue.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Monthly Breakdown Table */}
          <div className="card p-0 overflow-hidden border border-slate-100 dark:border-dark-border/40 shadow-soft">
            <div className="p-6 border-b border-slate-100 dark:border-dark-border/20">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white font-sans">Statement Logs</h2>
              <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Detailed history of statement cycles</p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse font-sans">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-bg/60">
                    <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider text-slate-400">Statement Month</th>
                    <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider text-slate-400 text-right">Streams Net</th>
                    <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider text-slate-400 text-right">Earning Share</th>
                    <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider text-slate-400 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-dark-border/40">
                  {data.map((item, index) => (
                    <tr key={index} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="py-4 px-6 text-slate-700 dark:text-slate-300 font-bold">{item.month}</td>
                      <td className="py-4 px-6 text-right text-slate-600 dark:text-slate-400 font-semibold font-mono text-sm">
                        {item.streams.toLocaleString()}
                      </td>
                      <td className="py-4 px-6 text-right text-rose-500 dark:text-rose-400 font-bold font-mono text-sm">
                        ${item.revenue.toFixed(2)}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/10">
                          Released
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
