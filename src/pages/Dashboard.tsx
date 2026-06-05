import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { getBackendUrl } from '../utils/config';
import { Disc, DollarSign, Clock, TrendingUp, ArrowUpRight, Calendar, Star, User } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Link } from 'react-router-dom';

interface DashboardStats {
  totalReleases: number;
  pendingReleases: number;
  totalRevenue: number;
  liveReleases: number;
}

const mockChartData = [
  { month: 'Jan', liveReleases: 4000, revenue: 240 },
  { month: 'Feb', liveReleases: 5000, revenue: 300 },
  { month: 'Mar', liveReleases: 6500, revenue: 420 },
  { month: 'Apr', liveReleases: 8000, revenue: 510 },
  { month: 'May', liveReleases: 9500, revenue: 680 },
  { month: 'Jun', liveReleases: 12000, revenue: 850 },
];

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalReleases: 0,
    pendingReleases: 0,
    totalRevenue: 0,
    liveReleases: 0,
  });
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<any[]>(mockChartData);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const reqConfig = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      const response = await axios.get(`${getBackendUrl()}/api/releases/stats`, reqConfig);
      
      if (response.data && response.data.success && response.data.data) {
        setStats(prev => ({
          ...prev,
          totalReleases: response.data.data.total || 0,
          pendingReleases: response.data.data.pending_review || 0,
          totalRevenue: response.data.data.total_income || 0,
          liveReleases: response.data.data.live || 0,
        }));

        const { monthwiseRevenue = [], monthwiseLiveReleases = [] } = response.data.data;
        if (monthwiseRevenue.length > 0 || monthwiseLiveReleases.length > 0) {
          const dataMap = new Map<string, { month: string; liveReleases: number; revenue: number; timestamp: number }>();
          
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
              dataMap.set(label, { month: label, liveReleases: 0, revenue: 0, timestamp });
            }
            dataMap.get(label)!.revenue += parseFloat(item.revenue) || 0;
          });

          monthwiseLiveReleases.forEach((item: any) => {
            if (!item.month) return;
            const { label, timestamp } = getMonthInfo(item.month);
            if (!dataMap.has(label)) {
              dataMap.set(label, { month: label, liveReleases: 0, revenue: 0, timestamp });
            }
            dataMap.get(label)!.liveReleases += parseInt(item.count) || 0;
          });

          setChartData(Array.from(dataMap.values()).sort((a, b) => a.timestamp - b.timestamp));
        }
      }
    } catch (error) {
      console.error('Failed to fetch stats');
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return 'A';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="space-y-8">
      {/* Welcome Banner Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-rose-600 via-rose-500 to-violet-600 p-8 text-white shadow-soft dark:shadow-soft-dark border border-rose-500/10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none"></div>
        <div className="absolute bottom-0 right-1/4 w-32 h-32 bg-rose-400/10 rounded-full blur-xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-xl font-bold border border-white/20 flex-shrink-0">
              {getInitials(user?.artistProfile?.artist_name || 'Artist')}
            </div>
            <div>
              <div className="flex items-center gap-2 text-rose-100 text-sm font-medium">
                <Calendar size={14} />
                <span>{currentDate}</span>
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight mt-1">
                Welcome back, {user?.artistProfile?.artist_name || 'Artist'}!
              </h1>
              <p className="text-rose-100/80 text-sm mt-1">Your music is reaching listeners all over the world.</p>
            </div>
          </div>


        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500"></div>
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="card hover:translate-y-[-2px]">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-slate-400 dark:text-slate-500 text-xs font-semibold uppercase tracking-wider">Total Releases</span>
                  <p className="text-3xl font-extrabold mt-1 text-slate-800 dark:text-white">{stats.totalReleases}</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-rose-50 dark:bg-rose-950/20 flex items-center justify-center text-rose-500">
                  <Disc className="h-6 w-6" />
                </div>
              </div>
            </div>

            <div className="card hover:translate-y-[-2px]">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-slate-400 dark:text-slate-500 text-xs font-semibold uppercase tracking-wider">Pending Approval</span>
                  <p className="text-3xl font-extrabold mt-1 text-slate-800 dark:text-white">{stats.pendingReleases}</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-amber-50 dark:bg-amber-950/20 flex items-center justify-center text-amber-500">
                  <Clock className="h-6 w-6" />
                </div>
              </div>
            </div>

            <div className="card hover:translate-y-[-2px]">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-slate-400 dark:text-slate-500 text-xs font-semibold uppercase tracking-wider">Total Revenue</span>
                  <p className="text-3xl font-extrabold mt-1 text-slate-800 dark:text-white">
                    ${(stats.totalRevenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center text-emerald-500">
                  <DollarSign className="h-6 w-6" />
                </div>
              </div>
            </div>

            <div className="card hover:translate-y-[-2px]">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-slate-400 dark:text-slate-500 text-xs font-semibold uppercase tracking-wider">Live Releases</span>
                  <p className="text-3xl font-extrabold mt-1 text-slate-800 dark:text-white">{stats.liveReleases}</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-violet-50 dark:bg-violet-950/20 flex items-center justify-center text-violet-500">
                  <TrendingUp className="h-6 w-6" />
                </div>
              </div>
            </div>
          </div>

          {/* Growth Trend Chart */}
          <div className="card">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">Performance Analytics</h2>
                <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Growth trends over the last 6 months</p>
              </div>
              <div className="flex items-center gap-4 text-xs font-semibold">
                <span className="flex items-center gap-1.5 text-slate-500">
                  <span className="h-3 w-3 rounded-full bg-rose-500"></span> Live Releases
                </span>
                <span className="flex items-center gap-1.5 text-slate-500">
                  <span className="h-3 w-3 rounded-full bg-violet-500"></span> Revenue
                </span>
              </div>
            </div>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorStreams" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00aeef" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#00aeef" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
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
                  <Area type="monotone" dataKey="liveReleases" stroke="#00aeef" strokeWidth={3} fillOpacity={1} fill="url(#colorStreams)" />
                  <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quick Actions */}
            <div className="card">
              <h2 className="text-xl font-bold mb-6 text-slate-800 dark:text-white">Quick Actions</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Link
                  to="/releases"
                  className="flex flex-col items-center justify-center p-5 rounded-2xl border border-slate-100 dark:border-dark-border/40 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-center transition-all duration-200 group"
                >
                  <div className="h-10 w-10 rounded-xl bg-rose-50 dark:bg-rose-950/20 text-rose-500 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <Disc size={20} />
                  </div>
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">My Releases</span>
                </Link>

                <Link
                  to="/revenue"
                  className="flex flex-col items-center justify-center p-5 rounded-2xl border border-slate-100 dark:border-dark-border/40 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-center transition-all duration-200 group"
                >
                  <div className="h-10 w-10 rounded-xl bg-violet-50 dark:bg-violet-950/20 text-violet-500 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <DollarSign size={20} />
                  </div>
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Revenue Logs</span>
                </Link>

                <Link
                  to="/profile"
                  className="flex flex-col items-center justify-center p-5 rounded-2xl border border-slate-100 dark:border-dark-border/40 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-center transition-all duration-200 group"
                >
                  <div className="h-10 w-10 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-500 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <User size={20} />
                  </div>
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Edit Settings</span>
                </Link>
              </div>
              <div className="mt-6">
                <Link
                  to="/releases/create"
                  className="btn-primary flex items-center justify-center gap-2 w-full py-3 text-sm font-bold uppercase tracking-wider"
                >
                  <span>Create New Release</span>
                  <ArrowUpRight size={16} />
                </Link>
              </div>
            </div>

            {/* Account Details */}
            <div className="card">
              <h2 className="text-xl font-bold mb-6 text-slate-800 dark:text-white">Account Status</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-dark-border/20">
                  <span className="text-sm text-slate-400 dark:text-slate-500 font-medium">Registered Email</span>
                  <span className="text-sm text-slate-700 dark:text-slate-200 font-semibold">{user?.email}</span>
                </div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-dark-border/20">
                  <span className="text-sm text-slate-400 dark:text-slate-500 font-medium">Artist Identifier</span>
                  <span className="text-sm text-slate-700 dark:text-slate-200 font-semibold">{user?.artistProfile?.artist_name}</span>
                </div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-dark-border/20">
                  <span className="text-sm text-slate-400 dark:text-slate-500 font-medium">Verification Tier</span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 dark:bg-rose-950/20 text-rose-500 border border-rose-500/10">
                    <Star size={12} fill="currentColor" /> Verified Artist
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
