// src/pages/Quotations.tsx
import { useEffect, useMemo, useState, useRef } from "react";
import { api } from "../api";
import { useNavigate } from "react-router-dom";
import Layout from "../components/layout/Layout";
import { toast } from "react-toastify";
import { Trash2, Edit, Eye } from "lucide-react";
import { formatDateDDMMYYYY } from "../utils/date";

/**
 * QuotationList — improved UI:
 * - Uses Tailwind utility classes
 * - Search + filters + export + pagination
 * - Table with sticky header, zebra rows, status pills, and row action menu
 *
 * Note: keeps original API calls (api.getQuotations(), api.getProducts(), api.getCustomers(), api.deleteQuotation)
 */

type QuotationItem = {
  product_name?: string;
  product?: { name?: string };
  name?: string;
  product_title?: string;
  product_id?: number;
  productId?: number;
};

type Q = {
  id: number;
  quotation_no: string;
  total_value?: string | number;
  status?: string;
  created_at?: string;

  validity?: {
    quotation_date?: string;
    validity_days?: number;
    valid_until?: string;
    remaining_days?: number;
    validity_state?: "valid" | "due" | "overdue" | "expired";
  };

  customer?: {
    id?: number;
    company_name?: string;
    gstin?: string;
  } | null;

  contact?: {
    id?: number;
    name?: string;
    phone?: string;
    email?: string;
  } | null;

  meta?: {
    items?: any[];
    salesperson?: {
      name?: string;
    } | string;
    sales_person?: {
      name?: string;
    } | string;
  };

  product_summary?: string;

  items?: QuotationItem[] | string | null;


};


function ValidityBadge({
  state,
  remainingDays,
}: {
  state?: "valid" | "due" | "overdue" | "expired";
  remainingDays?: number;
}) {
  if (!state) return null;

  const map: Record<string, string> = {
    valid: "bg-green-100 text-green-700",
    due: "bg-yellow-100 text-yellow-700",
    overdue: "bg-orange-100 text-orange-700",
    expired: "bg-red-100 text-red-700",
  };

  const label =
    state === "valid"
      ? "Valid"
      : state === "due"
        ? `Due (${remainingDays ?? 0}d)`
        : state === "overdue"
          ? "Overdue"
          : "Expired";

  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${map[state]}`}
    >
      {label}
    </span>
  );
}

function formatCurrency(v?: number | string) {
  const n = typeof v === "number" ? v : Number(String(v || "0").replace(/[^0-9.-]+/g, ""));
  if (!Number.isFinite(n)) return "₹0";
  return `₹${n.toLocaleString()}`;
}



export default function Quotations() {
  const navigate = useNavigate();

  const [rows, setRows] = useState<Q[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [productsMap, setProductsMap] = useState<Record<string, string>>({});
  //const [customersMap, setCustomersMap] = useState<Record<string, string>>({});

  // UI state
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "draft" | "pending" | "won" | "lost">("all");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");

  const fromDateRef = useRef<HTMLInputElement>(null);
  const toDateRef = useRef<HTMLInputElement>(null);



  // load lookups
  useEffect(() => {
    let mounted = true;
    async function loadLookups() {
      try {
        const [pRes] = await Promise.allSettled([api.getProducts(),]);
        if (!mounted) return;

        if (pRes.status === "fulfilled") {
          const pdata = Array.isArray(pRes.value) ? pRes.value : pRes.value?.data ?? pRes.value ?? [];
          const m: Record<string, string> = {};
          (pdata || []).forEach((it: any) => {
            const id = it.id ?? it._id ?? it.ID;
            const name = it.name ?? it.product_name ?? it.title;
            if (id != null) m[String(id)] = String(name ?? id);
          });
          setProductsMap(m);
        }


      } catch (err) {
        console.warn("lookup load failed", err);
      }
    }
    loadLookups();
    return () => {
      mounted = false;
    };
  }, []);

  // load rows
  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load() {
    setLoading(true);
    try {
      const data = await api.getQuotations();
      setRows(Array.isArray(data) ? data : data?.data ?? []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load quotations");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: number, status?: string) {
    const isDecided = ["won", "lost"].includes(String(status || "").toLowerCase());
    const ok = confirm(
      isDecided
        ? "This quotation has been marked as Won/Lost. Continuing will force-delete the quotation (admin only). This action cannot be undone. Proceed?"
        : "Are you sure you want to delete this quotation? This action cannot be undone."
    );
    if (!ok) return;

    try {
      await api.deleteQuotation(id, { force: isDecided });
      setRows((prev) => prev.filter((r) => r.id !== id));
      toast.success("Quotation deleted");
    } catch (err: any) {
      console.error("Delete failed", err);
      const body = err?.body || err?.message || String(err);
      if (String(body).toLowerCase().includes("not found")) {
        toast.error("Quotation not found");
        await load();
        return;
      }
      if (err?.status === 403) {
        toast.error("You are not allowed to delete decided quotations.");
        return;
      }
      toast.error("Failed to delete quotation");
    }
  }


  function rowSearchText(row: Q): string {
    return [
      row.quotation_no,
      row.customer?.company_name,
      productListText(row),
      salespersonText(row),
      contactPersonText(row),
      row.status,
      row.total_value,
      row.validity?.validity_state,
      row.created_at
        ? new Date(row.created_at).toLocaleDateString()
        : "",
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
  }

  // robust items parsing (string or array)
  function resolveItems(row: Q): QuotationItem[] {
    const raw = (row as any).items;
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    if (typeof raw === "string") {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      } catch (_) {
        // not JSON, return as single string fallback
        return [{ name: String(raw) } as any];
      }
    }
    if (row.meta && Array.isArray((row.meta as any).items)) return (row.meta as any).items;
    return [];
  }

  function productListText(row: Q) {
    const items = resolveItems(row);
    const names: string[] = [];
    for (const it of items) {
      if (!it) continue;
      if (typeof it.product_name === "string" && it.product_name.trim()) {
        names.push(it.product_name.trim());
        continue;
      }
      if (it.product && typeof it.product.name === "string" && it.product.name.trim()) {
        names.push(it.product.name.trim());
        continue;
      }
      if (typeof it.name === "string" && it.name.trim()) {
        names.push(it.name.trim());
        continue;
      }
      if (typeof it.product_title === "string" && it.product_title.trim()) {
        names.push(it.product_title.trim());
        continue;
      }
      const pid = (it as any).product_id ?? (it as any).productId ?? (it as any).id ?? (it as any)._id;
      if (pid != null && productsMap[String(pid)]) {
        names.push(productsMap[String(pid)]);
        continue;
      }
      if (typeof it === "string" && (it as any).trim()) {
        names.push((it as any).trim());
        continue;
      }
      try {
        const j = JSON.stringify(it);
        if (j && j !== "{}" && j.length < 60) names.push(j);
      } catch (_) { }
    }

    if (!names.length) {
      if (row.product_summary && String(row.product_summary).trim()) return row.product_summary;
      return "-";
    }
    if (names.length <= 2) return names.join(", ");
    return `${names.slice(0, 2).join(", ")} +${names.length - 2} more`;
  }

  function salespersonText(row: Q) {
    const anyRow = row as any;

    // 1️⃣ Direct backend alias (PRIMARY, always prefer this)
    if (typeof anyRow.salesperson_name === "string" && anyRow.salesperson_name.trim()) {
      return anyRow.salesperson_name.trim();
    }

    // 2️⃣ Nested salesperson object (future-proof)
    if (anyRow.salesperson && typeof anyRow.salesperson.name === "string" && anyRow.salesperson.name.trim()) {
      return anyRow.salesperson.name.trim();
    }

    // 3️⃣ Legacy / alternate naming (controlled & explicit)
    const legacyCandidates = [
      anyRow.sales_person,
      anyRow.sales_personnel,
      anyRow.sales_rep,
      anyRow.owner,
    ];

    for (const c of legacyCandidates) {
      if (!c) continue;

      if (typeof c === "string" && c.trim()) {
        return c.trim();
      }

      if (typeof c === "object" && typeof c.name === "string" && c.name.trim()) {
        return c.name.trim();
      }
    }

    // 4️⃣ Snapshot / meta fallback (optional, safe)
    if (anyRow.meta && typeof anyRow.meta === "object") {
      const m = anyRow.meta.salesperson || anyRow.meta.sales_person;
      if (typeof m === "string" && m.trim()) return m.trim();
      if (m && typeof m.name === "string" && m.name.trim()) return m.name.trim();
    }

    // ❌ NO customer fallback — EVER
    return "-";
  }
  function contactPersonText(row: Q) {
    return row.contact?.name || "-";
  }


  // filtered & paginated
  const filtered = useMemo(() => {
    let list = rows.slice();

    // STATUS FILTER
    if (statusFilter !== "all") {
      list = list.filter(
        (r) => (r.status || "").toLowerCase() === statusFilter
      );
    }

    // DATE FILTER
    if (fromDate) {
      const from = new Date(fromDate);
      from.setHours(0, 0, 0, 0);

      list = list.filter((r) => {
        if (!r.created_at) return false;
        return new Date(r.created_at) >= from;
      });
    }

    if (toDate) {
      const to = new Date(toDate);
      to.setHours(23, 59, 59, 999);

      list = list.filter((r) => {
        if (!r.created_at) return false;
        return new Date(r.created_at) <= to;
      });
    }

    // GLOBAL SEARCH
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((r) => rowSearchText(r).includes(q));
    }

    return list;
  }, [rows, statusFilter, query, fromDate, toDate]);


  const pageCount = Math.max(1, Math.ceil(filtered.length / perPage));
  useEffect(() => {
    if (page > pageCount) setPage(1);
  }, [pageCount, page]);

  const pageSlice = filtered.slice((page - 1) * perPage, page * perPage);



  // small skeleton row
  const SkeletonRow = () => (
    <tr>
      <td colSpan={10} className="p-6">
        <div className="animate-pulse flex gap-4 items-center">
          <div className="h-4 bg-slate-200 rounded w-48" />
          <div className="h-4 bg-slate-200 rounded w-32" />
          <div className="h-4 bg-slate-200 rounded w-40" />
          <div className="h-4 bg-slate-200 rounded w-20" />
        </div>
      </td>
    </tr>
  );

  return (
    <Layout>
      <div className="max-w-full px-6 pb-8">
        {/* Header */}
        <div className="flex items-center justify-between py-6">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Quotations</h2>
            <p className="text-sm text-slate-500 mt-1">Manage quotations, export data, and review statuses</p>
          </div>

          <div className="flex items-center gap-3">


            <button
              onClick={() => navigate("/create-quotation")}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#f45f57] to-[#dc3f35] text-white shadow-lg text-sm hover:opacity-95"
              title="Create new quotation"
            >
              + New Quotation
            </button>
          </div>
        </div>

        {/* ================= CONTROLS ================= */}
        <div className="bg-white rounded-xl border border-slate-100 p-5 mb-6 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">

            {/* SEARCH */}
            <div className="lg:col-span-5">
              <label htmlFor="search" className="text-xs font-medium text-slate-500 mb-1 block">
                Search
              </label>
              <input
                id="search"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
                placeholder="Search quotation, customer, product, salesperson, amount..."
                className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm
                   focus:outline-none focus:ring-2 focus:ring-slate-200"
              />
            </div>

            {/* STATUS FILTER */}
            <div className="lg:col-span-2">
              <label htmlFor="status" className="text-xs font-medium text-slate-500 mb-1 block">
                Status
              </label>
              <select
                id="status"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as any);
                  setPage(1);
                }}
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm"
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="pending">Pending</option>
                <option value="won">Won</option>
                <option value="lost">Lost</option>
              </select>
            </div>

            {/* FROM DATE */}
            <div
              className="lg:col-span-2 cursor-pointer"
              onClick={() => fromDateRef.current?.showPicker?.() || fromDateRef.current?.focus()}
            >
              <label className="text-xs font-medium text-slate-500 mb-1 block">
                From Date
              </label>

              <input
                ref={fromDateRef}
                type="date"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value);
                  setPage(1);
                }}
                className="
      w-full rounded-lg border border-slate-200
      px-3 py-2.5 text-sm
      cursor-pointer
      focus:outline-none focus:ring-2 focus:ring-slate-200
    "
              />
            </div>

            {/* TO DATE */}
            <div
              className="lg:col-span-2 cursor-pointer"
              onClick={() => toDateRef.current?.showPicker?.() || toDateRef.current?.focus()}
            >
              <label className="text-xs font-medium text-slate-500 mb-1 block">
                To Date
              </label>

              <input
                ref={toDateRef}
                type="date"
                value={toDate}
                onChange={(e) => {
                  setToDate(e.target.value);
                  setPage(1);
                }}
                className="
      w-full rounded-lg border border-slate-200
      px-3 py-2.5 text-sm
      cursor-pointer
      focus:outline-none focus:ring-2 focus:ring-slate-200
    "
              />
            </div>

            {/* PER PAGE + CLEAR */}
            <div className="lg:col-span-1 flex flex-col items-end gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Per page</span>
                <select
                  value={perPage}
                  onChange={(e) => setPerPage(Number(e.target.value))}
                  className="rounded-lg border border-slate-200 px-2 py-2 text-sm"
                >
                  <option value={8}>8</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>

              {(query || statusFilter !== "all" || fromDate || toDate) && (
                <button
                  onClick={() => {
                    setQuery("");
                    setStatusFilter("all");
                    setFromDate("");
                    setToDate("");
                    setPage(1);
                  }}
                  className="text-xs text-slate-500 hover:text-slate-700 hover:underline"
                >
                  Clear filters
                </button>
              )}
            </div>

          </div>
        </div>


        {/* Table panel */}
        <div className="bg-white rounded-lg shadow overflow-hidden border border-slate-100">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-white sticky top-0 z-10">
                <tr className="text-slate-600">
                  <th className="px-6 py-3 text-left font-medium">Quote No.</th>
                  <th className="px-6 py-3 text-left font-medium">Date</th>
                  <th className="px-6 py-3 text-left font-medium">Customer</th>
                  <th className="px-6 py-3 text-left font-medium">Products</th>
                  <th className="px-6 py-3 text-left font-medium">Salesperson</th>
                  <th className="px-6 py-3 text-right font-medium">Amount</th>
                  <th className="px-6 py-3 text-center font-medium">Status</th>
                  <th className="px-6 py-3 text-center font-medium">Validity</th>
                  <th className="px-6 py-3 text-left font-medium">Contact Person</th>
                  <th className="px-6 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>

              <tbody>
                {loading && <SkeletonRow />}

                {!loading &&
                  pageSlice.map((r) => (
                    <tr key={r.id} className="even:bg-slate-50/60 hover:bg-slate-50">
                      <td className="px-6 py-4 whitespace-nowrap text-slate-800">{r.quotation_no}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-slate-600">{r.created_at ? formatDateDDMMYYYY(r.created_at) : "-"}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-slate-700">{r.customer?.company_name || "-"}</td>
                      <td className="px-6 py-4 max-w-md truncate text-slate-600" title={resolveItems(r).map((i) => i?.product_name ?? i?.name ?? i?.product?.name ?? "").filter(Boolean).join(", ")}>
                        {productListText(r)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-slate-600">{salespersonText(r)}</td>

                      <td className="px-6 py-4 whitespace-nowrap text-right text-slate-700 font-medium">{formatCurrency(r.total_value)}</td>

                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span
                          role="status"
                          aria-label={`Status ${r.status}`}
                          className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-semibold ${String(r.status).toLowerCase() === "won"
                            ? "bg-green-50 text-green-700"
                            : String(r.status).toLowerCase() === "lost"
                              ? "bg-red-50 text-red-700"
                              : String(r.status).toLowerCase() === "pending"
                                ? "bg-blue-50 text-blue-700"
                                : "bg-amber-50 text-amber-700"
                            }`}
                        >
                          {r.status || "-"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <ValidityBadge
                          state={r.validity?.validity_state}
                          remainingDays={r.validity?.remaining_days}
                        />
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-left text-slate-700">
                        {contactPersonText(r)}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="inline-flex items-center gap-2">
                          <button onClick={() => navigate(`/quotations/${r.id}`)} title="View" className="text-sky-600 hover:underline inline-flex items-center gap-1 text-sm">
                            <Eye size={14} /> View
                          </button>

                          <button
                            onClick={() => {
                              if (r.validity?.validity_state !== "expired") {
                                navigate(`/quotations/${r.id}/edit`);
                              }
                            }}
                            disabled={r.validity?.validity_state === "expired"}
                            title={
                              r.validity?.validity_state === "expired"
                                ? "Quotation expired. Re-issue required."
                                : "Edit"
                            }
                            className={`inline-flex items-center gap-1 border px-2 py-1 rounded text-sm transition ${r.validity?.validity_state === "expired"
                              ? "border-slate-200 text-slate-400 cursor-not-allowed bg-slate-50"
                              : "border-slate-200 hover:shadow-sm hover:bg-slate-50"
                              }`}
                          >
                            <Edit size={14} /> Edit
                          </button>

                          <button onClick={() => handleDelete(r.id, r.status)} title="Delete" className="inline-flex items-center gap-1 text-sm text-rose-600 hover:underline">
                            <Trash2 size={14} /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                {!loading && filtered.length === 0 && (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-slate-500">
                      No quotations found. <br></br>
                      <button
                        onClick={() => navigate("/create-quotation")}
                        className="
    inline-flex items-center gap-2
    px-4 py-2
    rounded-full
    bg-gradient-to-r from-[#f45f57] to-[#dc3f35]
    text-white text-sm font-medium
    shadow-md
    hover:shadow-lg hover:brightness-105
    transition-all duration-150
    focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#f45f57]
  "
                      >
                        + Create Quotation
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Footer: pagination */}
          <div className="px-4 py-3 border-t border-slate-100 bg-white flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="text-sm text-slate-600">
              Showing <span className="font-medium">{(page - 1) * perPage + 1}</span>–<span className="font-medium">{Math.min(page * perPage, filtered.length)}</span> of <span className="font-medium">{filtered.length}</span>
            </div>

            <div className="flex items-center gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 border rounded disabled:opacity-50">
                Prev
              </button>

              <div className="px-3 py-1 rounded border bg-slate-50 text-sm">
                {page} / {pageCount}
              </div>

              <button onClick={() => setPage((p) => Math.min(pageCount, p + 1))} disabled={page === pageCount} className="px-3 py-1 border rounded disabled:opacity-50">
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
