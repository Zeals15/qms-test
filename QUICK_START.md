# 🚀 Quick Start - Getting Customer Data to Load

## ⚡ 1-2-3 Quick Fix

### Step 1: Start MySQL Server
```powershell
# Windows PowerShell
Start-Service MySQL80
# Or check if it's already running
Get-Service MySQL80
```

### Step 2: Start Node.js Server
```powershell
cd D:\prayosha-quotation-ui(4)\server
npm run server
# Or
npm start
```

**Wait for:** `Server running on port 4000`

### Step 3: Refresh Browser
```
http://localhost:5173
Go to: Create Quotation
Click: Buyer Search box
Type: anything (e.g., "a")
Expected: Customer list appears ✅
```

---

## 🔴 If Dropdown is Still Empty

### Check 1: Is Server Running?
```powershell
# Open new PowerShell window and run:
Invoke-WebRequest -Uri "http://localhost:4000/api/customers" -Method GET
```

**Expected:** Shows customer data in JSON format

**If Error:** 
- Run `npm run server` again
- Check for error messages

### Check 2: Do Customers Exist in Database?

Open MySQL:
```powershell
mysql -u root -p
# Enter password
USE quotation_db;
SELECT * FROM customers;
```

**If Empty:** Add a test customer through the UI:
1. Go to **Customers** page
2. Click **+ Add Customer**
3. Fill in details and save
4. Go back to **Create Quotation**
5. Try buyer search again

### Check 3: Browser Console

Open **F12** → **Console** tab

You should see:
```
Loading customers and products...
Customers loaded: Array(1) [...]
```

If you see **red error**, copy it and check:
- Is server running?
- Is database connected?
- Do customers exist?

---

## 🛠️ Environment Setup

Your `.env` file in `server/` folder should have:

```
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=your_mysql_password
MYSQL_DATABASE=quotation_db
PORT=4000
```

**If missing:** Create/update this file and restart server.

---

## ✅ Complete Verification

Run this in browser console:

```javascript
// Test 1: Check API
console.log("🧪 Testing API...");
const res = await fetch('http://localhost:4000/api/customers');
const customers = await res.json();
console.log("✅ Customers:", customers);
console.log("✅ Count:", customers.length);

// Test 2: Check database
const res2 = await fetch('http://localhost:4000/api/products');
const products = await res2.json();
console.log("✅ Products:", products.length);
```

If both return data → **Everything is working!** ✅

---

## 🎯 Default Test Data

To quickly test, add this customer via the UI:

| Field | Value |
|-------|-------|
| Company Name | Test Company |
| Contact Person | John Doe |
| Phone | 9876543210 |
| Email | test@company.com |
| GSTIN | 18AABCT1234H1Z0 |
| Address | 123 Main Street, Mumbai |

Then in Create Quotation → Buyer search → type "Test" → should appear!

---

## 📚 Files for Reference

- **DEBUGGING_GUIDE.md** - Detailed troubleshooting
- **CUSTOMER_DATA_FIX.md** - What was fixed
- **public/api-test.js** - Run in console to test API

---

## 💡 Still Stuck?

1. **Server Error?** → Check `npm run server` output
2. **DB Error?** → Run `mysql` and verify database exists
3. **API Error?** → Open Network tab (F12) and check requests
4. **No Customers?** → Add one via Customers page
5. **Still No?** → Check browser console (F12) for exact error

**The app now shows helpful error messages if anything fails!** 🎉
