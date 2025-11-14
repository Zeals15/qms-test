// src/pages/Dashboard.tsx
import React, { useEffect, useState, useRef } from 'react';
import Layout from '../components/layout/Layout';
import { FileText, BarChart2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';

type QuotationItem = { product_name?: string };

type Q = {
  id: number;
  quotation_no: string;
  customer_name: string;
  total_value: number | string;
  status: string;
  created_at: string;
  items?: QuotationItem[];
  product_summary?: string;
};

interface MetricCardProps {
  label: string;
  value: string;
  subtext: string;
  accentColor: 'yellow' | 'green' | 'blue' | 'purple' | 'rose';
}

const MetricCard: React.FC<MetricCardProps> = ({ label, value, subtext, accentColor }) => {
  const borderColor = {
    yellow: 'border-yellow-500',
    green: 'border-green-500',
    blue: 'border-blue-500',
    purple: 'border-purple-500',
    rose: 'border-rose-500'
  }[accentColor] || 'border-gray-500';

  const textColor = {
    yellow: 'text-yellow-600',
    green: 'text-green-600',
    blue: 'text-blue-600',
    purple: 'text-purple-600',
    rose: 'text-rose-600'
  }[accentColor] || 'text-gray-600';

  return (
    <div className={`bg-white rounded-lg p-4 border-l-4 ${borderColor} shadow-sm`}>
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">{label}</div>
        <div className={`text-xl font-semibold ${textColor}`}>{value}</div>
      </div>
      <div className={`text-xs ${textColor} mt-1`}>{subtext}</div>
    </div>
  );
};

export default function Dashboard() {
  const navigate = useNavigate();

  // metrics state
  const [totalQuotations, setTotalQuotations] = useState<number | null>(null);
  const [activeQuotations, setActiveQuotations] = useState<number | null>(null);
  const [pendingReview, setPendingReview] = useState<number | null>(null);
  const [averageValue, setAverageValue] = useState<number | null>(null);

  // recent table state
  const [recent, setRecent] = useState<Q[] | null>(null);
  const [loadingRecent, setLoadingRecent] = useState(false);

  // control polling
  const pollingIntervalMs = 30000; // 30 seconds (adjust as needed)
  const pollRef = useRef<number | null>(null);

  useEffect(() => {
    // initial load
    loadAll();

    // start poll
    pollRef.current = window.setInterval(() => {
      loadStats();    // only stats frequently
      loadRecent();   // refresh recent
    }, pollingIntervalMs);

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadAll() {
    await Promise.all([loadStats(), loadRecent()]);
  }

  // Try to fetch server-side computed stats; if not available, compute from full list
  async function loadStats() {
    try {
      // if api exposes a dedicated stats endpoint
      if (api.getQuotationStats) {
        const s = await api.getQuotationStats();
        // expected shape: { total, active, pendingReview, averageValue }
        setTotalQuotations(Number(s.total ?? 0));
        setActiveQuotations(Number(s.active ?? 0));
        setPendingReview(Number(s.pendingReview ?? 0));
        setAverageValue(Number(s.averageValue ?? 0));
        return;
      }
    } catch (err) {
      // ignore and fallback to compute from full list
      console.warn('getQuotationStats failed, will fallback to compute from full list', err);
    }

    // fallback: fetch full quotations and compute
    try {
      const all: Q[] = await api.getQuotations();
      computeAndSetStats(all || []);
    } catch (err) {
      console.error('Failed computing stats from quotations', err);
    }
  }

  function computeAndSetStats(list: Q[]) {
    const total = list.length;
    const active = list.filter(q => q.status && q.status.toLowerCase().includes('approved')).length;
    const pending = list.filter(q => q.status && q.status.toLowerCase().includes('pending')).length;

    // average value: parse numbers safely
    const values = list.map(q => {
      const v = typeof q.total_value === 'number' ? q.total_value : Number(String(q.total_value || '0').replace(/[^0-9.-]+/g, ''));
      return Number.isFinite(v) ? v : 0;
    });
    const avg = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;

    setTotalQuotations(total);
    setActiveQuotations(active);
    setPendingReview(pending);
    setAverageValue(Math.round(avg));
  }

  async function loadRecent() {
    setLoadingRecent(true);
    try {
      const data: Q[] = await api.getQuotations();
      // sort by created_at desc (try to parse dates), then slice top 5
      const sorted = (data || []).slice().sort((a, b) => {
        const ta = new Date(a.created_at).getTime() || 0;
        const tb = new Date(b.created_at).getTime() || 0;
        return tb - ta;
      });
      setRecent(sorted.slice(0, 5));
      // if stats not set yet, compute from full list
      if (totalQuotations === null) computeAndSetStats(data || []);
    } catch (err) {
      console.error(err);
      setRecent([]);
    } finally {
      setLoadingRecent(false);
    }
  }

  // small helper for product list (copied from your Quotation page)
  function productListText(row: Q) {
    if (row.items && row.items.length) {
      const names = row.items.map((i) => i.product_name || '').filter(Boolean);
      if (!names.length) return '-';
      if (names.length <= 2) return names.join(', ');
      return `${names.slice(0, 2).join(', ')} +${names.length - 2} more`;
    }
    if (row.product_summary) return row.product_summary;
    return '-';
  }

  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // UI labels for metrics (show loading placeholders)
  const showOrLoading = (val: number | null, formatter?: (n:number)=>string) => {
    if (val === null) return '—';
    return formatter ? formatter(val) : String(val);
  };

  return (
    <Layout>
      <div className="space-y-6 p-6">
        {/* Welcome Header */}
        <div className="rounded-2xl bg-gradient-to-r from-rose-500 via-fuchsia-500 to-indigo-600 p-8">
          <h1 className="text-2xl font-semibold text-white mb-2">Welcome to Prayosha Automation</h1>
          <p className="text-white/90">Professional Quotation Management System</p>
          <div className="text-sm mt-4 text-white/80">
            Manage your quotations efficiently and professionally
          </div>
          <div className="text-sm mt-2 text-white/80">
            Today is {formattedDate}
          </div>
        </div>

        {/* Primary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard label="Total Quotations" value={showOrLoading(totalQuotations)} subtext="+18.7% increase from last month" accentColor="yellow" />
          <MetricCard label="Active Quotations" value={showOrLoading(activeQuotations)} subtext="success rate" accentColor="green" />
          <MetricCard label="Pending Review" value={showOrLoading(pendingReview)} subtext="require immediate attention" accentColor="purple" />
          <MetricCard label="Average Value" value={averageValue === null ? '—' : `₹${Number(averageValue).toLocaleString()}`} subtext="monthly average" accentColor="blue" />
        </div>

        {/* secondary cards retained (static or you can wire similarly) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard label="Pending Approval" value="1" subtext="Awaiting review" accentColor="yellow" />
          <MetricCard label="Approved Today" value="0" subtext="Ready to send" accentColor="green" />
          <MetricCard label="This Week" value="1" subtext="Weekly total" accentColor="blue" />
          <MetricCard label="Conversion Rate" value="0%" subtext="+8% improvement" accentColor="purple" />
        </div>

        {/* ... keep the rest of your dashboard and recent table below (unchanged) */}
        {/* Call to Action */}
        <div className="rounded-2xl bg-gradient-to-r from-rose-500 to-rose-400 p-8 text-white">
          <h2 className="text-xl font-semibold mb-2">See the System in Action</h2>
          <p className="text-white/90 mb-4">Preview a sample quotation with professional formatting and layout</p>
          <button className="bg-white text-rose-500 px-4 py-2 rounded-lg hover:bg-white/90 inline-flex items-center gap-2">
            View Sample Quotation →
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <button onClick={() => { navigate('/quotations'); }} className="w-full py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-lg flex items-center justify-center gap-2 text-base font-medium">
                <FileText size={20} />
                New Quotation
              </button>
              <button onClick={() => { navigate('/reports'); }} className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-lg flex items-center justify-center gap-2 text-base font-medium">
                <BarChart2 size={20} />
                View Reports
              </button>
            </div>
          </div>

          {/* Recent Quotations */}
          <div className="lg:col-span-3">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Recent Quotations</h3>
              <button onClick={() => navigate('/quotations')} className="text-rose-500 hover:text-rose-600 text-sm">View All</button>
            </div>

            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <table className="min-w-full">
                <thead className="bg-[#1a237e] text-white">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Quote ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {loadingRecent && (
                    <tr>
                      <td colSpan={5} className="px-6 py-6 text-center text-sm">Loading recent quotations...</td>
                    </tr>
                  )}

                  {!loadingRecent && recent && recent.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-6 text-center text-sm">No recent quotations</td>
                    </tr>
                  )}

                  {!loadingRecent && recent && recent.map(r => (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm">{r.quotation_no}</td>
                      <td className="px-6 py-4 text-sm">{r.customer_name}</td>
                      <td className="px-6 py-4 text-sm text-right">₹{Number(r.total_value).toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          r.status?.toLowerCase().includes('pending') ? 'bg-yellow-100 text-yellow-800' :
                          r.status?.toLowerCase().includes('approved') ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-1">
                        <button className="text-gray-700 hover:text-gray-900 px-2" onClick={() => navigate(`/quotations/${r.id}`)}>View</button>
                        <button className="text-gray-700 hover:text-gray-900 px-2" onClick={() => navigate(`/quotations/edit/${r.id}`)}>Edit</button>
                        <button className="text-gray-700 hover:text-gray-900 px-2">PDF</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Help Section */}
        <div className="bg-rose-100 rounded-lg p-4">
          <h3 className="text-rose-700 font-semibold mb-1">Need Help?</h3>
          <p className="text-rose-600 text-sm">Contact support for assistance</p>
        </div>
      </div>
    </Layout>
  );
}
