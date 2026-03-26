'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

type Tab = 'overview' | 'users' | 'coupons' | 'payments';

interface Stats {
  totalUsers: number;
  totalFixes: number;
  totalRevenueCents: number;
  totalPayments: number;
  activeCoupons: number;
}

interface UserRecord {
  id: string;
  email: string;
  displayName: string;
  freeFixesUsed: number;
  freeFixesLimit: number;
  fixesRemaining: number;
  totalPaidFixes: number;
  isAdmin: boolean;
  createdAt: string;
}

interface CouponRecord {
  id: string;
  code: string;
  freeFixesGranted: number;
  maxRedemptions: number | null;
  timesRedeemed: number;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
}

interface PaymentRecord {
  id: string;
  userId: string;
  userEmail: string;
  amountCents: number;
  fixesPurchased: number;
  status: string;
  tier: string;
  createdAt: string;
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-sm)]">
      <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">{label}</p>
      <p className="mt-1 font-[family-name:var(--font-display)] text-2xl text-[var(--text-primary)]">{value}</p>
    </div>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, getIdToken } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  // Data states
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [coupons, setCoupons] = useState<CouponRecord[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Coupon form
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponFixes, setNewCouponFixes] = useState(1);
  const [newCouponMaxRedemptions, setNewCouponMaxRedemptions] = useState('');
  const [newCouponExpiry, setNewCouponExpiry] = useState('');
  const [couponMessage, setCouponMessage] = useState('');

  const fetchWithAuth = useCallback(async (url: string, options: RequestInit = {}) => {
    const token = await getIdToken();
    if (!token) throw new Error('Not authenticated');
    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
  }, [getIdToken]);

  // Check admin status
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace('/');
      return;
    }

    (async () => {
      try {
        const res = await fetchWithAuth('/api/admin/stats');
        if (res.status === 403) {
          setIsAdmin(false);
          router.replace('/');
          return;
        }
        setIsAdmin(true);
        const data = await res.json();
        setStats(data);
      } catch {
        router.replace('/');
      }
    })();
  }, [authLoading, user, router, fetchWithAuth]);

  // Fetch data when tab changes
  useEffect(() => {
    if (!isAdmin) return;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        if (activeTab === 'overview') {
          const res = await fetchWithAuth('/api/admin/stats');
          const data = await res.json();
          setStats(data);
        } else if (activeTab === 'users') {
          const url = userSearch ? `/api/admin/users?search=${encodeURIComponent(userSearch)}` : '/api/admin/users';
          const res = await fetchWithAuth(url);
          const data = await res.json();
          setUsers(data.users || []);
        } else if (activeTab === 'coupons') {
          const res = await fetchWithAuth('/api/admin/coupons');
          const data = await res.json();
          setCoupons(data.coupons || []);
        } else if (activeTab === 'payments') {
          const res = await fetchWithAuth('/api/admin/payments');
          const data = await res.json();
          setPayments(data.payments || []);
        }
      } catch (err) {
        console.error('Failed to fetch admin data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [activeTab, isAdmin, fetchWithAuth, userSearch]);

  const handleSearchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const url = userSearch ? `/api/admin/users?search=${encodeURIComponent(userSearch)}` : '/api/admin/users';
      const res = await fetchWithAuth(url);
      const data = await res.json();
      setUsers(data.users || []);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }, [userSearch, fetchWithAuth]);

  const handleAdjustFixes = useCallback(async (userId: string, newAmount: number) => {
    try {
      await fetchWithAuth('/api/admin/users', {
        method: 'PATCH',
        body: JSON.stringify({ userId, fixesRemaining: newAmount }),
      });
      // Refresh users list
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, fixesRemaining: newAmount } : u))
      );
    } catch {
      // ignore
    }
  }, [fetchWithAuth]);

  const handleCreateCoupon = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setCouponMessage('');
    try {
      const res = await fetchWithAuth('/api/admin/coupons', {
        method: 'POST',
        body: JSON.stringify({
          code: newCouponCode,
          freeFixesGranted: newCouponFixes,
          maxRedemptions: newCouponMaxRedemptions ? parseInt(newCouponMaxRedemptions, 10) : null,
          expiresAt: newCouponExpiry || null,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setCouponMessage(`Coupon ${data.code} created!`);
        setNewCouponCode('');
        setNewCouponFixes(1);
        setNewCouponMaxRedemptions('');
        setNewCouponExpiry('');
        // Refresh coupons
        const refreshRes = await fetchWithAuth('/api/admin/coupons');
        const refreshData = await refreshRes.json();
        setCoupons(refreshData.coupons || []);
      } else {
        setCouponMessage(data.error || 'Failed to create coupon');
      }
    } catch {
      setCouponMessage('Failed to create coupon');
    }
  }, [fetchWithAuth, newCouponCode, newCouponFixes, newCouponMaxRedemptions, newCouponExpiry]);

  const handleToggleCoupon = useCallback(async (couponId: string, currentActive: boolean) => {
    try {
      await fetchWithAuth('/api/admin/coupons', {
        method: 'PATCH',
        body: JSON.stringify({ couponId, isActive: !currentActive }),
      });
      setCoupons((prev) =>
        prev.map((c) => (c.id === couponId ? { ...c, isActive: !currentActive } : c))
      );
    } catch {
      // ignore
    }
  }, [fetchWithAuth]);

  if (authLoading || isAdmin === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
        <div className="flex items-center gap-3 text-[var(--text-tertiary)]">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--accent)]" />
          <span className="text-sm">Loading admin panel...</span>
        </div>
      </div>
    );
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'users', label: 'Users' },
    { key: 'coupons', label: 'Coupons' },
    { key: 'payments', label: 'Payments' },
  ];

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="border-b border-[var(--border)] bg-[var(--surface)]">
        <div className="mx-auto max-w-6xl px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-[family-name:var(--font-display)] text-2xl text-[var(--text-primary)]">
                Admin Dashboard
              </h1>
              <p className="mt-0.5 text-sm text-[var(--text-tertiary)]">
                Manage users, coupons, and payments
              </p>
            </div>
            <a
              href="/dashboard"
              className="rounded-md border border-[var(--border)] px-4 py-2 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-raised)]"
            >
              Back to App
            </a>
          </div>

          {/* Tabs */}
          <div className="mt-4 flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`rounded-md px-4 py-2 text-xs font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'bg-[var(--accent)] text-white'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--background)]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-8">
        {isLoading && (
          <div className="mb-4 flex items-center gap-2 text-[var(--text-tertiary)]">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--accent)]" />
            <span className="text-xs">Loading...</span>
          </div>
        )}

        {/* ─── Overview Tab ─── */}
        {activeTab === 'overview' && stats && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total Users" value={String(stats.totalUsers)} />
            <StatCard label="Total Fixes" value={String(stats.totalFixes)} />
            <StatCard label="Revenue" value={`$${(stats.totalRevenueCents / 100).toFixed(2)}`} />
            <StatCard label="Active Coupons" value={String(stats.activeCoupons)} />
          </div>
        )}

        {/* ─── Users Tab ─── */}
        {activeTab === 'users' && (
          <div>
            <div className="mb-4 flex gap-2">
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchUsers()}
                placeholder="Search by email..."
                className="flex-1 rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
              />
              <button
                type="button"
                onClick={handleSearchUsers}
                className="rounded-md bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-white"
              >
                Search
              </button>
            </div>

            <div className="overflow-x-auto rounded-lg border border-[var(--border)] bg-[var(--surface)]">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--surface-raised)]">
                    <th className="px-4 py-3 text-left font-semibold text-[var(--text-tertiary)]">Email</th>
                    <th className="px-4 py-3 text-left font-semibold text-[var(--text-tertiary)]">Name</th>
                    <th className="px-4 py-3 text-center font-semibold text-[var(--text-tertiary)]">Free Used</th>
                    <th className="px-4 py-3 text-center font-semibold text-[var(--text-tertiary)]">Remaining</th>
                    <th className="px-4 py-3 text-center font-semibold text-[var(--text-tertiary)]">Total Paid</th>
                    <th className="px-4 py-3 text-center font-semibold text-[var(--text-tertiary)]">Admin</th>
                    <th className="px-4 py-3 text-center font-semibold text-[var(--text-tertiary)]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-[var(--border-light)]">
                      <td className="px-4 py-3 text-[var(--text-primary)]">{u.email}</td>
                      <td className="px-4 py-3 text-[var(--text-secondary)]">{u.displayName}</td>
                      <td className="px-4 py-3 text-center">{u.freeFixesUsed}/{u.freeFixesLimit}</td>
                      <td className="px-4 py-3 text-center font-semibold text-[var(--accent)]">{u.fixesRemaining}</td>
                      <td className="px-4 py-3 text-center">{u.totalPaidFixes}</td>
                      <td className="px-4 py-3 text-center">{u.isAdmin ? '✓' : '—'}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              const amount = prompt(`Set fixes remaining for ${u.email}:`, String(u.fixesRemaining));
                              if (amount !== null) handleAdjustFixes(u.id, parseInt(amount, 10) || 0);
                            }}
                            className="rounded bg-[var(--accent-light)] px-2 py-1 text-[10px] font-semibold text-[var(--accent)] hover:bg-[var(--accent-subtle)]"
                          >
                            Adjust Fixes
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && !isLoading && (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-[var(--text-muted)]">
                        No users found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ─── Coupons Tab ─── */}
        {activeTab === 'coupons' && (
          <div>
            {/* Create Coupon Form */}
            <form onSubmit={handleCreateCoupon} className="mb-6 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5">
              <h3 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">Create New Coupon</h3>
              <div className="grid gap-3 sm:grid-cols-4">
                <div>
                  <label className="mb-1 block text-[10px] font-medium text-[var(--text-tertiary)]">Code</label>
                  <input
                    type="text"
                    value={newCouponCode}
                    onChange={(e) => setNewCouponCode(e.target.value.toUpperCase())}
                    placeholder="FAMILY5"
                    required
                    className="w-full rounded-md border border-[var(--border)] px-3 py-2 font-[family-name:var(--font-mono)] text-xs uppercase outline-none focus:border-[var(--accent)]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-medium text-[var(--text-tertiary)]">Fixes Granted</label>
                  <input
                    type="number"
                    value={newCouponFixes}
                    onChange={(e) => setNewCouponFixes(parseInt(e.target.value, 10) || 1)}
                    min={1}
                    className="w-full rounded-md border border-[var(--border)] px-3 py-2 text-xs outline-none focus:border-[var(--accent)]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-medium text-[var(--text-tertiary)]">Max Redemptions</label>
                  <input
                    type="number"
                    value={newCouponMaxRedemptions}
                    onChange={(e) => setNewCouponMaxRedemptions(e.target.value)}
                    placeholder="Unlimited"
                    min={1}
                    className="w-full rounded-md border border-[var(--border)] px-3 py-2 text-xs outline-none focus:border-[var(--accent)]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-medium text-[var(--text-tertiary)]">Expires</label>
                  <input
                    type="date"
                    value={newCouponExpiry}
                    onChange={(e) => setNewCouponExpiry(e.target.value)}
                    className="w-full rounded-md border border-[var(--border)] px-3 py-2 text-xs outline-none focus:border-[var(--accent)]"
                  />
                </div>
              </div>
              <div className="mt-3 flex items-center gap-3">
                <button
                  type="submit"
                  className="rounded-md bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-white hover:bg-[var(--accent-hover)]"
                >
                  Create Coupon
                </button>
                {couponMessage && (
                  <span className="text-xs text-[var(--text-secondary)]">{couponMessage}</span>
                )}
              </div>
            </form>

            {/* Coupons Table */}
            <div className="overflow-x-auto rounded-lg border border-[var(--border)] bg-[var(--surface)]">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--surface-raised)]">
                    <th className="px-4 py-3 text-left font-semibold text-[var(--text-tertiary)]">Code</th>
                    <th className="px-4 py-3 text-center font-semibold text-[var(--text-tertiary)]">Fixes</th>
                    <th className="px-4 py-3 text-center font-semibold text-[var(--text-tertiary)]">Redeemed</th>
                    <th className="px-4 py-3 text-center font-semibold text-[var(--text-tertiary)]">Max</th>
                    <th className="px-4 py-3 text-center font-semibold text-[var(--text-tertiary)]">Expires</th>
                    <th className="px-4 py-3 text-center font-semibold text-[var(--text-tertiary)]">Status</th>
                    <th className="px-4 py-3 text-center font-semibold text-[var(--text-tertiary)]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {coupons.map((c) => (
                    <tr key={c.id} className="border-b border-[var(--border-light)]">
                      <td className="px-4 py-3 font-[family-name:var(--font-mono)] font-bold text-[var(--text-primary)]">{c.code}</td>
                      <td className="px-4 py-3 text-center">{c.freeFixesGranted}</td>
                      <td className="px-4 py-3 text-center">{c.timesRedeemed}</td>
                      <td className="px-4 py-3 text-center">{c.maxRedemptions ?? '∞'}</td>
                      <td className="px-4 py-3 text-center text-[var(--text-tertiary)]">
                        {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          c.isActive
                            ? 'bg-[var(--accent-light)] text-[var(--accent)]'
                            : 'bg-[var(--danger-light)] text-[var(--danger)]'
                        }`}>
                          {c.isActive ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleCoupon(c.id, c.isActive)}
                          className={`rounded px-2 py-1 text-[10px] font-semibold ${
                            c.isActive
                              ? 'bg-[var(--danger-light)] text-[var(--danger)] hover:bg-[var(--danger)]  hover:text-white'
                              : 'bg-[var(--accent-light)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white'
                          }`}
                        >
                          {c.isActive ? 'Disable' : 'Enable'}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {coupons.length === 0 && !isLoading && (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-[var(--text-muted)]">
                        No coupons created yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ─── Payments Tab ─── */}
        {activeTab === 'payments' && (
          <div className="overflow-x-auto rounded-lg border border-[var(--border)] bg-[var(--surface)]">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--surface-raised)]">
                  <th className="px-4 py-3 text-left font-semibold text-[var(--text-tertiary)]">User</th>
                  <th className="px-4 py-3 text-center font-semibold text-[var(--text-tertiary)]">Tier</th>
                  <th className="px-4 py-3 text-center font-semibold text-[var(--text-tertiary)]">Amount</th>
                  <th className="px-4 py-3 text-center font-semibold text-[var(--text-tertiary)]">Fixes</th>
                  <th className="px-4 py-3 text-center font-semibold text-[var(--text-tertiary)]">Status</th>
                  <th className="px-4 py-3 text-right font-semibold text-[var(--text-tertiary)]">Date</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-b border-[var(--border-light)]">
                    <td className="px-4 py-3 text-[var(--text-primary)]">{p.userEmail || p.userId.slice(0, 8)}</td>
                    <td className="px-4 py-3 text-center capitalize text-[var(--text-secondary)]">{p.tier}</td>
                    <td className="px-4 py-3 text-center font-semibold text-[var(--text-primary)]">
                      ${(p.amountCents / 100).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-center">{p.fixesPurchased}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        p.status === 'completed'
                          ? 'bg-[var(--accent-light)] text-[var(--accent)]'
                          : p.status === 'failed'
                            ? 'bg-[var(--danger-light)] text-[var(--danger)]'
                            : 'bg-[var(--gold-light)] text-[var(--gold)]'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-[var(--text-tertiary)]">
                      {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
                {payments.length === 0 && !isLoading && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-[var(--text-muted)]">
                      No payments yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
