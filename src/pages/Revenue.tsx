import { useEffect, useState } from 'react';
import axios from 'axios';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DollarSign, TrendingUp, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { getBackendUrl } from '../utils/config';

interface RevenueData {
  month: string;
  revenue: number;
  streams: number;
}

export default function Revenue() {
  const [data, setData] = useState<RevenueData[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalStreams, setTotalStreams] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    fetchRevenueData();
  }, []);

  const fetchRevenueData = async () => {
    try {
      const token = localStorage.getItem('token');
      const reqConfig = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      const response = await axios.get(`${getBackendUrl()}/api/releases/stats`, reqConfig);
      
      if (response.data && response.data.success && response.data.data) {
        setTotalRevenue(response.data.data.total_income || 0);
        setTotalStreams(response.data.data.live || 0);
        
        const { monthwiseRevenue = [], monthwiseLiveReleases = [] } = response.data.data;
        const dataMap = new Map<string, { month: string; revenue: number; streams: number; timestamp: number }>();
        
        const getMonthInfo = (m: string) => {
          let date = new Date();
          if (/^\d+$/.test(m)) {
            date = new Date(1899, 11, 30);
            date.setDate(date.getDate() + parseInt(m, 10));
          } else {
            date = new Date(m + '-01');
          }
          if (isNaN(date.getTime())) {
            return { label: m, timestamp: 0 };
          }
          return {
            label: date.toLocaleString('default', { month: 'short' }) + ' ' + date.getFullYear().toString().slice(-2),
            timestamp: date.getTime(),
          };
        };

        monthwiseRevenue.forEach((item: any) => {
          if (!item.month) return;
          const { label, timestamp } = getMonthInfo(item.month);
          if (!dataMap.has(label)) {
            dataMap.set(label, { month: label, revenue: 0, streams: 0, timestamp });
          }
          dataMap.get(label)!.revenue += parseFloat(item.income || item.revenue) || 0;
        });

        monthwiseLiveReleases.forEach((item: any) => {
          if (!item.month) return;
          const { label, timestamp } = getMonthInfo(item.month);
          if (!dataMap.has(label)) {
            dataMap.set(label, { month: label, revenue: 0, streams: 0, timestamp });
          }
          dataMap.get(label)!.streams += parseInt(item.count) || 0;
        });

        setData(Array.from(dataMap.values()).sort((a, b) => a.timestamp - b.timestamp));
      }
    } catch (error) {
      console.error('Failed to fetch revenue data');
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(data.length / itemsPerPage) || 1;
  const currentData = data.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleExportExcel = () => {
    if (!data || data.length === 0) {
      alert("No data available to export.");
      return;
    }

    const headers = ["Statement Month", "Live Releases", "Earning Share ($)"];
    const csvContent = [
      headers.join(","),
      ...data.map(item => `"${item.month}",${item.streams},${item.revenue.toFixed(2)}`)
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "statement_log.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
          onClick={handleExportExcel}
          className="btn-primary inline-flex items-center gap-2 text-sm justify-center py-2.5"
        >
          <Download size={18} />
          <span>Export Excel Statement</span>
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

            </div>

            <div className="card hover:translate-y-[-2px]">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-slate-400 dark:text-slate-500 text-xs font-semibold uppercase tracking-wider">Total Live Releases</span>
                  <p className="text-4xl font-extrabold mt-1 text-slate-800 dark:text-white">{totalStreams.toLocaleString()}</p>
                </div>
                <div className="h-14 w-14 rounded-2xl bg-violet-50 dark:bg-violet-950/20 flex items-center justify-center text-violet-500 shadow-sm border border-violet-500/5">
                  <TrendingUp className="h-7 w-7" />
                </div>
              </div>

            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {/* Monthly Trend Area Chart */}
            <div className="card">
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
                      <linearGradient id="colorStreams" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(203, 213, 225, 0.1)" />
                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis yAxisId="left" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{ 
                        backgroundColor: 'rgba(15, 23, 42, 0.95)', 
                        borderColor: 'rgba(30, 41, 59, 0.8)',
                        borderRadius: '12px',
                        color: '#fff',
                        fontSize: '13px'
                      }}
                    />
                    <Area yAxisId="left" type="monotone" dataKey="revenue" name="Revenue" stroke="#00aeef" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                    <Area yAxisId="right" type="monotone" dataKey="streams" name="Live Releases" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorStreams)" />
                  </AreaChart>
                </ResponsiveContainer>
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
                    <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider text-slate-400 text-right">Live Releases</th>
                    <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider text-slate-400 text-right">Earning Share</th>
                    <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider text-slate-400 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-dark-border/40">
                  {currentData.map((item, index) => (
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

            {/* Pagination Controls */}
            {data.length > itemsPerPage && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-dark-border/40">
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, data.length)} of {data.length} entries
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg border border-slate-200 dark:border-dark-border hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-slate-600 dark:text-slate-300"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg border border-slate-200 dark:border-dark-border hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-slate-600 dark:text-slate-300"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
