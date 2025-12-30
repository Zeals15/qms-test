// File: src/pages/QuotationEdit.tsx
import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "../components/layout/Layout";
import { api } from "../api";
import VersionCommentModal from "../components/VersionCommentModal";
import { Calendar } from "lucide-react";


export default function QuotationEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);


  // Version comment modal state
  const [versionCommentModalOpen, setVersionCommentModalOpen] = useState(false);
  const [pendingSavePayload, setPendingSavePayload] = useState<any>(null);
  const [originalVersion, setOriginalVersion] = useState<string>("0.1");
  const dateInputRef = useRef<HTMLInputElement>(null);


  const [reissue, setReissue] = useState(false);
 const [newValidityDays, setNewValidityDays] = useState<number>(30);

  const openCalendar = () => {
    dateInputRef.current?.showPicker();
  };



  const [validityState, setValidityState] = useState<
    "valid" | "due" | "overdue" | "expired" | null
  >(null);


  // ✅ FIX 1: items MUST be array, not string
  const [data, setData] = useState<any>({
    quotation_no: "",
    customer_id: null,
    customer_location_id: null,
    customer_contact_id: null,
    quotation_date: "",
    validity_days: "",
    payment_terms: "",
    status: "draft",
    items: [],
    notes: "",
    terms: "",
  });


  const [productList, setProductList] = useState<any[]>([]);

  const [customerSnapshot, setCustomerSnapshot] = useState<any>(null);



  const [addProductOpen, setAddProductOpen] = useState(false);
  const [productSubmitting, setProductSubmitting] = useState(false);

  const [productForm, setProductForm] = useState({
    name: "",
    unit_price: "",
    tax_rate: "",
    uom: "NOS",
    description: "",
  });


  const [activeProductRow, setActiveProductRow] = useState<number | null>(null);
  const [productSearch, setProductSearch] = useState("");

  /* ================= CUSTOMER MODAL STATE ================= */



  useEffect(() => {
    if (!id) return;

    (async () => {
      setLoading(true);
      try {
        /* ================= LOAD PRODUCTS ================= */
        const prodResp: any = await api.getProducts();
        const prods = Array.isArray(prodResp) ? prodResp : prodResp?.data ?? [];

        const m: Record<string, string> = {};
        const list: any[] = [];

        prods.forEach((p: any) => {
          const pid = p?.id ?? p?._id;
          if (pid != null) {
            m[String(pid)] = p.name ?? p.product_name ?? "";
            list.push({
              id: String(pid),
              name: p.name ?? p.product_name ?? "",
              description: p.description ?? "",
              unit_price: Number(p.unit_price ?? p.price ?? 0),
              tax_rate: Number(p.tax_rate ?? p.tax ?? 0),
              uom: p.uom ?? "NOS",
            });
          }
        });

        setProductList(list);

        /* ================= LOAD CUSTOMERS (ADD HERE) ================= */


        /* ================= LOAD QUOTATION ================= */
        const res: any = await api.getQuotation(id);
        const q = res?.quotation ?? res ?? {};

        setValidityState(q.validity_state ?? null);
        setNewValidityDays(q.validity_days ?? 30);

        setCustomerSnapshot(q.customer_snapshot ?? null);
        let items: any[] = [];
        if (Array.isArray(q.items)) items = q.items;
        else if (typeof q.items === "string" && q.items.trim()) {
          try {
            items = JSON.parse(q.items);
          } catch {
            items = [];
          }
        }

        const normalized = items.map((it: any) => {
          const productId = it.product_id ?? it.productId ?? null;
          const prodInfo = list.find(p => String(p.id) === String(productId));

          return {
            ...it,
            product_id: productId ? String(productId) : null,
            name: it.product_name ?? it.name ?? prodInfo?.name ?? "",
            description: it.description ?? prodInfo?.description ?? "",
            qty: Number(it.qty ?? it.quantity ?? 1),
            unit_price: Number(it.unit_price ?? prodInfo?.unit_price ?? 0),
            tax_rate: Number(it.tax_rate ?? prodInfo?.tax_rate ?? 0),
            uom: it.uom ?? prodInfo?.uom ?? "NOS",
            id: it.id ?? it._id,
          };
        });

        setData({
          quotation_no: q.quotation_no ?? "",
          customer_id: q.customer?.id ?? null,
          customer_location_id: q.location?.id ?? null,
          customer_contact_id: q.contact?.id ?? null,
          quotation_date: new Date().toISOString().slice(0, 10),
          validity_days: q.validity_days ?? "",
          payment_terms: q.payment_terms ?? "",
          status: q.status ?? "draft",
          items: normalized,
          terms: q.terms ?? "",
          notes: q.notes ?? "",
        });

        setOriginalVersion(q.version ?? "0.1");



      } catch (e) {
        console.error("Failed to load quotation", e);
        alert("Failed to load quotation");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const updateItem = (idx: number, patch: any) => {
    setData((prev: any) => {
      const items = [...prev.items];
      items[idx] = { ...items[idx], ...patch };
      return { ...prev, items };
    });
  };

  const addItem = () =>
    setData((prev: any) => ({
      ...prev,
      items: [...prev.items,
      {
        name: "",
        product_id: null,
        description: "",
        qty: 1,
        unit_price: 0,
        tax_rate: 0,
        discount_percent: 0,
        uom: "NOS"
      }],
    }));

  const removeItem = (idx: number) =>
    setData((prev: any) => {
      const items = [...prev.items];
      items.splice(idx, 1);
      return { ...prev, items };
    });

  const subtotal = data.items.reduce((sum: number, it: any) => {
    return sum + it.qty * it.unit_price;
  }, 0);

  const totalDiscount = data.items.reduce((sum: number, it: any) => {
    const lineTotal = it.qty * it.unit_price;
    const discount = lineTotal * (Number(it.discount_percent || 0) / 100);
    return sum + discount;
  }, 0);

  const taxTotal = data.items.reduce((sum: number, it: any) => {
    const lineTotal = it.qty * it.unit_price;
    const discount = lineTotal * (Number(it.discount_percent || 0) / 100);
    const taxable = lineTotal - discount;
    const tax = taxable * (Number(it.tax_rate || 0) / 100);
    return sum + tax;
  }, 0);

  const grandTotal = subtotal - totalDiscount + taxTotal;

  async function handleSave() {
    // 1️⃣ Integrity check
    if (!data.customer_id) {
      alert("Customer data missing. This quotation may be corrupted.");
      return;
    }

    // 2️⃣ Validity enforcement
    if (validityState === "expired" && !reissue) {
      alert("This quotation has expired. Re-issue is required.");
      return;
    }

    // 3️⃣ Re-Issue flow (FORK)
    if (reissue) {
      try {
        setSaving(true);

        const res = await api.reissueQuotation(Number(id), {
          validity_days: newValidityDays,
        });

        navigate(`/quotations/${res.new_quotation_id}`);
        return;
      } catch (e) {
        console.error("Re-issue failed", e);
        alert("Failed to re-issue quotation");
        setSaving(false);
        return;
      }
    }



    try {
      const itemsPayload = data.items
        .filter((it: any) => it.product_id && it.qty > 0)
        .map((it: any) => ({
          id: it.id,
          product_id: Number(it.product_id),
          product_name: it.name,
          description: it.description, // ✅ SEND
          qty: Number(it.qty || 0),
          unit_price: Number(it.unit_price || 0),
          discount_percent: Number(it.discount_percent || 0),
          tax_rate: Number(it.tax_rate || 0),
          uom: it.uom,
        }));

      const payload = {
        quotation_no: data.quotation_no,
        customer_id: data.customer_id,
        customer_location_id: data.customer_location_id,
        customer_contact_id: data.customer_contact_id,
        quotation_date: data.quotation_date?.split("T")[0],
        validity_days: data.validity_days,
        payment_terms:
          typeof data.payment_terms === "string" &&
            data.payment_terms.trim()
            ? data.payment_terms.trim()
            : null,
        status: data.status,
        items: itemsPayload,
        notes: data.notes,
        terms: data.terms,
        total_value: grandTotal,
      };

      function bumpVersion(version: string) {
        const v = parseFloat(version);
        if (isNaN(v)) return "0.1";
        return (Math.round((v + 0.1) * 10) / 10).toFixed(1);
      }

      const newVersion = bumpVersion(originalVersion);

      // Show modal only for EDIT (not re-issue)
      if (newVersion !== originalVersion) {
        setPendingSavePayload(payload);
        setVersionCommentModalOpen(true);
        return;
      }

      // Check if version will change
      if (newVersion !== originalVersion) {
        // Show modal for version comment
        setPendingSavePayload(payload);
        setVersionCommentModalOpen(true);
        return;
      }

      // No version change, save directly
      await performSave(payload, null);
    } catch (e) {
      console.error("Save failed", e);
      alert("Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function performSave(payload: any, versionComment: string | null) {
    setSaving(true);
    try {
      if (versionComment) {
        payload.versionComment = versionComment;
      }
      await api.updateQuotation(Number(id), payload);
      alert("Saved successfully");
      navigate(`/quotations/${Number(id)}`);
    } catch (e) {
      console.error("Save failed", e);
      alert("Save failed");
      setSaving(false);
    }
  }

  function handleVersionCommentSubmit(comment: string) {
    setVersionCommentModalOpen(false);
    if (pendingSavePayload) {
      performSave(pendingSavePayload, comment);
    }
  }

  // ================= SUBMIT CUSTOMER FROM QUOTATION =================


  // ================= SUBMIT PRODUCT FROM QUOTATION =================
  async function submitProductFromQuotation() {
    if (!productForm.name.trim()) {
      alert("Product name is required");
      return;
    }

    if (!productForm.description.trim()) {
      alert("Product description is required");
      return;
    }

    try {
      setProductSubmitting(true);

      const res: any = await api.addProduct({
        name: productForm.name,
        unit_price: Number(productForm.unit_price || 0),
        tax_rate: Number(productForm.tax_rate || 0),
        uom: productForm.uom,
        description: productForm.description,
      });

      const newProduct = res?.product ?? res;

      const normalizedProduct = {
        id: String(newProduct.id ?? newProduct._id),
        name: newProduct.name,
        description: newProduct.description ?? "",
        unit_price: Number(newProduct.unit_price ?? 0),
        tax_rate: Number(newProduct.tax_rate ?? 0),
        uom: newProduct.uom ?? "NOS",
      };

      // 1️⃣ Add to product list immediately
      setProductList((prev) => [...prev, normalizedProduct]);

      // 2️⃣ Auto-select product in active row
      if (activeProductRow !== null) {
        updateItem(activeProductRow, {
          product_id: normalizedProduct.id,
          name: normalizedProduct.name,
          description: normalizedProduct.description,
          unit_price: normalizedProduct.unit_price,
          tax_rate: normalizedProduct.tax_rate,
          uom: normalizedProduct.uom,
          qty: 1,
        });
      }

      // 3️⃣ Reset form + close modal
      setProductForm({
        name: "",
        unit_price: "",
        tax_rate: "",
        uom: "NOS",
        description: "",
      });

      setAddProductOpen(false);
    } catch (e) {
      console.error("Failed to create product", e);
      alert("Failed to create product");
    } finally {
      setProductSubmitting(false);
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="p-8">Loading...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="w-full px-8 py-8">

        {/* ================= HEADER ================= */}
<div className="flex items-center justify-between mb-8">
  <div>
    <h1 className="text-2xl font-semibold text-gray-900">
      Edit Quotation
    </h1>
    <p className="text-sm text-gray-500">
      Quotation ID: {id}
    </p>
  </div>

  <div className="flex gap-3">
    <button
      onClick={() => navigate(-1)}
      className="px-4 py-2 rounded-md border border-gray-300 bg-white text-sm"
    >
      Back
    </button>

    <button
      onClick={handleSave}
      disabled={saving}
      className="px-5 py-2 rounded-md bg-blue-600 text-white text-sm shadow-sm"
    >
      {saving ? "Saving..." : "Save"}
    </button>
  </div>
</div>

        {/* ================= CUSTOMER + META ================= */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">

 {/* ================= LEFT: CUSTOMER DETAILS ================= */}
    <div className="lg:col-span-2">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-800">
          Customer Details
        </h3>
      </div>

      {customerSnapshot ? (
        <div className="border rounded-lg p-4 bg-gray-50 text-sm space-y-2">

          <div className="font-semibold text-gray-900">
            {customerSnapshot.company_name}
          </div>

          <div className="text-gray-600">
            {customerSnapshot.location_name}
          </div>

          {customerSnapshot.address && (
            <div className="text-gray-600">
              {customerSnapshot.address}
            </div>
          )}

          {customerSnapshot.gstin && (
            <div className="text-gray-600">
              GSTIN: {customerSnapshot.gstin}
            </div>
          )}

          <div className="pt-3 mt-3 border-t">
            <div className="font-medium text-gray-800">
              {customerSnapshot.contact_name}
            </div>

            {customerSnapshot.phone && (
              <div className="text-gray-600">
                📞 {customerSnapshot.phone}
              </div>
            )}

            {customerSnapshot.email && (
              <div className="text-gray-600">
                ✉️ {customerSnapshot.email}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="text-sm text-gray-500">
          Customer snapshot not available
        </div>
      )}
    </div>


 {/* ================= RIGHT: QUOTATION DETAILS ================= */}
    <div className="border rounded-lg p-6">

      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-800">
          Quotation Details
        </h3>
      </div>

      <div className="space-y-4 border-t pt-4">

        {/* DATE */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Quotation Date
          </label>
          <div className="relative">
            <input
              ref={dateInputRef}
              type="date"
              value={data.quotation_date || ""}
              onClick={openCalendar}
              onChange={(e) =>
                setData((s: any) => ({
                  ...s,
                  quotation_date: e.target.value,
                }))
              }
              className="w-full h-10 px-3 pr-10 border rounded-md cursor-pointer"
            />

            <button
              type="button"
              onClick={openCalendar}
              className="absolute inset-y-0 right-3 flex items-center text-gray-400"
              tabIndex={-1}
            >
              <Calendar size={16} />
            </button>
          </div>
        </div>

        {/* VALIDITY */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Validity (days)
          </label>
          <input
            type="number"
            min={0}
            value={data.validity_days}
            disabled={validityState === "expired"}
            className="w-full h-10 px-3 border rounded-md"
            onChange={(e) => {
              const v = e.target.value;
              setData((s: any) => ({
                ...s,
                validity_days: v === "" ? "" : Number(v),
              }));
            }}
          />
        </div>

        {/* STATUS */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Status
          </label>
          <select
            value={data.status}
            onChange={(e) =>
              setData((s: any) => ({
                ...s,
                status: e.target.value,
              }))
            }
            className="w-full h-10 px-3 border rounded-md"
          >
            <option value="draft">Draft</option>
            <option value="pending">Pending</option>
            <option value="won">Won</option>
            <option value="lost">Lost</option>
          </select>
        </div>

      </div>
    </div>
          </div>

          {/* ================= RE-ISSUE ================= */}
          {validityState === "expired" && (
            <div className="mt-6 p-4 border border-red-300 bg-red-50 rounded-lg">
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={reissue}
                  onChange={(e) => setReissue(e.target.checked)}
                  className="mt-1"
                />
                <div>
                  <div className="font-semibold text-red-800">
                    Re-Issue quotation
                  </div>
                  <div className="text-sm text-red-700">
                    A new quotation will be created with a fresh validity period.
                    The current quotation will remain unchanged.
                  </div>
                </div>
              </label>

              {reissue && (
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700">
                    New validity (days)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={newValidityDays}
                    onChange={(e) =>
                      setNewValidityDays(Number(e.target.value))
                    }
                    className="mt-1 w-32 p-2 border rounded-md"
                  />
                </div>
              )}
            </div>
          )}

          {/* Items table */}
          <div className="mt-10 mb-8">
            <h2 className="text-lg font-semibold mb-3">Items</h2>
            <table className="w-full border rounded-lg overflow-hidden">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 text-left">Product</th>
                  <th className="p-2 text-left">Qty</th>
                  <th className="p-2 text-left">Unit Price</th>
                  <th className="p-2 text-left">Discount %</th>
                  <th className="p-2 text-left">UOM</th>
                  <th className="p-2 text-left">Tax %</th>
                  <th className="p-2"></th>
                </tr>
              </thead>
              <tbody>
                {(data.items || []).map((item: any, idx: number) => {
                 

                  return (
                    <tr key={idx} className="border-b align-top">

                      {/* PRODUCT */}
                      <td className="p-2 align-top">
                        <label htmlFor={`item-product-${idx}`} className="sr-only">
                          Product
                        </label>

                        <div className="relative space-y-2">

                          {/* PRODUCT SEARCH */}
                          <input
                            type="text"
                            value={
                              activeProductRow === idx
                                ? productSearch
                                : item.name || ""
                            }
                            placeholder="Search product..."
                            className="w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-200"
                            onFocus={() => {
                              setActiveProductRow(idx);
                              setProductSearch(item.name || "");
                            }}
                            onChange={(e) => {
                              setProductSearch(e.target.value);
                              updateItem(idx, {
                                name: e.target.value,
                                product_id: null,
                              });
                            }}
                            onBlur={() =>
                              setTimeout(() => setActiveProductRow(null), 200)
                            }
                          />

                          {/* PRODUCT DESCRIPTION */}
                          <textarea
                            className="w-full px-3 py-2 border rounded-md text-sm bg-gray-50"
                            placeholder="Product description"
                            rows={2}
                            value={item.description || ""}
                            onChange={(e) =>
                              updateItem(idx, { description: e.target.value })
                            }
                          />

                          {/* PRODUCT DROPDOWN */}
                          {activeProductRow === idx && (
                            <div className="absolute z-40 top-[42px] w-full bg-white border border-gray-200 rounded-xl shadow-2xl max-h-80 overflow-y-auto">

                              {productList
                                .filter((p) =>
                                  p.name.toLowerCase().includes(productSearch.toLowerCase())
                                )
                                .map((p) => (
                                  <div
                                    key={p.id}
                                    className="px-4 py-3 cursor-pointer hover:bg-blue-50 transition border-b last:border-b-0"
                                    onMouseDown={() => {
                                      updateItem(idx, {
                                        product_id: p.id,
                                        name: p.name,
                                        description: p.description ?? "",
                                        unit_price: p.unit_price,
                                        tax_rate: p.tax_rate,
                                        uom: p.uom,
                                        qty: item.qty || 1,
                                      });
                                      setProductSearch(p.name);
                                      setActiveProductRow(null);
                                    }}
                                  >
                                    <div className="font-semibold text-sm text-gray-800">
                                      {p.name}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                      ₹{p.unit_price} · {p.uom} · {p.tax_rate}% GST
                                    </div>
                                    {p.description && (
                                      <div className="text-xs text-gray-400 mt-1 line-clamp-2">
                                        {p.description}
                                      </div>
                                    )}
                                  </div>
                                ))}

                              {productList.filter((p) =>
                                p.name.toLowerCase().includes(productSearch.toLowerCase())
                              ).length === 0 && (
                                  <div className="px-4 py-3 text-sm text-gray-500">
                                    No product found — type to add custom
                                  </div>
                                )}

                              <div
                                className="px-4 py-3 text-sm text-blue-600 cursor-pointer hover:bg-blue-50 border-t"
                                onMouseDown={() => {
                                  setProductForm({
                                    name: productSearch,
                                    unit_price: "",
                                    tax_rate: "",
                                    uom: "NOS",
                                    description: "",
                                  });
                                  setAddProductOpen(true);
                                  setActiveProductRow(null);
                                }}
                              >
                                + Add Product
                              </div>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* QTY */}
                      <td className="p-2">
                        <label htmlFor={`item-qty-${idx}`} className="sr-only">
                          Quantity
                        </label>
                        <input
                          id={`item-qty-${idx}`}
                          type="number"
                          className="p-2 border rounded-md w-full"
                          value={item.qty ?? 0}
                          onChange={(e) => {
                            const v = e.target.value;
                            updateItem(idx, { qty: v === "" ? "" : Number(v) });
                          }}
                        />
                      </td>

                      {/* UNIT PRICE */}
                      <td className="p-2">
                        <label htmlFor={`item-price-${idx}`} className="sr-only">
                          Unit price
                        </label>
                        <input
                          id={`item-price-${idx}`}
                          type="number"
                          className="p-2 border rounded-md w-full"
                          value={item.unit_price ?? 0}
                          onChange={(e) => {
                            const v = e.target.value;
                            updateItem(idx, { unit_price: v === "" ? "" : Number(v) });
                          }}
                        />
                      </td>

                      {/* DISCOUNT */}
                      <td className="p-2">
                        <label className="sr-only">Discount</label>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          className="p-2 border rounded-md w-full"
                          value={item.discount_percent ?? 0}
                          onChange={(e) => {
                            const v = e.target.value;
                            updateItem(idx, {
                              discount_percent: v === "" ? "" : Number(v),
                            });
                          }}
                        />
                      </td>

                      {/* UOM */}
                      <td className="p-2">
                        <label htmlFor={`item-uom-${idx}`} className="sr-only">
                          UOM
                        </label>
                        <input
                          id={`item-uom-${idx}`}
                          className="p-2 border rounded-md w-full"
                          value={item.uom || ""}
                          onChange={(e) =>
                            updateItem(idx, { uom: e.target.value })
                          }
                        />
                      </td>

                      {/* TAX */}
                      <td className="p-2">
                        <label htmlFor={`item-tax-${idx}`} className="sr-only">
                          Tax percent
                        </label>
                        <input
                          id={`item-tax-${idx}`}
                          type="number"
                          className="p-2 border rounded-md w-full"
                          value={item.tax_rate ?? 0}
                          onChange={(e) => {
                            const v = e.target.value;
                            updateItem(idx, { tax_rate: v === "" ? "" : Number(v) });
                          }}
                        />
                      </td>

                      {/* REMOVE */}
                      <td className="p-2">
                        <button
                          onClick={() => removeItem(idx)}
                          className="text-red-500"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  );
                })}

                <tr>
                  <td colSpan={7} className="p-3">
                    <button
                      onClick={addItem}
                      className="px-4 py-2 bg-gray-100 rounded-md"
                    >
                      + Add Item
                    </button>
                  </td>
                </tr>
              </tbody>

            </table>
          </div>

          {/* PAYMENT TERMS */}
          <div className="mt-10">
            <label className="block text-sm font-medium text-gray-700">
              Payment Terms
            </label>

            <input
              type="text"
              value={data.payment_terms || ""}
              onChange={(e) =>
                setData((s: any) => ({
                  ...s,
                  payment_terms: e.target.value,
                }))
              }
              placeholder="e.g. Net 30 / 100% Advance / 30 days from invoice date"
              className="mt-1 w-full p-2 border rounded-md"
            />

            <p className="text-xs text-gray-400 mt-1">
              This will appear on the quotation and PDF.
            </p>
          </div>
          {/* Notes & Terms */}
          <div className="mt-10 grid grid-cols-2 gap-6">
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Notes</label>
              <textarea id="notes" name="notes" className="mt-1 w-full p-3 border rounded-md min-h-[100px]" value={data.notes || ""} onChange={(e) => setData((s: any) => ({ ...s, notes: e.target.value }))} />
            </div>

            <div>
              <label htmlFor="terms" className="block text-sm font-medium text-gray-700">Terms</label>
              <textarea id="terms" name="terms" className="mt-1 w-full p-3 border rounded-md min-h-[100px]" value={data.terms || ""} onChange={(e) => setData((s: any) => ({ ...s, terms: e.target.value }))} />
            </div>
          </div>

          {/* Summary */}
          <div className="mt-10 flex justify-end">
            <div className="bg-gray-50 p-5 rounded-lg w-64">
              <p className="text-gray-600">Subtotal</p>
              <p className="text-lg font-semibold">₹{subtotal.toLocaleString()}</p>
              <p className="text-gray-600">Discount</p>
              <p className="text-lg font-semibold text-red-600">
                − ₹{totalDiscount.toLocaleString()}
              </p>

              <p className="text-gray-600">Tax</p>
              <p className="text-lg font-semibold">₹{taxTotal.toLocaleString()}</p>
              <p className="text-gray-600">Total</p>
              <p className="text-xl font-bold">₹{grandTotal.toLocaleString()}</p>

              <button onClick={handleSave} disabled={saving} className="w-full mt-4 py-2 bg-blue-700 text-white rounded-md">{saving ? "Saving..." : "Save Changes"}</button>
            </div>
          </div>
        </div>
      </div>

      {/* ================= ADD CUSTOMER MODAL (HERE) ================= */}

      {addProductOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" />

          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 relative">
            <h2 className="text-lg font-semibold mb-4">Add New Product</h2>

            <div className="grid grid-cols-2 gap-4">
              <input
                className="border px-3 py-2 rounded col-span-2"
                placeholder="Product Name *"
                value={productForm.name}
                onChange={(e) =>
                  setProductForm({ ...productForm, name: e.target.value })
                }
              />

              <input
                className="border px-3 py-2 rounded"
                placeholder="Unit Price"
                value={productForm.unit_price}
                onChange={(e) =>
                  setProductForm({ ...productForm, unit_price: e.target.value })
                }
              />

              <select
                className="border px-3 py-2 rounded"
                value={productForm.uom}
                onChange={(e) =>
                  setProductForm({ ...productForm, uom: e.target.value })
                }
              >
                <option>NOS</option>
                <option>SET</option>
                <option>HR</option>
              </select>

              <input
                className="border px-3 py-2 rounded"
                placeholder="Tax Rate"
                value={productForm.tax_rate}
                onChange={(e) =>
                  setProductForm({ ...productForm, tax_rate: e.target.value })
                }
              />

              <textarea
                className="border px-3 py-2 rounded col-span-2"
                placeholder="Description (required)"
                value={productForm.description}
                onChange={(e) =>
                  setProductForm({ ...productForm, description: e.target.value })
                }
              />
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setAddProductOpen(false)}
                className="border px-4 py-2 rounded"
              >
                Cancel
              </button>
              <button
                onClick={submitProductFromQuotation}
                disabled={productSubmitting}
                className="bg-rose-500 text-white px-4 py-2 rounded"
              >
                {productSubmitting ? "Saving..." : "Add Product"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Version Comment Modal */}
      <VersionCommentModal
        isOpen={versionCommentModalOpen}
        oldVersion={originalVersion}
        newVersion={(() => {
          function bumpVersion(version: string) {
            const v = parseFloat(version);
            if (isNaN(v)) return '0.1';
            return (Math.round((v + 0.1) * 10) / 10).toFixed(1);
          }
          return bumpVersion(originalVersion);
        })()}
        onConfirm={handleVersionCommentSubmit}
        onCancel={() => {
          setVersionCommentModalOpen(false);
          setPendingSavePayload(null);
        }}
        isLoading={saving}
      />
    </Layout>
  );
}
