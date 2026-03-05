import React, { useState, useEffect } from 'react';
import { ScrollText, RefreshCw, Filter, AlertCircle, Search, FileText, FileSpreadsheet } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const LOG_LEVELS = {
  INFO:     { bar: 'bg-green-500',  badge: 'bg-green-500 text-white' },
  WARNING:  { bar: 'bg-yellow-400', badge: 'bg-yellow-400 text-black' },
  ERROR:    { bar: 'bg-[#DA3832]',  badge: 'bg-[#DA3832] text-white' },
  CRITICAL: { bar: 'bg-black',      badge: 'bg-black text-white' },
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

const PER_PAGE = 15;

const formatDate = ts =>
  ts ? new Date(ts).toLocaleString('en-KE', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

export default function Logs() {
  const [logs, setLogs]               = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [filterLevel, setFilterLevel] = useState('ALL');
  const [filterEvent, setFilterEvent] = useState('ALL');
  const [search, setSearch]           = useState('');
  const [page, setPage]               = useState(1);
  const [exporting, setExporting]     = useState(null); // 'pdf' | 'excel' | null

  const fetchLogs = async () => {
    setLoading(true); setError(null);
    try {
      const token = localStorage.getItem('keval_token');
      const res = await fetch('/api/admin/logs', { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Failed to fetch logs');
      const data = await res.json();
      setLogs(data.logs || []);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 30000);
    return () => clearInterval(interval);
  }, []);

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

  // ── EXPORT TO PDF ──────────────────────────────────────────────
  const exportPDF = () => {
    setExporting('pdf');
    try {
      const doc = new jsPDF({ orientation: 'landscape' });

      // Header bar
      doc.setFillColor(0, 0, 0);
      doc.rect(0, 0, 297, 20, 'F');
      doc.setTextColor(218, 56, 50);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('KENYA REVENUE AUTHORITY', 14, 8);
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.text('SYSTEM LOGS REPORT', 14, 15);

      // Meta
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated: ${new Date().toLocaleString('en-KE')}`, 14, 26);
      doc.text(`Total Records: ${logs.length}`, 14, 31);

      // Summary boxes
      const summaryData = [
        ['INFO', counts.INFO, [34, 197, 94]],
        ['WARNING', counts.WARNING, [234, 179, 8]],
        ['ERROR', counts.ERROR, [218, 56, 50]],
        ['CRITICAL', counts.CRITICAL, [0, 0, 0]],
      ];
      summaryData.forEach(([label, count, color], i) => {
        const x = 14 + i * 68;
        doc.setFillColor(...color);
        doc.rect(x, 35, 64, 12, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.text(label, x + 3, 41);
        doc.setFontSize(11);
        doc.text(String(count), x + 3, 45);
      });

      // Table
      autoTable(doc, {
        startY: 52,
        head: [['Level', 'Event', 'User', 'Role', 'Message', 'IP', 'Time']],
        body: logs.map(log => [
          log.level || '—',
          EVENT_LABELS[log.event] || log.event || '—',
          log.user || '—',
          (log.role || '—').replace(/_/g, ' '),
          log.message || '—',
          log.ip || '—',
          formatDate(log.timestamp),
        ]),
        headStyles: {
          fillColor: [0, 0, 0],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 8,
        },
        bodyStyles: { fontSize: 7, textColor: [30, 30, 30] },
        alternateRowStyles: { fillColor: [248, 248, 248] },
        columnStyles: {
          0: { cellWidth: 18 },
          1: { cellWidth: 32 },
          2: { cellWidth: 45 },
          3: { cellWidth: 28 },
          4: { cellWidth: 70 },
          5: { cellWidth: 22 },
          6: { cellWidth: 35 },
        },
        didParseCell: (data) => {
          if (data.section === 'body' && data.column.index === 0) {
            const level = data.cell.raw;
            if (level === 'ERROR' || level === 'CRITICAL') data.cell.styles.textColor = [218, 56, 50];
            if (level === 'WARNING') data.cell.styles.textColor = [161, 119, 0];
            if (level === 'INFO') data.cell.styles.textColor = [22, 163, 74];
            data.cell.styles.fontStyle = 'bold';
          }
        },
      });

      // Footer
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFillColor(0, 0, 0);
        doc.rect(0, doc.internal.pageSize.height - 8, 297, 8, 'F');
        doc.setTextColor(218, 56, 50);
        doc.setFontSize(7);
        doc.text(`KRA Vehicle Valuation System — Confidential`, 14, doc.internal.pageSize.height - 2);
        doc.setTextColor(255, 255, 255);
        doc.text(`Page ${i} of ${pageCount}`, 270, doc.internal.pageSize.height - 2);
      }

      doc.save(`KRA_System_Logs_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (e) { console.error('PDF export failed:', e); }
    finally { setExporting(null); }
  };

  // ── EXPORT TO EXCEL ────────────────────────────────────────────
  const exportExcel = () => {
    setExporting('excel');
    try {
      const wb = XLSX.utils.book_new();

      // ── Sheet 1: All Logs ──
      const logsData = [
        ['Level', 'Event', 'User', 'Role', 'Message', 'IP Address', 'Timestamp'],
        ...logs.map(log => [
          log.level || '',
          EVENT_LABELS[log.event] || log.event || '',
          log.user || '',
          (log.role || '').replace(/_/g, ' '),
          log.message || '',
          log.ip || '',
          formatDate(log.timestamp),
        ])
      ];
      const ws1 = XLSX.utils.aoa_to_sheet(logsData);
      ws1['!cols'] = [{ wch: 12 }, { wch: 22 }, { wch: 32 }, { wch: 18 }, { wch: 50 }, { wch: 16 }, { wch: 22 }];
      XLSX.utils.book_append_sheet(wb, ws1, 'All Logs');

      // ── Sheet 2: Summary ──
      const summaryData = [
        ['KRA SYSTEM LOGS SUMMARY', ''],
        ['', ''],
        ['Generated', new Date().toLocaleString('en-KE')],
        ['Total Records', logs.length],
        ['', ''],
        ['Level', 'Count'],
        ['INFO',     counts.INFO],
        ['WARNING',  counts.WARNING],
        ['ERROR',    counts.ERROR],
        ['CRITICAL', counts.CRITICAL],
        ['', ''],
        ['Top Events', ''],
        ...Object.entries(
          logs.reduce((acc, l) => { acc[l.event] = (acc[l.event] || 0) + 1; return acc; }, {})
        )
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([event, count]) => [EVENT_LABELS[event] || event, count])
      ];
      const ws2 = XLSX.utils.aoa_to_sheet(summaryData);
      ws2['!cols'] = [{ wch: 25 }, { wch: 20 }];
      XLSX.utils.book_append_sheet(wb, ws2, 'Summary');

      // ── Sheet 3: Errors & Critical only ──
      const errorLogs = logs.filter(l => l.level === 'ERROR' || l.level === 'CRITICAL');
      const errorsData = [
        ['Level', 'Event', 'User', 'Role', 'Message', 'IP Address', 'Timestamp'],
        ...errorLogs.map(log => [
          log.level || '',
          EVENT_LABELS[log.event] || log.event || '',
          log.user || '',
          (log.role || '').replace(/_/g, ' '),
          log.message || '',
          log.ip || '',
          formatDate(log.timestamp),
        ])
      ];
      const ws3 = XLSX.utils.aoa_to_sheet(errorsData);
      ws3['!cols'] = [{ wch: 12 }, { wch: 22 }, { wch: 32 }, { wch: 18 }, { wch: 50 }, { wch: 16 }, { wch: 22 }];
      XLSX.utils.book_append_sheet(wb, ws3, 'Errors & Critical');

      XLSX.writeFile(wb, `KRA_System_Logs_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (e) { console.error('Excel export failed:', e); }
    finally { setExporting(null); }
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-black text-[#DA3832] uppercase tracking-widest mb-1">Kenya Revenue Authority</p>
          <h1 className="text-3xl font-black text-black dark:text-white uppercase tracking-tight">System Logs</h1>
          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Monitor all system activity and security events</p>
        </div>
        <div className="flex gap-2">
          {/* Export Buttons */}
          <button onClick={exportExcel} disabled={exporting === 'excel' || loading}
            className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-gray-900 border-2 border-black dark:border-gray-700 text-black dark:text-white font-black text-xs uppercase tracking-widest hover:bg-black hover:text-white transition-all disabled:opacity-50">
            {exporting === 'excel'
              ? <RefreshCw size={14} className="animate-spin" />
              : <FileSpreadsheet size={14} className="text-green-600" />}
            Excel
          </button>
          <button onClick={exportPDF} disabled={exporting === 'pdf' || loading}
            className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-gray-900 border-2 border-black dark:border-gray-700 text-black dark:text-white font-black text-xs uppercase tracking-widest hover:bg-black hover:text-white transition-all disabled:opacity-50">
            {exporting === 'pdf'
              ? <RefreshCw size={14} className="animate-spin" />
              : <FileText size={14} className="text-[#DA3832]" />}
            PDF
          </button>
          <button onClick={fetchLogs}
            className="flex items-center gap-2 px-4 py-3 bg-black dark:bg-gray-800 text-white font-black text-xs uppercase tracking-widest hover:bg-[#DA3832] transition-all border-2 border-black dark:border-gray-700">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(counts).map(([level, count]) => (
          <div key={level} className="border-2 border-black dark:border-gray-700 bg-white dark:bg-gray-900 p-5 relative group hover:bg-black transition-colors">
            <div className={`absolute top-0 left-0 w-full h-1 ${LOG_LEVELS[level]?.bar}`} />
            <p className="text-[10px] font-black text-gray-400 group-hover:text-[#DA3832] uppercase tracking-widest mb-1 transition-colors">{level}</p>
            <p className="text-3xl font-black text-black dark:text-white group-hover:text-white transition-colors">{count}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="border-2 border-black dark:border-gray-700 bg-white dark:bg-gray-900">
        <div className="bg-black dark:bg-gray-800 px-5 py-3 border-b-2 border-black dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-[#DA3832]" />
            <p className="text-xs font-black text-white uppercase tracking-widest">Filters</p>
          </div>
        </div>
        <div className="p-4 flex flex-wrap gap-3">
          <div className="flex-1 min-w-[200px] relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text" placeholder="Search user, message, IP..."
              value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-4 py-2.5 text-sm font-bold border-2 border-black dark:border-gray-700 focus:border-[#DA3832] bg-white dark:bg-gray-800 text-black dark:text-white outline-none transition-colors"
            />
          </div>
          <select value={filterLevel} onChange={e => { setFilterLevel(e.target.value); setPage(1); }}
            className="text-sm font-black border-2 border-black dark:border-gray-700 px-3 py-2.5 bg-white dark:bg-gray-800 text-black dark:text-white outline-none focus:border-[#DA3832] uppercase">
            <option value="ALL">All Levels</option>
            {Object.keys(LOG_LEVELS).map(l => <option key={l} value={l}>{l}</option>)}
          </select>
          <select value={filterEvent} onChange={e => { setFilterEvent(e.target.value); setPage(1); }}
            className="text-sm font-black border-2 border-black dark:border-gray-700 px-3 py-2.5 bg-white dark:bg-gray-800 text-black dark:text-white outline-none focus:border-[#DA3832]">
            {uniqueEvents.map(e => (
              <option key={e} value={e}>{e === 'ALL' ? 'All Events' : (EVENT_LABELS[e] || e)}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="border-2 border-black dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 gap-2">
            <RefreshCw size={20} className="animate-spin text-[#DA3832]" />
            <span className="text-sm font-black text-gray-400 uppercase tracking-widest">Loading logs...</span>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-20 gap-2">
            <AlertCircle size={20} className="text-[#DA3832]" />
            <span className="text-sm font-black text-[#DA3832] uppercase">{error}</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <ScrollText size={36} className="text-gray-200 dark:text-gray-700" />
            <p className="text-sm font-black text-gray-400 uppercase tracking-widest">No logs found</p>
          </div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-black dark:bg-gray-800 border-b-2 border-black dark:border-gray-700">
                  {['Level','Event','User','Role','Message','IP','Time'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-white">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 dark:divide-gray-800">
                {paginated.map((log, i) => (
                  <tr key={log._id || i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ${LOG_LEVELS[log.level]?.badge || 'bg-gray-200 text-black'}`}>
                        {log.level}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs font-black text-black dark:text-white uppercase tracking-wide">
                      {EVENT_LABELS[log.event] || log.event || '—'}
                    </td>
                    <td className="px-4 py-3 text-xs font-bold text-gray-600 dark:text-gray-400">{log.user || '—'}</td>
                    <td className="px-4 py-3">
                      {log.role
                        ? <span className="px-2 py-0.5 border border-black dark:border-gray-600 text-[10px] font-black text-black dark:text-gray-400 uppercase">{log.role.replace(/_/g, ' ')}</span>
                        : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 max-w-xs truncate">{log.message || '—'}</td>
                    <td className="px-4 py-3 text-xs font-black text-gray-400 font-mono">{log.ip || '—'}</td>
                    <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{formatDate(log.timestamp)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t-2 border-black dark:border-gray-700">
                <p className="text-xs font-bold text-gray-400 uppercase">
                  Showing {(page-1)*PER_PAGE+1}–{Math.min(page*PER_PAGE, filtered.length)} of {filtered.length}
                </p>
                <div className="flex gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1}
                    className="px-3 py-1.5 text-xs font-black border-2 border-black dark:border-gray-700 text-black dark:text-gray-400 disabled:opacity-30 hover:bg-black hover:text-white transition-all uppercase">
                    Prev
                  </button>
                  <span className="px-3 py-1.5 text-xs font-black text-gray-400">{page} / {totalPages}</span>
                  <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page===totalPages}
                    className="px-3 py-1.5 text-xs font-black border-2 border-black dark:border-gray-700 text-black dark:text-gray-400 disabled:opacity-30 hover:bg-black hover:text-white transition-all uppercase">
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