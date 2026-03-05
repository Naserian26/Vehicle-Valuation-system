import React, { useState, useEffect } from 'react';
import { Mail, RefreshCw, Send, Clock, CheckCircle, XCircle, AlertCircle, Search, X } from 'lucide-react';

const STATUS_CONFIG = {
  pending: { badge: 'bg-yellow-400 text-black', label: 'Pending', icon: Clock },
  used:    { badge: 'bg-black text-white',       label: 'Used',    icon: CheckCircle },
  expired: { badge: 'bg-gray-300 text-black',    label: 'Expired', icon: XCircle },
  failed:  { badge: 'bg-[#DA3832] text-white',   label: 'Failed',  icon: AlertCircle },
};

const PER_PAGE = 10;

export default function EmailManagement() {
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [page, setPage] = useState(1);
  const [resending, setResending] = useState(null);
  const [resendMsg, setResendMsg] = useState(null);
  const [showInvite, setShowInvite] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sendMsg, setSendMsg] = useState(null);

  const token = localStorage.getItem('keval_token');

  const fetchInvites = async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch('/api/admin/emails', { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Failed to fetch emails');
      const data = await res.json();
      setInvites(data.invites || []);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchInvites();
    const interval = setInterval(fetchInvites, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleResend = async (inviteId, email) => {
    setResending(inviteId); setResendMsg(null);
    try {
      const res = await fetch('/api/admin/emails/resend', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ invite_id: inviteId, email })
      });
      const data = await res.json();
      setResendMsg({ type: res.ok ? 'success' : 'error', text: data.message });
      if (res.ok) fetchInvites();
    } catch { setResendMsg({ type: 'error', text: 'Failed to resend invite' }); }
    finally { setResending(null); }
  };

  const handleSendInvite = async () => {
    if (!newEmail) return;
    setSending(true); setSendMsg(null);
    try {
      const res = await fetch('/api/auth/invite', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newEmail })
      });
      const data = await res.json();
      setSendMsg({ type: res.ok ? 'success' : 'error', text: data.message });
      if (res.ok) { setNewEmail(''); fetchInvites(); }
    } catch { setSendMsg({ type: 'error', text: 'Failed to send invite' }); }
    finally { setSending(false); }
  };

  const now = new Date();
  const getStatus = (inv) => inv.used ? 'used' : new Date(inv.expires_at) < now ? 'expired' : 'pending';
  const enriched = invites.map(inv => ({ ...inv, status: getStatus(inv) }));
  const filtered = enriched.filter(inv => {
    const matchStatus = filterStatus === 'ALL' || inv.status === filterStatus;
    const matchSearch = !search || inv.email?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const counts = {
    total: enriched.length,
    pending: enriched.filter(i => i.status === 'pending').length,
    used: enriched.filter(i => i.status === 'used').length,
    expired: enriched.filter(i => i.status === 'expired').length,
  };

  const formatDate = ts => ts ? new Date(ts).toLocaleString('en-KE', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-black text-[#DA3832] uppercase tracking-widest mb-1">Kenya Revenue Authority</p>
          <h1 className="text-3xl font-black text-black dark:text-white uppercase tracking-tight">Email Management</h1>
          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Manage invites and email activity</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchInvites}
            className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-gray-900 border-2 border-black dark:border-gray-700 text-black dark:text-gray-300 font-black text-xs uppercase tracking-widest hover:bg-black hover:text-white transition-all">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button onClick={() => { setShowInvite(true); setSendMsg(null); }}
            className="flex items-center gap-2 px-4 py-3 bg-[#DA3832] text-white font-black text-xs uppercase tracking-widest hover:bg-red-700 transition-all">
            <Send size={14} /> Send Invite
          </button>
        </div>
      </div>

      {/* Send Invite Modal */}
      {showInvite && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 border-2 border-black dark:border-gray-700 w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 bg-black dark:bg-gray-800 border-b-2 border-black dark:border-gray-700">
              <div className="flex items-center gap-2">
                <Send size={14} className="text-[#DA3832]" />
                <h2 className="text-sm font-black text-white uppercase tracking-widest">Send Admin Invite</h2>
              </div>
              <button onClick={() => { setShowInvite(false); setSendMsg(null); setNewEmail(''); }}
                className="text-gray-400 hover:text-white transition-colors">
                <X size={16} />
              </button>
            </div>
            <div className="p-6">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">An invite link will be emailed to the address below.</p>
              <input
                type="email" placeholder="Enter email address"
                value={newEmail} onChange={e => setNewEmail(e.target.value)}
                className="w-full border-2 border-black dark:border-gray-700 focus:border-[#DA3832] bg-white dark:bg-gray-800 text-black dark:text-white px-4 py-3 text-sm font-bold outline-none transition-colors mb-3"
              />
              {sendMsg && (
                <p className={`text-xs font-black uppercase mb-3 ${sendMsg.type === 'success' ? 'text-green-600' : 'text-[#DA3832]'}`}>
                  {sendMsg.text}
                </p>
              )}
              <div className="flex gap-2">
                <button onClick={() => { setShowInvite(false); setSendMsg(null); setNewEmail(''); }}
                  className="flex-1 py-3 border-2 border-black dark:border-gray-700 text-black dark:text-gray-300 font-black text-xs uppercase tracking-widest hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  Cancel
                </button>
                <button onClick={handleSendInvite} disabled={sending || !newEmail}
                  className="flex-1 py-3 bg-[#DA3832] text-white font-black text-xs uppercase tracking-widest hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                  {sending ? <RefreshCw size={12} className="animate-spin" /> : <Send size={12} />}
                  {sending ? 'Sending...' : 'Send'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Invites', value: counts.total, bar: 'bg-black' },
          { label: 'Pending', value: counts.pending, bar: 'bg-yellow-400' },
          { label: 'Used', value: counts.used, bar: 'bg-green-500' },
          { label: 'Expired', value: counts.expired, bar: 'bg-gray-300' },
        ].map(({ label, value, bar }) => (
          <div key={label} className="border-2 border-black dark:border-gray-700 bg-white dark:bg-gray-900 p-5 relative group hover:bg-black transition-colors">
            <div className={`absolute top-0 left-0 w-full h-1 ${bar}`} />
            <p className="text-[10px] font-black text-gray-400 group-hover:text-[#DA3832] uppercase tracking-widest mb-1 transition-colors">{label}</p>
            <p className="text-3xl font-black text-black dark:text-white group-hover:text-white transition-colors">{value}</p>
          </div>
        ))}
      </div>

      {resendMsg && (
        <div className={`px-4 py-3 border-2 text-xs font-black uppercase tracking-widest
          ${resendMsg.type === 'success' ? 'border-green-500 text-green-600 bg-green-50' : 'border-[#DA3832] text-[#DA3832] bg-red-50'}`}>
          {resendMsg.text}
        </div>
      )}

      {/* Filters */}
      <div className="border-2 border-black dark:border-gray-700 bg-white dark:bg-gray-900">
        <div className="bg-black dark:bg-gray-800 px-5 py-3 border-b-2 border-black dark:border-gray-700">
          <p className="text-xs font-black text-white uppercase tracking-widest">Filters</p>
        </div>
        <div className="p-4 flex flex-wrap gap-3">
          <div className="flex-1 min-w-[200px] relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text" placeholder="Search by email..."
              value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-4 py-2.5 text-sm font-bold border-2 border-black dark:border-gray-700 focus:border-[#DA3832] bg-white dark:bg-gray-800 text-black dark:text-white outline-none transition-colors"
            />
          </div>
          <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
            className="text-sm font-black border-2 border-black dark:border-gray-700 px-3 py-2.5 bg-white dark:bg-gray-800 text-black dark:text-white outline-none focus:border-[#DA3832]">
            <option value="ALL">All Statuses</option>
            {Object.keys(STATUS_CONFIG).map(s => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="border-2 border-black dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 gap-2">
            <RefreshCw size={20} className="animate-spin text-[#DA3832]" />
            <span className="text-sm font-black text-gray-400 uppercase tracking-widest">Loading emails...</span>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-20 gap-2">
            <AlertCircle size={20} className="text-[#DA3832]" />
            <span className="text-sm font-black text-[#DA3832] uppercase">{error}</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Mail size={36} className="text-gray-200 dark:text-gray-700" />
            <p className="text-sm font-black text-gray-400 uppercase tracking-widest">No invites found</p>
          </div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-black dark:bg-gray-800 border-b-2 border-black dark:border-gray-700">
                  {['Email', 'Role', 'Status', 'Sent', 'Expires', 'Action'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-white">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 dark:divide-gray-800">
                {paginated.map((inv, i) => (
                  <tr key={inv._id || i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-4 py-3 text-xs font-black text-black dark:text-white">{inv.email}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 border border-black dark:border-gray-600 text-[10px] font-black text-black dark:text-gray-400 uppercase">
                        {(inv.role || 'business_admin').replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ${STATUS_CONFIG[inv.status]?.badge || 'bg-gray-200 text-black'}`}>
                        {STATUS_CONFIG[inv.status]?.label || inv.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">{formatDate(inv.created_at)}</td>
                    <td className="px-4 py-3 text-xs text-gray-400">{formatDate(inv.expires_at)}</td>
                    <td className="px-4 py-3">
                      {inv.status === 'pending' && (
                        <button onClick={() => handleResend(inv._id, inv.email)} disabled={resending === inv._id}
                          className="flex items-center gap-1.5 px-3 py-1.5 border-2 border-[#DA3832] text-[#DA3832] text-[10px] font-black uppercase hover:bg-[#DA3832] hover:text-white disabled:opacity-50 transition-all">
                          {resending === inv._id ? <RefreshCw size={10} className="animate-spin" /> : <Send size={10} />} Resend
                        </button>
                      )}
                      {inv.status === 'expired' && (
                        <button onClick={() => handleResend(inv._id, inv.email)} disabled={resending === inv._id}
                          className="flex items-center gap-1.5 px-3 py-1.5 border-2 border-black dark:border-gray-600 text-black dark:text-gray-400 text-[10px] font-black uppercase hover:bg-black hover:text-white disabled:opacity-50 transition-all">
                          {resending === inv._id ? <RefreshCw size={10} className="animate-spin" /> : <RefreshCw size={10} />} Re-invite
                        </button>
                      )}
                      {inv.status === 'used' && <span className="text-gray-300 text-xs font-bold">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t-2 border-black dark:border-gray-700">
                <p className="text-xs font-bold text-gray-400 uppercase">
                  Showing {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} of {filtered.length}
                </p>
                <div className="flex gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    className="px-3 py-1.5 text-xs font-black border-2 border-black dark:border-gray-700 text-black dark:text-gray-400 disabled:opacity-30 hover:bg-black hover:text-white transition-all uppercase">
                    Prev
                  </button>
                  <span className="px-3 py-1.5 text-xs font-black text-gray-400">{page} / {totalPages}</span>
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
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