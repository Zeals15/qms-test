# RBAC & CSV Export - Quick Reference

## ✅ What Changed

### 1. CSV Export Removed (All Users)
Products, Customers, and Quotations pages no longer have export buttons.

### 2. Admin-Only CSV Export Added (Reports)
Three new export functions in Reports page (admin-only):
- **Sales Performance** - Export sales metrics by salesperson
- **Customers** - Export customer engagement data
- **Products** - Export product sales data

### 3. Pipeline Colors Updated
- **Won** = Green 🟢
- **Lost** = Red 🔴
- **Pending** = Blue 🔵
- **Draft** = Gray ⚫
- **Approved** status removed

---

## 🔐 User Roles

| Role | CSV Export | See Reports | See All Data |
|------|-----------|------------|--------------|
| **Admin** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Salesperson** | ❌ No | ✅ Own only | ❌ No |
| **Viewer** | ❌ No | ✅ Yes | ❌ No |

---

## 📍 Page Changes

### Products Page
- ❌ Removed: Export CSV button
- ✅ Keeps: Product list, search, filters

### Customers Page
- ❌ Removed: Export CSV button
- ✅ Keeps: Customer list, search, create/edit

### Quotations Page
- ❌ Removed: Export CSV button
- ✅ Keeps: Quotation list, filters, create/edit, delete

### Reports Page
- ✅ Added: Export buttons (admin-only) on:
  - Sales Performance tab
  - Customers tab
  - Products tab
- ✅ Updated: Pipeline colors (status-based, not index-based)
- ✅ Removed: "Approved" status from pipeline

---

## 🔍 How Admin-Only Works

```tsx
// In Reports.tsx
const { permissions } = useAuth();

{permissions.isAdmin && (
  <button onClick={handleExportCustomers}>
    Export as CSV
  </button>
)}
```

If user is **not admin** → Button doesn't render
If user **is admin** → Button renders and works

---

## 📊 CSV Export Formats

### Sales Performance Export
```
name,total_quotations,won,lost,win_rate%,revenue
John Doe,10,7,3,70%,500000
Jane Smith,8,6,2,75%,450000
```

### Customers Export
```
company_name,quotations,won,revenue,last_deal
Acme Corp,5,3,250000,2025-01-15
Tech Ltd,3,2,180000,2025-01-10
```

### Products Export
```
name,quantity,revenue
Product A,45,125000
Product B,32,96000
```

---

## 🎨 Pipeline Colors (Reports → Pipeline Tab)

**Before:**
- Index 0 = Green (any status)
- Index 1 = Blue (any status)
- Index 2 = Red (any status)

**After:**
- won → Green 🟢
- lost → Red 🔴
- pending → Blue 🔵
- draft → Gray ⚫

---

## 🧪 Quick Test

### For Admins:
1. Login as admin
2. Go to Reports
3. Click "Sales Performance" tab
4. See ✅ Export button
5. Click it → Download sales_performance_2025-01-15.csv

### For Salespeople:
1. Login as salesperson
2. Go to Reports
3. Click "Sales Performance" tab
4. See ❌ No Export button

### For CSV Removal:
1. Go to Products page
2. ❌ No export button (was removed)
3. Go to Customers page
4. ❌ No export button (was removed)
5. Go to Quotations page
6. ❌ No export button (was removed)

---

## 📁 Files Modified

1. `src/pages/Products.tsx` - Removed export button
2. `src/pages/Customers.tsx` - Removed export button & function
3. `src/pages/Quotations.tsx` - Removed export button, function, & Download import
4. `src/pages/Reports.tsx` - Added useAuth, Download icon, 4 export functions, conditional rendering, dynamic pipeline colors

---

## 🚀 No Breaking Changes

- All existing features work as before
- Only addition is admin-only export in Reports
- Only removals are export from Products/Customers/Quotations
- Pipeline display is improved (clearer colors)

---

**Status: ✅ COMPLETE**
