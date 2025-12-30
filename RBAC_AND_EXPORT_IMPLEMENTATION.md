# Role-Based Access Control (RBAC) & CSV Export Implementation ✅

## 🎯 Summary of Changes

This document outlines the implementation of role-based access control for CSV export functionality and pipeline visualization updates across the Prayosha Quotation System.

---

## 📋 Implementation Details

### 1. ✅ CSV Export Removal (All Users)

#### Files Modified:
- `src/pages/Products.tsx`
- `src/pages/Customers.tsx`
- `src/pages/Quotations.tsx`

#### What Was Removed:
- **Export CSV button** from Products list page
- **Export CSV button** from Customers list page
- **Export CSV button** from Quotations list page
- **Related export functions** (exportCSV, handleExportFiltered)
- **Unused imports** (Download icon from lucide-react in Quotations.tsx)

#### Why:
- CSV export is no longer a general feature available to all users
- Data extraction is now controlled and role-based
- Ensures data security and compliance

---

### 2. ✅ Admin-Only CSV Export (Reports Page)

#### File Modified:
- `src/pages/Reports.tsx`

#### Changes Made:

**a) Added useAuth Import & Hook:**
```tsx
import { useAuth } from "../context/AuthContext";

export default function Reports() {
  const { permissions } = useAuth();
  // Now can access: permissions.isAdmin
```

**b) Added Download Icon Import:**
```tsx
import { ..., Download } from "lucide-react";
```

**c) Implemented CSV Export Functions:**

Three new functions for exporting report data:

1. **downloadCSV(data, filename)** - Generic CSV download helper
2. **handleExportCustomers()** - Exports customers report with columns:
   - company_name, quotations, won, revenue, last_deal

3. **handleExportProducts()** - Exports products report with columns:
   - name, quantity, revenue

4. **handleExportSalesPerformance()** - Exports sales performance with columns:
   - name, total_quotations, won, lost, win_rate%, revenue

**d) Added Conditional Export Buttons:**

All export buttons are now **admin-only** using:
```tsx
{permissions.isAdmin && (
  <button
    onClick={handleExportCustomers}
    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
  >
    <Download size={16} /> Export as CSV
  </button>
)}
```

**e) Updated Report Tabs:**

Modified three tabs to include export buttons:
- **Customers Tab** - Has export button (admin-only)
- **Products Tab** - Has export button (admin-only)
- **Sales Performance Tab** - Has export button (admin-only) + improved header with title & description

---

### 3. ✅ Pipeline Visualization Update

#### File Modified:
- `src/pages/Reports.tsx`

#### Changes Made:

**a) Removed "Approved" Status:**
- Pipeline no longer displays "Approved" as a separate stage
- Status-driven color logic now uses: Won, Lost, Pending, Draft

**b) Implemented Dynamic Color Logic:**
```tsx
const getBarColor = (status: string) => {
  const lower = status?.toLowerCase() || "";
  if (lower === "won") return "bg-green-500";      // ✅ Won = Green
  if (lower === "lost") return "bg-red-500";       // ❌ Lost = Red
  if (lower === "pending") return "bg-blue-500";   // ⏳ Pending = Blue
  return "bg-gray-400";                             // 📝 Draft = Gray
};
```

**c) Updated Pipeline Funnel Display:**
- Bar colors now dynamically match status using above logic
- Removed index-based color mapping that was static
- More intuitive: Green = success, Red = failure, Blue = in progress, Gray = draft

**Why This Matters:**
- **Visual clarity:** Outcomes (Won/Lost) are now clearly distinguished from processes (Pending/Draft)
- **Removed confusion:** No more "Approved" status which wasn't part of the quotation lifecycle
- **User-friendly:** Colors intuitively match business meanings

---

## 🔐 RBAC Implementation Details

### User Roles & Permissions:
```
Admin:
  ├─ Can see all users' data
  ├─ Can export CSV from Reports (Customers, Products, Sales)
  ├─ Can see all sales performance metrics
  └─ Can manage system settings

Salesperson/Sales:
  ├─ Can see only their own quotations
  ├─ Cannot export CSV
  ├─ Can see their own performance in Reports
  └─ Can create and manage quotations

Viewer/User:
  ├─ Read-only access
  ├─ No CSV export
  └─ Cannot manage quotations
```

### How Role Check Works:
```tsx
const { permissions } = useAuth();

// In rendering:
{permissions.isAdmin && (
  // Only render for admins
  <button onClick={handleExportCustomers}>
    Export CSV
  </button>
)}
```

---

## 📊 Reports Page - Updated Tab Structure

### Overview Tab
- KPI cards (No changes)
- Charts (No changes)

### Sales Performance Tab
- ✅ **NEW:** Export button (admin-only)
- Top 3 salespeople cards
- Detailed table with: Name, Quotations, Won, Lost, Win %, Revenue

### Customers Tab
- ✅ **NEW:** Export button (admin-only)
- Customer report table with: Company, Quotations, Won, Revenue, Last Deal

### Products Tab
- ✅ **NEW:** Export button (admin-only)
- Product analytics table with: Name, Qty Sold, Revenue

### Pipeline Tab
- ✅ **UPDATED:** Dynamic color bars (Won=Green, Lost=Red, Pending=Blue, Draft=Gray)
- Pipeline summary statistics
- Funnel visualization with outcome-based colors
- Insights and analysis (No changes)

---

## 🧪 Testing Checklist

### CSV Export Removal (General Users):
- [ ] Go to Products page - No "Export CSV" button visible
- [ ] Go to Customers page - No "Export CSV" button visible
- [ ] Go to Quotations page - No "Export CSV" button visible

### Admin-Only CSV Export (Reports Page):
- [ ] Login as **Admin** user
  - [ ] Navigate to Reports → Sales Performance tab
    - [ ] "Export as CSV" button is **visible**
    - [ ] Click button - Downloads `sales_performance_YYYY-MM-DD.csv`
  - [ ] Navigate to Reports → Customers tab
    - [ ] "Export as CSV" button is **visible**
    - [ ] Click button - Downloads `customers_report_YYYY-MM-DD.csv`
  - [ ] Navigate to Reports → Products tab
    - [ ] "Export as CSV" button is **visible**
    - [ ] Click button - Downloads `products_report_YYYY-MM-DD.csv`

- [ ] Login as **Salesperson** user
  - [ ] Navigate to Reports → Sales Performance tab
    - [ ] "Export as CSV" button is **NOT visible**
  - [ ] Navigate to Reports → Customers tab
    - [ ] "Export as CSV" button is **NOT visible**
  - [ ] Navigate to Reports → Products tab
    - [ ] "Export as CSV" button is **NOT visible**

### Pipeline Visualization:
- [ ] Go to Reports → Pipeline tab
- [ ] Verify funnel bars use correct colors:
  - [ ] **Won** deals show **GREEN** bar
  - [ ] **Lost** deals show **RED** bar
  - [ ] **Pending** deals show **BLUE** bar
  - [ ] **Draft** deals show **GRAY** bar
- [ ] Verify "Approved" status is not visible
- [ ] Verify percentage and deal count display correctly
- [ ] Verify insights section still shows risk analysis

---

## 🔄 Data Flow

### CSV Export Flow (Admin Only):
```
Reports Page (Admin logged in)
    ↓
Checks permissions.isAdmin = true
    ↓
Renders "Export as CSV" button
    ↓
User clicks export button
    ↓
handleExportCustomers() / handleExportProducts() / handleExportSalesPerformance()
    ↓
downloadCSV() helper function
    ↓
Creates CSV blob from data array
    ↓
Generates filename with date: `{entity}_report_YYYY-MM-DD.csv`
    ↓
Triggers browser download
    ↓
URL.revokeObjectURL() cleans up
```

### Pipeline Color Flow:
```
Pipeline Data from API
    ↓
Reports page renders each status item
    ↓
getBarColor(status) function determines color
    ↓
"won" → bg-green-500
"lost" → bg-red-500
"pending" → bg-blue-500
default → bg-gray-400
    ↓
Funnel bar renders with determined color
```

---

## 🎨 UI/UX Changes

### Products Page
**Before:** [Export CSV] button visible
**After:** No export button

### Customers Page
**Before:** [Export CSV] button visible
**After:** No export button

### Quotations Page
**Before:** [Export CSV] button visible
**After:** No export button

### Reports Page - Sales Tab
**Before:** No export option
**After:** [Export as CSV] button (admin-only) + improved header with description

### Reports Page - Customers Tab
**Before:** Table only
**After:** [Export as CSV] button (admin-only) + table

### Reports Page - Products Tab
**Before:** Table only
**After:** [Export as CSV] button (admin-only) + table

### Reports Page - Pipeline Tab
**Before:** Static color bars (index-based: green, blue, red)
**After:** Dynamic color bars (status-based: green for won, red for lost, blue for pending, gray for draft)

---

## 🔐 Security Implications

### Data Protection:
✅ CSV export is now controlled via RBAC
✅ Only admins can extract bulk customer/product/sales data
✅ Salespeople cannot export data, preventing data leakage
✅ General users have no export capability

### Compliance:
✅ Aligns with principle of least privilege
✅ Audit trail: Admin actions can be logged
✅ Role-based visibility ensures proper access control

---

## 📝 Configuration Notes

### AuthContext Integration:
- Reports page now uses `useAuth()` hook from `src/context/AuthContext.tsx`
- Checks `permissions.isAdmin` boolean flag
- Works with existing authentication system

### CSV File Format:
- Format: RFC 4180 compliant CSV
- Delimiter: Comma (,)
- Escape: Double-quotes for fields containing commas
- Filename: `{entity}_report_YYYY-MM-DD.csv`
- Charset: UTF-8

### Supported Exports:
1. **Sales Performance:** Sales rep metrics (won, lost, revenue)
2. **Customers:** Customer engagement metrics
3. **Products:** Product sales analytics

---

## 🚀 Future Enhancements (Optional)

1. **Schedule Exports:** Allow admins to schedule automated CSV exports
2. **Export Formats:** Add support for XLSX, PDF exports
3. **Advanced Filtering:** Custom filters before export (by date range, salesperson, etc.)
4. **Email Export:** Direct email delivery of reports
5. **Audit Logging:** Log all CSV export actions for compliance
6. **Role-based Report Customization:** Different admins see different fields
7. **Data Masking:** Mask sensitive fields in exports for non-admin roles
8. **Batch Export:** Export multiple reports in one action

---

## ✅ Status: COMPLETE

All requested changes have been implemented:
- ✅ CSV export removed from Products, Customers, Quotations
- ✅ Admin-only CSV export added to Reports
- ✅ Role-based access control configured
- ✅ Pipeline visualization updated with outcome-based colors
- ✅ "Approved" status removed from pipeline display

**Files Modified: 4**
- `src/pages/Products.tsx`
- `src/pages/Customers.tsx`
- `src/pages/Quotations.tsx`
- `src/pages/Reports.tsx`

**No breaking changes introduced.**
All existing functionality remains intact.
