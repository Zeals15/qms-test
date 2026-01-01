import { useEffect, useState } from "react";
import Layout from "../components/layout/Layout";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { Plus } from "lucide-react";

/* ================= TYPES ================= */

type Summary = {
  expired: number;
  expiring_today: number;
  expiring_soon: number;
  portfolio_value: number;
  followups_due_today: number;
  followups_overdue: number;

  won: number;
  lost: number;
  won_revenue: number;
};

type ActionQuotation = {
  id: number;
  quotation_no: string;
  company_name: string;
  valid_until: string;
  remaining_days: number;
  last_followup_at?: string | null;
  no_followup: number;
  salesperson_name?: string;
};

type FollowupDue = {
  id: number;
  quotation_id: number;
  quotation_no: string;
  company_name: string;
  followup_type: string;
  next_followup_date: string;
  salesperson_name?: string;
};

/* ================= UTILS ================= */

function getISTGreeting(): string {
  const now = new Date();
  const ist = new Date(now.getTime() + (5 * 60 + 30) * 60 * 1000);
  const hour = ist.getUTCHours();
  if (hour >= 5 && hour < 12) return "Good Morning";
  if (hour >= 12 && hour < 17) return "Good Afternoon";
  if (hour >= 17 && hour < 21) return "Good Evening";
  return "Good Night";
}



function formatDate(d?: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/* ================= COMPONENT ================= */

export default function Dashboard() {
  const navigate = useNavigate();

  const [summary, setSummary] = useState<Summary | null>(null);
  const [actions, setActions] = useState<ActionQuotation[]>([]);
  const [followups, setFollowups] = useState<FollowupDue[]>([]);
  const [user, setUser] = useState<any>(null);

  

  const isAdmin =
    user?.role &&
    ["admin", "administrator", "superadmin"].includes(
      String(user.role).toLowerCase()
    );

  /* ---------- Load user ---------- */
  useEffect(() => {
    api.getMe().then((r) => setUser(r?.user ?? r));
  }, []);

  /* ---------- Load dashboard data ---------- */
  useEffect(() => {
    if (!user) return;

    Promise.all([
      api.getDashboardSummary(),
      api.getDashboardActionQuotations(),
      api.getDashboardFollowupsDue(),
    ])
      .then(([s, a, f]) => {
        setSummary(s);
        setActions(a);
        setFollowups(f);
      })
      .catch((err) => {
        console.error("Dashboard fetch failed", err);
      });
  }, [user]);

  return (
    <Layout>
      <div className="max-w-[1500px] mx-auto px-6 py-8 space-y-10">

        {/* ================= HEADER ================= */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">
              {getISTGreeting()}, {user?.name || "User"}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Portfolio Value • ₹{(summary?.portfolio_value ?? 0).toLocaleString()}
            </p>
          </div>

          <button
            onClick={() => navigate("/create-quotation")}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md
                       bg-rose-600 text-white text-sm font-medium
                       hover:bg-rose-700 shadow-sm"
          >
            <Plus size={14} /> New Quotation
          </button>
        </div>

       {/* ================= KPI STRIP ================= */}
<div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-4">

  <AlertCard
    title="Expiring Today"
    value={summary?.expiring_today}
    tone="danger"
  />

  <AlertCard
    title="Expiring Soon"
    value={summary?.expiring_soon}
    tone="warning"
  />

  <AlertCard
    title="Follow-Ups Today"
    value={summary?.followups_due_today}
    tone="info"
  />

  <AlertCard
    title="Overdue Follow-Ups"
    value={summary?.followups_overdue}
    tone="danger"
  />

  <AlertCard
    title="Won Deals"
    value={summary?.won}
    tone="success"
  />

  <AlertCard
    title="Lost Deals"
    value={summary?.lost}
    tone="neutral"
  />

  <AlertCard
    title="Revenue Generated"
    value={`₹${(summary?.won_revenue ?? 0).toLocaleString()}`}
    tone="success"
  />
</div>

        {/* ================= MAIN GRID ================= */}
        <div className="grid lg:grid-cols-3 gap-8">

{/* ================= ACTION TABLE ================= */}
<div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-sm">
  {/* Header */}
  <div className="px-6 py-5 border-b border-slate-100">
    <h3 className="text-sm font-semibold text-slate-900">
      Quotations Requiring Action
    </h3>
    <p className="text-xs text-slate-500 mt-1">
      Items that need immediate attention to avoid revenue risk
    </p>
  </div>

  {/* Table */}
  <div className="overflow-x-auto">
    <table className="w-full text-sm">
      <thead className="bg-slate-50 text-xs text-slate-500">
        <tr>
          <th className="px-6 py-3 text-left w-10">Priority</th>
          <th className="px-6 py-3 text-left">Quotation</th>
          <th className="px-6 py-3 text-left">Customer</th>
          <th className="px-6 py-3 text-left">Validity</th>
          <th className="px-6 py-3 text-center w-20">Days</th>
          <th className="px-6 py-3 text-left">Last Follow-Up</th>
          <th className="px-6 py-3 text-left">Action</th>
          {isAdmin && <th className="px-6 py-3 text-left">Owner</th>}
        </tr>
      </thead>

      <tbody className="divide-y divide-slate-100">
        {actions.slice(0, 10).map((q) => {
          const isCritical = q.remaining_days <= 0;
          const isSoon = q.remaining_days <= 2;

          return (
            <tr
              key={q.id}
              onClick={() => navigate(`/quotations/${q.id}`)}
              className="hover:bg-slate-50 cursor-pointer transition-colors"
            >
              {/* Priority */}
              <td className="px-6 py-5">
                <span
                  className={`inline-block w-2.5 h-2.5 rounded-full
                    ${
                      isCritical
                        ? "bg-red-500"
                        : isSoon
                        ? "bg-amber-400"
                        : "bg-emerald-400"
                    }`}
                />
              </td>

              {/* Quotation No */}
              <td className="px-6 py-5 font-medium text-slate-900">
                {q.quotation_no}
              </td>

              {/* Customer */}
              <td className="px-6 py-5 text-slate-700">
                {q.company_name}
              </td>

              {/* Validity */}
              <td className="px-6 py-5 text-slate-600">
                {formatDate(q.valid_until)}
              </td>

              {/* Days */}
              <td className="px-6 py-5 text-center">
                <span
                  className={`inline-flex min-w-[36px] justify-center px-2 py-0.5 rounded-md text-xs font-medium
                    ${
                      isCritical
                        ? "bg-red-100 text-red-700"
                        : isSoon
                        ? "bg-amber-100 text-amber-700"
                        : "bg-emerald-100 text-emerald-700"
                    }`}
                >
                  {q.remaining_days}
                </span>
              </td>

              {/* Last Follow-Up */}
              <td className="px-6 py-5 text-slate-500">
                {formatDate(q.last_followup_at)}
              </td>

              {/* Action */}
              <td className="px-6 py-5">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium
                    ${
                      q.no_followup
                        ? "bg-rose-50 text-rose-700"
                        : "bg-slate-100 text-slate-700"
                    }`}
                >
                  {q.no_followup ? "Add Follow-Up" : "Review"}
                </span>
              </td>

              {/* Owner */}
              {isAdmin && (
                <td className="px-6 py-5 text-slate-500">
                  {q.salesperson_name}
                </td>
              )}
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
</div>


          {/* ================= FOLLOW-UPS PANEL ================= */}
          <div className="bg-white border rounded-xl p-6">
            <h3 className="text-sm font-semibold text-slate-800 mb-4">
              Follow-Ups Due Today
            </h3>

            <div className="space-y-4">
              {followups.map((f) => (
                <div
                  key={f.id}
                  className="border rounded-lg p-4 bg-white"
                >
                  <div className="text-sm font-medium text-slate-900">
                    {f.company_name}
                  </div>

                  <div className="text-xs text-slate-500 mt-0.5">
                    {f.quotation_no} • {f.followup_type}
                  </div>

                  {isAdmin && (
                    <div className="text-xs text-slate-400 mt-1">
                      {f.salesperson_name}
                    </div>
                  )}

                  <button
                    onClick={() =>
                      api.completeQuotationFollowup(f.id).then(async () => {
                        const [s, fups] = await Promise.all([
                          api.getDashboardSummary(),
                          api.getDashboardFollowupsDue(),
                        ]);
                        setSummary(s);
                        setFollowups(fups);
                      })
                    }
                    className="mt-3 inline-flex text-xs font-medium
                               text-green-700 bg-green-100
                               px-3 py-1 rounded-full hover:bg-green-200"
                  >
                    Mark Done
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ================= INSIGHTS ================= */}
        <div className="bg-slate-50 border rounded-xl p-6">
          <h4 className="text-sm font-semibold text-slate-800 mb-2">
            Insights
          </h4>
          <p className="text-sm text-slate-600 leading-relaxed">
            Deals without a follow-up in the first <strong>48 hours</strong> show
            significantly lower conversion rates. Prioritize early engagement to
            improve win probability.
          </p>
        </div>
      </div>
    </Layout>
  );
}

/* ================= SMALL COMPONENTS ================= */

function AlertCard({
  title,
  value,
  tone = "neutral",
}: {
  title: string;
  value?: number | string;
  tone?: "danger" | "warning" | "info" | "success" | "neutral";
}) {
 const toneMap: Record<string, string> = {
  danger: "border-red-200 bg-red-50 text-red-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  info: "border-blue-200 bg-blue-50 text-blue-700",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  neutral: "border-slate-200 bg-white text-slate-700",
};

  return (
    <div className={`rounded-xl border p-4 ${toneMap[tone]}`}>
      <div className="text-xs font-medium opacity-80">{title}</div>
      <div className="mt-1 text-2xl font-semibold">
       {value ?? 0}
      </div>
    </div>
  );
}
