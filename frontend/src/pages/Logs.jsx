import React, { useState, useEffect } from 'react';
import { ScrollText, RefreshCw, Filter, AlertCircle, Search } from 'lucide-react';

const LOG_LEVELS = {
  INFO:     { color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',   dot: 'bg-green-500' },
  WARNING:  { color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', dot: 'bg-yellow-500' },
  ERROR:    { color: 'bg-red-100 text-[#DA3832] dark:bg-red-900/30 dark:text-red-400',          dot: 'bg-[#DA3832]' },
  CRITICAL: { color: 'bg-red-200 text-red-900 dark:bg-red-900/50 dark:text-red-300 font-bold',  dot: 'bg-red-900' },
};

const EVENT_LABELS = {
  login_success:       'Successful Login',
  login_failed:        'Failed Login',
  role_change:         'Role Changed',
  user_created:        'User Created',
  matrix_updated:      'Matrix Updated',
  unauthorized_access: 'Unauthorized Access',
  password_reset:      'Password Reset',
  invite_sent:         'Invite Sent',
};

const LevelBadge = ({ level }) => {
  const cfg = LOG_LEVELS[level] || LOG_LEVELS.INFO;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {level}
    </span>
  );
};

const StatCard = ({ label, value, level }) => {
  const cfg = LOG_LEVELS[level] || LOG_LEVELS.INFO;
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800 flex items-center gap-4">
      <div className={`w-3 h-10 rounded-full ${cfg.dot}`} />
      <div>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">{label}</p>
      </div>
    </div>
  );
};

const PER_PAGE = 15;

export default function Logs() {
  const [logs, setLogs]               = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [filterLevel, setFilterLevel] = useState('ALL');
  const [filterEvent, setFilterEvent] = useState('ALL');
  const [search, setSearch]           = useState('');
  const [page, setPage]               = useState(1);

  const fetchLogs = async () => {
    setLoading(true); setError(null);
    try {
      const token = localStorage.getItem('keval_token');
      const res = await fetch('/api/admin/logs', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch logs');
      const data = await res.json();
      setLogs(data.logs || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, []);

  const filtered = logs.filter(log => {
    const matchLevel  = filterLevel === 'ALL' || log.level === filterLevel;
    const matchEvent  = filterEvent === 'ALL' || log.event === filterEvent;
    const matchSearch = !search ||
      log.user?.toLowerCase().includes(search.toLowerCase()) ||
      log.message?.toLowerCase().includes(search.toLowerCase()) ||
      log.ip?.includes(search);
    return matchLevel && matchEvent && matchSearch;
  });

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const counts = {
    INFO:     logs.filter(l => l.level === 'INFO').length,
    WARNING:  logs.filter(l => l.level === 'WARNING').length,
    ERROR:    logs.filter(l => l.level === 'ERROR').length,
    CRITICAL: logs.filter(l => l.level === 'CRITICAL').length,
  };

  const uniqueEvents = ['ALL', ...new Set(logs.map(l => l.event).filter(Boolean))];

  const formatDate = ts => {
    if (!ts) return '—';
    return new Date(ts).toLocaleString('en-KE', { dateStyle: 'medium', timeStyle: 'short' });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6 transition-colors">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#DA3832]/10 rounded-xl">
            <ScrollText size={24} className="text-[#DA3832]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">System Logs</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Monitor all system activity and security events</p>
          </div>
        </div>
        <button
          onClick={fetchLogs}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:border-[#DA3832] hover:text-[#DA3832] transition-all"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Info"     value={counts.INFO}     level="INFO" />
        <StatCard label="Warnings" value={counts.WARNING}  level="WARNING" />
        <StatCard label="Errors"   value={counts.ERROR}    level="ERROR" />
        <StatCard label="Critical" value={counts.CRITICAL} level="CRITICAL" />
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 mb-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex-1 min-w-[200px] relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search user, message, IP..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-[#DA3832]"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={15} className="text-gray-400" />
            <select
              value={filterLevel}
              onChange={e => { setFilterLevel(e.target.value); setPage(1); }}
              className="text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-[#DA3832]"
            >
              <option value="ALL">All Levels</option>
              {Object.keys(LOG_LEVELS).map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <select
            value={filterEvent}
            onChange={e => { setFilterEvent(e.target.value); setPage(1); }}
            className="text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-[#DA3832]"
          >
            {uniqueEvents.map(e => (
              <option key={e} value={e}>{e === 'ALL' ? 'All Events' : (EVENT_LABELS[e] || e)}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw size={24} className="animate-spin text-[#DA3832]" />
            <span className="ml-3 text-gray-500">Loading logs...</span>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-20 text-red-500">
            <AlertCircle size={20} className="mr-2" /> {error}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <ScrollText size={40} className="mb-3 opacity-30" />
            <p className="font-medium">No logs found</p>
            <p className="text-sm">Try adjusting your filters</p>
          </div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                  {['Level','Event','User','Role','Message','IP','Time'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {paginated.map((log, i) => (
                  <tr key={log._id || i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-4 py-3"><LevelBadge level={log.level} /></td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300 font-medium">
                      {EVENT_LABELS[log.event] || log.event || '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{log.user || '—'}</td>
                    <td className="px-4 py-3">
                      {log.role
                        ? <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs text-gray-600 dark:text-gray-400">{log.role.replace(/_/g, ' ')}</span>
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 max-w-xs truncate">{log.message || '—'}</td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">{log.ip || '—'}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{formatDate(log.timestamp)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-800">
                <p className="text-xs text-gray-500">
                  Showing {(page-1)*PER_PAGE+1}–{Math.min(page*PER_PAGE, filtered.length)} of {filtered.length}
                </p>
                <div className="flex gap-2">
                  <button onClick={() => setPage(p => Math.max(1,p-1))} disabled={page===1}
                    className="px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-700 rounded-lg disabled:opacity-40 hover:border-[#DA3832] hover:text-[#DA3832] transition-all">
                    Previous
                  </button>
                  <span className="px-3 py-1.5 text-xs text-gray-600 dark:text-gray-400">{page} / {totalPages}</span>
                  <button onClick={() => setPage(p => Math.min(totalPages,p+1))} disabled={page===totalPages}
                    className="px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-700 rounded-lg disabled:opacity-40 hover:border-[#DA3832] hover:text-[#DA3832] transition-all">
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}