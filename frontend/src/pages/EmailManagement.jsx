import React, { useState, useEffect } from 'react';
import { Mail, RefreshCw, Send, Clock, CheckCircle, XCircle, AlertCircle, Search } from 'lucide-react';

const STATUS_CONFIG = {
  pending:  { color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', icon: Clock,         label: 'Pending' },
  used:     { color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',     icon: CheckCircle,   label: 'Used' },
  expired:  { color: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',            icon: XCircle,       label: 'Expired' },
  failed:   { color: 'bg-red-100 text-[#DA3832] dark:bg-red-900/30 dark:text-red-400',           icon: AlertCircle,   label: 'Failed' },
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.color}`}>
      <Icon size={12} />
      {cfg.label}
    </span>
  );
};

const StatCard = ({ label, value, color }) => (
  <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800 flex items-center gap-4">
    <div className={`w-3 h-10 rounded-full ${color}`} />
    <div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">{label}</p>
    </div>
  </div>
);

const PER_PAGE = 10;

export default function EmailManagement() {
  const [invites, setInvites]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [search, setSearch]             = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [page, setPage]                 = useState(1);
  const [resending, setResending]       = useState(null);
  const [resendMsg, setResendMsg]       = useState(null);

  // New invite modal
  const [showInvite, setShowInvite] = useState(false);
  const [newEmail, setNewEmail]     = useState('');
  const [sending, setSending]       = useState(false);
  const [sendMsg, setSendMsg]       = useState(null);

  const token = localStorage.getItem('keval_token');

  const fetchInvites = async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch('/api/admin/emails', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch emails');
      const data = await res.json();
      setInvites(data.invites || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInvites(); }, []);

  const handleResend = async (inviteId, email) => {
    setResending(inviteId);
    setResendMsg(null);
    try {
      const res = await fetch('/api/admin/emails/resend', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ invite_id: inviteId, email })
      });
      const data = await res.json();
      setResendMsg({ type: res.ok ? 'success' : 'error', text: data.message });
      if (res.ok) fetchInvites();
    } catch {
      setResendMsg({ type: 'error', text: 'Failed to resend invite' });
    } finally {
      setResending(null);
    }
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
    } catch {
      setSendMsg({ type: 'error', text: 'Failed to send invite' });
    } finally {
      setSending(false);
    }
  };

  const now = new Date();
  const getStatus = (invite) => {
    if (invite.used) return 'used';
    if (new Date(invite.expires_at) < now) return 'expired';
    return 'pending';
  };

  const enriched = invites.map(inv => ({ ...inv, status: getStatus(inv) }));

  const filtered = enriched.filter(inv => {
    const matchStatus = filterStatus === 'ALL' || inv.status === filterStatus;
    const matchSearch = !search || inv.email?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated  = filtered.slice((page-1)*PER_PAGE, page*PER_PAGE);

  const counts = {
    total:   enriched.length,
    pending: enriched.filter(i => i.status === 'pending').length,
    used:    enriched.filter(i => i.status === 'used').length,
    expired: enriched.filter(i => i.status === 'expired').length,
  };

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
            <Mail size={24} className="text-[#DA3832]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Email Management</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Manage invites and email activity</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchInvites}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:border-[#DA3832] hover:text-[#DA3832] transition-all">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button onClick={() => { setShowInvite(true); setSendMsg(null); }}
            className="flex items-center gap-2 px-4 py-2 bg-[#DA3832] text-white rounded-lg text-sm font-bold hover:bg-red-700 transition-all">
            <Send size={16} />
            Send Invite
          </button>
        </div>
      </div>

      {/* Send Invite Modal */}
      {showInvite && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-md shadow-2xl border border-gray-200 dark:border-gray-800">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Send Admin Invite</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">An invite link will be emailed to the address below.</p>
            <input
              type="email"
              placeholder="Enter email address"
              value={newEmail}
              onChange={e => setNewEmail(e.target.value)}
              className="w-full px-4 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-[#DA3832] mb-3"
            />
            {sendMsg && (
              <p className={`text-sm mb-3 ${sendMsg.type === 'success' ? 'text-green-600' : 'text-[#DA3832]'}`}>
                {sendMsg.text}
              </p>
            )}
            <div className="flex gap-2 justify-end">
              <button onClick={() => { setShowInvite(false); setSendMsg(null); setNewEmail(''); }}
                className="px-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all">
                Cancel
              </button>
              <button onClick={handleSendInvite} disabled={sending || !newEmail}
                className="px-4 py-2 text-sm bg-[#DA3832] text-white rounded-lg font-bold hover:bg-red-700 disabled:opacity-50 transition-all flex items-center gap-2">
                {sending ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                {sending ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Invites" value={counts.total}   color="bg-gray-400" />
        <StatCard label="Pending"       value={counts.pending} color="bg-yellow-500" />
        <StatCard label="Used"          value={counts.used}    color="bg-green-500" />
        <StatCard label="Expired"       value={counts.expired} color="bg-gray-300" />
      </div>

      {/* Resend message */}
      {resendMsg && (
        <div className={`mb-4 px-4 py-3 rounded-lg text-sm font-medium ${resendMsg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-[#DA3832] border border-red-200'}`}>
          {resendMsg.text}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 mb-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex-1 min-w-[200px] relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by email..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-[#DA3832]"
            />
          </div>
          <select
            value={filterStatus}
            onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
            className="text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-[#DA3832]"
          >
            <option value="ALL">All Statuses</option>
            {Object.keys(STATUS_CONFIG).map(s => (
              <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw size={24} className="animate-spin text-[#DA3832]" />
            <span className="ml-3 text-gray-500">Loading emails...</span>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-20 text-red-500">
            <AlertCircle size={20} className="mr-2" /> {error}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Mail size={40} className="mb-3 opacity-30" />
            <p className="font-medium">No invites found</p>
            <p className="text-sm">Send an invite to get started</p>
          </div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                  {['Email','Role','Status','Sent','Expires','Action'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {paginated.map((inv, i) => (
                  <tr key={inv._id || i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-4 py-3 text-gray-900 dark:text-white font-medium">{inv.email}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs text-gray-600 dark:text-gray-400">
                        {(inv.role || 'business_admin').replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={inv.status} /></td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(inv.created_at)}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(inv.expires_at)}</td>
                    <td className="px-4 py-3">
                      {inv.status === 'pending' && (
                        <button
                          onClick={() => handleResend(inv._id, inv.email)}
                          disabled={resending === inv._id}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-[#DA3832] text-[#DA3832] rounded-lg hover:bg-[#DA3832]/10 disabled:opacity-50 transition-all font-medium"
                        >
                          {resending === inv._id
                            ? <RefreshCw size={12} className="animate-spin" />
                            : <Send size={12} />}
                          Resend
                        </button>
                      )}
                      {inv.status === 'expired' && (
                        <button
                          onClick={() => handleResend(inv._id, inv.email)}
                          disabled={resending === inv._id}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 rounded-lg hover:border-[#DA3832] hover:text-[#DA3832] disabled:opacity-50 transition-all font-medium"
                        >
                          {resending === inv._id
                            ? <RefreshCw size={12} className="animate-spin" />
                            : <RefreshCw size={12} />}
                          Re-invite
                        </button>
                      )}
                      {inv.status === 'used' && (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
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