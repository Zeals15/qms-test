// src/api.ts
export const API_URL = import.meta.env.VITE_API_BASE || "http://localhost:4000";
const BASE = API_URL;

export type JsonLike = any;
export type TokenGetter = () => string | null | undefined;
export type Username = string;

/* ================= HEADERS ================= */

function buildHeaders(customHeaders?: Record<string, string>, tokenGetter?: TokenGetter) {
  const token =
    (typeof tokenGetter === "function" ? tokenGetter() : null) ||
    (typeof localStorage !== "undefined" ? localStorage.getItem("token") : null);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(customHeaders || {}),
  };

  if (token && !headers["Authorization"]) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return headers;
}

/* ================= REQUEST HELPERS ================= */

async function requestJson(
  path: string,
  opts: RequestInit = {},
  tokenGetter?: TokenGetter
): Promise<JsonLike> {
  const url = `${BASE}${path}`;
  const headers = buildHeaders(opts.headers as any, tokenGetter);

  const res = await fetch(url, { ...opts, headers, credentials: "include" });

  if (!res.ok) {
    const txt = await res.text();
    let body: any = txt;
    try {
      body = JSON.parse(txt);
    } catch {}

    const err = new Error(
      body?.error ? `HTTP ${res.status}: ${body.error}` : `HTTP ${res.status}: ${txt}`
    );
    (err as any).status = res.status;
    (err as any).body = body;
    throw err;
  }

  if (res.status === 204) return null;
  const ct = res.headers.get("content-type") || "";
  return ct.includes("application/json") ? res.json() : res.text();
}

async function requestBlob(
  path: string,
  opts: RequestInit = {},
  tokenGetter?: TokenGetter
): Promise<Blob> {
  const url = `${BASE}${path}`;
  const headers = buildHeaders(opts.headers as any, tokenGetter);
  const res = await fetch(url, { ...opts, headers, credentials: "include" });
  if (!res.ok) throw new Error(await res.text());
  return res.blob();
}

/* ================= API SHAPE ================= */

export interface ApiShape {
  getAuthToken?: TokenGetter;

  // admin
  createUser: (payload: {
  username: Username;  
  name?: string;      
  email: string;
  phone?: string;
  position?: string;
  role?: string;
  password: string;
}) => Promise<any>;

   getUsers: () => Promise<any>;

// users (admin)
// users (admin)
 toggleUserStatus: (id: number, is_active: number) => Promise<any>;
 deleteUser: (id: number, options?: { force?: boolean }) => Promise<any>;


  // stats
  getStats: () => Promise<any>;

  //dahboard
    getDashboardSummary: () => Promise<any>;
  getDashboardActionQuotations: () => Promise<any[]>;
  getDashboardFollowupsDue: () => Promise<any[]>;

  // quotations
  getQuotations: () => Promise<any>;
  getRecentQuotations: () => Promise<any>;
  getQuotation: (id: number | string) => Promise<any>;
  getQuotationPdf: (id: number | string) => Promise<Blob>;
  createQuotation: (payload: any) => Promise<any>;
  deleteQuotation: (id: number | string, options?: { force?: boolean }) => Promise<any>;
  approveQuotation: (id: number | string, payload?: any) => Promise<any>;
  updateQuotation: (id: number | string, payload: Record<string, any>) => Promise<any>;
  markQuotationWon: (id: number | string) => Promise<any>;
  markQuotationLost: (id: number | string, comment: string) => Promise<any>;
  getVersionHistory: (id: number | string) => Promise<any>;
  getQuotationDecisions: (id: number | string) => Promise<any>;
  // ✅ View a specific version snapshot (answers: "where is v0.3?")
  getVersionSnapshot: (id: number | string, versionNumber: string) => Promise<any>;

  reissueQuotation: (
  id: number | string,
  payload: { validity_days: number }
) => Promise<{ new_quotation_id: number }>;

//follow-ups
getQuotationFollowups: (quotationId: number | string) => Promise<any[]>;
createQuotationFollowup(
  quotationId: number | string,
  payload: {
    followup_date: string;
    note: string;
    followup_type: "call" | "email" | "whatsapp" | "meeting" | "site_visit" | "other";
    next_followup_date?: string | null;
  }
) : Promise<any>;

completeQuotationFollowup: (id: number) => Promise<any>;

  // customers
  getCustomers: () => Promise<any>;
  addCustomer: (payload: any) => Promise<any>;
  updateCustomer: (id: number | string, payload: any) => Promise<any>;
  deleteCustomer: (id: number | string) => Promise<any>;
  
  // customer locations
  getCustomerLocations: (customerId: number) => Promise<any[]>;
  addCustomerLocation: (
    customerId: number,
    payload: {
      location_name: string;
      gstin?: string;
      address?: string;
      city?: string;
      state?: string;
    }
  ) => Promise<any>;
  updateCustomerLocation: (
    customerId: number,
    locationId: number,
    payload: any
  ) => Promise<any>;
  deleteCustomerLocation: (customerId: number, locationId: number) => Promise<any>;

  // customer contacts
  getCustomerContacts: (locationId: number) => Promise<any[]>;
  addCustomerContact: (
    locationId: number,
    payload: {
      contact_name: string;
      phone?: string;
      email?: string;
      is_primary?: boolean;
    }
  ) => Promise<any>;
  updateCustomerContact: (
    locationId: number,
    contactId: number,
    payload: any
  ) => Promise<any>;
  deleteCustomerContact: (locationId: number, contactId: number) => Promise<any>;
  clearPrimaryContacts: (locationId: number) => Promise<any>;

  // products
  getProducts: () => Promise<any>;
  addProduct: (payload: any) => Promise<any>;
  updateProduct: (id: number | string, payload: any) => Promise<any>;
  deleteProduct: (id: number | string) => Promise<any>;

  // auth
  login: (payload: any) => Promise<any>;
  getMe: () => Promise<any>;
  getNextQuotationSeq: () => Promise<any>;

  //user management
 updateUser: (
  id: number,
  payload: {
    username: Username;
    name?: string;
    email: string;
    phone?: string;
    position?: string;
    role?: string;
  }
) => Promise<any>;

updateUserPassword: (id: number, password: string) => Promise<any>;
  // reports
  getReportKpis: () => Promise<any>;
  getReportSalesPerformance: () => Promise<any>;
  getReportCustomers: () => Promise<any>;
  getReportProducts: () => Promise<any>;
  getReportPipeline: () => Promise<any>;
  
  getReportTimeseries: (range: "month" | "quarter" | "year") => Promise<any>;

  getReportUserMetrics: () => Promise<any>;

  //settings 

  getSettings: () => Promise<any>;
saveSettings: (payload: any) => Promise<any>;


}

/* ================= API IMPLEMENTATION ================= */

export const api: ApiShape = {
  getAuthToken: () => localStorage.getItem("token"),

  /* ================= STATS ================= */
  getStats: () => requestJson("/api/stats"),


    /* ================= DASHBOARD ================= */
  getDashboardSummary: () =>
    requestJson("/api/dashboard/summary"),

  getDashboardActionQuotations: () =>
    requestJson("/api/dashboard/action-quotations"),

  getDashboardFollowupsDue: () =>
    requestJson("/api/dashboard/followups-due"),


  /* ================= QUOTATIONS ================= */
  getQuotations: () => requestJson("/api/quotations"),
  getRecentQuotations: () => requestJson("/api/quotations/recent"),
  getQuotation: (id) =>
    requestJson(`/api/quotations/${id}`).then((r) => r?.quotation ?? r),
  getQuotationPdf: (id) => requestBlob(`/api/quotations/${id}/pdf`),

  createQuotation: (payload) =>
    requestJson("/api/quotations", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  deleteQuotation: (id, options) =>
    requestJson(
      `/api/quotations/${id}${options?.force ? "?force=true" : ""}`,
      { method: "DELETE" }
    ),

  approveQuotation: (id, payload = {}) =>
    requestJson(`/api/quotations/${id}/approve`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  updateQuotation: (id, payload) =>
    requestJson(`/api/quotations/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

    reissueQuotation: (id, payload) =>
  requestJson(`/api/quotations/${id}/reissue`, {
    method: "POST",
    body: JSON.stringify(payload),
  }),

  markQuotationWon: (id) =>
    requestJson(`/api/quotations/${id}/won`, {
      method: "POST",
      body: JSON.stringify({}),
    }),

  markQuotationLost: (id, comment) =>
    requestJson(`/api/quotations/${id}/lost`, {
      method: "POST",
      body: JSON.stringify({ comment }),
    }),

  getVersionHistory: (id) =>
  requestJson(`/api/quotations/${id}/versions`)
    .then((r) => (Array.isArray(r) ? r : [])),

  getQuotationDecisions: (id) =>
    requestJson(`/api/quotations/${id}/decisions`).then((r) => r?.decision ?? null),

  // ✅ Get a specific version snapshot - allows viewing v0.3 even when at v0.4
  getVersionSnapshot: (id, versionNumber) =>
    requestJson(`/api/quotations/${id}/version/${versionNumber}`).then((r) => r),




  /* ================= CUSTOMERS ================= */
  getCustomers: () => requestJson("/api/customers"),

  addCustomer: (payload) =>
    requestJson("/api/customers", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  updateCustomer: (id, payload) =>
    requestJson(`/api/customers/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  deleteCustomer: (id) =>
    requestJson(`/api/customers/${id}`, { method: "DELETE" }),

  /*===================Follow-ups===================*/
  getQuotationFollowups: (quotationId) =>
  requestJson(`/api/quotations/${quotationId}/followups`)
    .then((r) => (Array.isArray(r) ? r : [])),

createQuotationFollowup(
  quotationId: number | string,
  payload: {
    followup_date: string;
    note: string;
    followup_type: "call" | "email" | "whatsapp" | "meeting" | "site_visit" | "other";
    next_followup_date?: string | null;
  }
) {
  return requestJson(`/api/quotations/${quotationId}/followups`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
},


completeQuotationFollowup(id: number) {
  return requestJson(`/api/quotation-followups/${id}/complete`, {
    method: "PUT",
  });
},

  /* ================= CUSTOMER LOCATIONS ================= */
  getCustomerLocations: (customerId) =>
    requestJson(`/api/customers/${customerId}/locations`).then((r) => (Array.isArray(r) ? r : [])),

  addCustomerLocation: (customerId, payload) =>
    requestJson(`/api/customers/${customerId}/locations`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  updateCustomerLocation: (customerId, locationId, payload) =>
    requestJson(`/api/customers/${customerId}/locations/${locationId}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  deleteCustomerLocation: (customerId, locationId) =>
    requestJson(`/api/customers/${customerId}/locations/${locationId}`, {
      method: "DELETE",
    }),

  /* ================= CUSTOMER CONTACTS ================= */
  getCustomerContacts: async (locationId: number) => {
  return requestJson(
    `/api/customer-locations/${locationId}/contacts`,
    { method: "GET" }
  );
},

  addCustomerContact: (locationId, payload) =>
    requestJson(`/api/customer-locations/${locationId}/contacts`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  updateCustomerContact: (locationId, contactId, payload) =>
    requestJson(`/api/customer-locations/${locationId}/contacts/${contactId}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  deleteCustomerContact: (locationId, contactId) =>
    requestJson(`/api/customer-locations/${locationId}/contacts/${contactId}`, {
      method: "DELETE",
    }),

  clearPrimaryContacts: (locationId) =>
    requestJson(`/api/customer-locations/${locationId}/clear-primary`, {
      method: "PUT",
    }),


  /* ================= PRODUCTS ================= */
  getProducts: () => requestJson("/api/products"),

  addProduct: (payload) =>
    requestJson("/api/products", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  updateProduct: (id, payload) =>
    requestJson(`/api/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  deleteProduct: (id) =>
    requestJson(`/api/products/${id}`, { method: "DELETE" }),

  /* ================= USERS (ADMIN) ================= */
  getUsers: () => requestJson("/api/users"),

  toggleUserStatus: (id, is_active) =>
  requestJson(`/api/users/${id}/status`, {
    method: "PUT",
    body: JSON.stringify({ is_active }),
  }),

  deleteUser: (id, options) =>
  requestJson(
    `/api/users/${id}${options?.force ? "?force=true" : ""}`,
    { method: "DELETE" }
  ),

  updateUser: (id, payload) =>
  requestJson(`/api/users/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  }),

  updateUserPassword: (id: number, password: string) =>
  requestJson(`/api/users/${id}/password`, {
    method: "PUT",
    body: JSON.stringify({ password }),
  }),


  createUser: (payload) =>
    requestJson("/api/users", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  /* ================= AUTH ================= */
  login: (payload) =>
    requestJson("/api/login", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getMe: () => requestJson("/api/me"),
  getNextQuotationSeq: () => requestJson("/api/quotations/next-seq"),

  /* ================= REPORTS (🔥 REQUIRED) ================= */
  getReportKpis: () => requestJson("/api/reports/kpis"),

  getReportSalesPerformance: () =>
    requestJson("/api/reports/sales-performance"),

  getReportCustomers: () =>
    requestJson("/api/reports/customers"),

  getReportProducts: () =>
    requestJson("/api/reports/products"),

  getReportPipeline: () =>
    requestJson("/api/reports/pipeline"),

  getReportTimeseries: (range) =>
  requestJson(`/api/reports/timeseries?range=${range}`),

  getReportUserMetrics: () =>
  requestJson("/api/reports/user-metrics"),

  //settings 

  getSettings: () => requestJson("/api/settings"),

saveSettings: (payload) =>
  requestJson("/api/settings", {
    method: "POST",
    body: JSON.stringify(payload),
  }),

  
};



export default api;
