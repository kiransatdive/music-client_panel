import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, Disc, DollarSign, User, Bell, LogOut, Menu, X, ChevronLeft, ChevronRight, Sun, Moon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { getBackendUrl } from '../utils/config';

export default function Layout() {
  const { logout } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    return saved === 'true';
  });

  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await axios.get(`${getBackendUrl()}/api/notifications`, { headers: { Authorization: `Bearer ${token}` } });
      const data = res.data?.data || res.data || [];
      if (Array.isArray(data)) {
        const unread = data.filter((n: any) => !(n.isRead ?? n.is_read)).length;
        setUnreadCount(unread);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    window.addEventListener('notifications_updated', fetchUnreadCount);
    return () => window.removeEventListener('notifications_updated', fetchUnreadCount);
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('sidebar-collapsed', String(next));
      return next;
    });
  };

  const navItems = [
    { path: '/', label: 'Dashboard', icon: Home },
    { path: '/releases', label: 'Releases', icon: Disc },
    { path: '/revenue', label: 'Revenue', icon: DollarSign },
    { path: '/profile', label: 'Profile', icon: User },
    { path: '/notifications', label: 'Notifications', icon: Bell },
  ];

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-dark-bg text-slate-800 dark:text-slate-100 transition-colors duration-300">
      {/* Sidebar for desktop */}
      <aside
        className={`hidden md:flex flex-col bg-white dark:bg-dark-card border-r border-slate-200 dark:border-dark-border/40 p-4 transition-all duration-300 relative ${isCollapsed ? 'w-20' : 'w-64'
          }`}
      >
        {/* Toggle Collapse Button */}
        <button
          onClick={toggleCollapse}
          className="absolute -right-3 top-8 bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border/40 text-slate-500 hover:text-rose-500 rounded-full p-1 shadow-md z-20 transition-all duration-200 hover:scale-110 active:scale-95"
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        {/* Logo Container */}
        <div className={`mb-8 flex items-center ${isCollapsed ? 'justify-center' : 'px-2 gap-3'}`}>
          <div
            className={`overflow-hidden flex items-center justify-start rounded-xl transition-all duration-300 ${isCollapsed ? 'w-6 h-6' : 'w-full h-18'
              }`}
          >
            <img
              src="/LOGOMusic.png"
              alt="Shivam Music Group Logo"
              className={`transition-all duration-300 dark:invert dark:hue-rotate-180 ${isCollapsed ? 'h-10 max-w-none w-28 object-left object-cover' : 'h-14 w-auto max-w-full object-contain'
                }`}
            />
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 relative ${isActive
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-500/10'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:text-rose-600 dark:hover:text-rose-400'
                  }`}
              >
                <div className="relative">
                  <Icon size={20} className={`flex-shrink-0 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-white' : ''}`} />
                  {item.path === '/notifications' && unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-500 items-center justify-center text-[9px] text-white font-bold border border-white dark:border-slate-900">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    </span>
                  )}
                </div>
                <span
                  className={`font-medium transition-all duration-300 ${isCollapsed ? 'opacity-0 w-0 overflow-hidden pointer-events-none' : 'opacity-100'
                    }`}
                >
                  {item.label}
                </span>

                {/* Tooltip for collapsed mode */}
                {isCollapsed && (
                  <span className="absolute left-16 bg-slate-900 dark:bg-slate-800 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg pointer-events-none whitespace-nowrap z-50 border border-slate-700/30">
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Theme Settings & Logout */}
        <div className="border-t border-slate-100 dark:border-dark-border/30 pt-4 space-y-4">
          {/* Dark Mode Toggle */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`group flex items-center gap-3 px-4 py-3 text-slate-600 dark:text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:text-rose-600 dark:hover:text-rose-400 rounded-xl transition-all duration-200 w-full relative`}
          >
            {isDarkMode ? (
              <Sun size={20} className="flex-shrink-0 text-amber-500 group-hover:rotate-45 transition-transform duration-300" />
            ) : (
              <Moon size={20} className="flex-shrink-0 text-slate-500 group-hover:-rotate-12 transition-transform duration-300" />
            )}
            <span
              className={`font-medium transition-all duration-300 ${isCollapsed ? 'opacity-0 w-0 overflow-hidden pointer-events-none' : 'opacity-100'
                }`}
            >
              {isDarkMode ? 'Light Mode' : 'Dark Mode'}
            </span>
            {isCollapsed && (
              <span className="absolute left-16 bg-slate-900 dark:bg-slate-800 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg pointer-events-none whitespace-nowrap z-50 border border-slate-700/30">
                {isDarkMode ? 'Light Mode' : 'Dark Mode'}
              </span>
            )}
          </button>

          {/* Logout Button */}
          <button
            onClick={logout}
            className="group flex items-center gap-3 px-4 py-3 text-slate-600 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-500 rounded-xl transition-all duration-200 w-full relative"
          >
            <LogOut size={20} className="flex-shrink-0 group-hover:translate-x-0.5 transition-transform duration-200" />
            <span
              className={`font-medium transition-all duration-300 ${isCollapsed ? 'opacity-0 w-0 overflow-hidden pointer-events-none' : 'opacity-100'
                }`}
            >
              Logout
            </span>
            {isCollapsed && (
              <span className="absolute left-16 bg-red-600 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg pointer-events-none whitespace-nowrap z-50">
                Logout
              </span>
            )}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header for mobile */}
        <header className="md:hidden bg-white dark:bg-dark-card border-b border-slate-200 dark:border-dark-border/40 p-4 sticky top-0 z-30 transition-colors duration-300">
          <div className="flex items-center justify-between">
            <div className="h-12 overflow-hidden flex items-center rounded-lg">
              <img
                src="/LOGOMusic.png"
                alt="Shivam Music Group Logo"
                className="h-10 w-auto object-contain dark:invert dark:hue-rotate-180"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {isDarkMode ? <Sun size={20} className="text-amber-500" /> : <Moon size={20} />}
              </button>
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {isOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {isOpen && (
          <div className="md:hidden bg-white dark:bg-dark-card border-b border-slate-200 dark:border-dark-border/40 p-4 transition-colors duration-300 space-y-3">
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive
                        ? 'bg-rose-600 text-white shadow-md shadow-rose-500/10'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:text-rose-600 dark:hover:text-rose-400'
                      }`}
                  >
                    <div className="relative">
                      <Icon size={20} />
                      {item.path === '/notifications' && unreadCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-500 items-center justify-center text-[9px] text-white font-bold border border-white dark:border-slate-900">
                            {unreadCount > 9 ? '9+' : unreadCount}
                          </span>
                        </span>
                      )}
                    </div>
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}
              <button
                onClick={() => {
                  logout();
                  setIsOpen(false);
                }}
                className="flex items-center gap-3 px-4 py-3 text-slate-600 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-500 rounded-xl transition-all duration-200 w-full text-left"
              >
                <LogOut size={20} />
                <span className="font-medium">Logout</span>
              </button>
            </nav>
          </div>
        )}

        <main className="flex-1 p-6 overflow-auto w-full">
          <div className="w-full mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
