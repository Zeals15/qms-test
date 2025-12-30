module.exports = function buildQuotationHtml(q) {
  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>
body { font-family: Arial; font-size: 12px; }
table { width: 100%; border-collapse: collapse; }
th, td { border: 1px solid #ddd; padding: 8px; }
th { background: #f4f4f4; }
.header { display:flex; justify-content:space-between; }
</style>
</head>

<body>
<div class="header">
  <div>
    <h2>Quotation</h2>
    <p><b>No:</b> ${q.quotation_no}</p>
    <p><b>Date:</b> ${q.created_at}</p>
  </div>
</div>

<hr />

<p><b>Customer:</b> ${q.customer_name}</p>

<table>
<thead>
<tr>
  <th>#</th>
  <th>Description</th>
  <th>Qty</th>
  <th>Rate</th>
  <th>Total</th>
</tr>
</thead>
<tbody>
${q.items.map((it, i) => `
<tr>
<td>${i + 1}</td>
<td>${it.product_name || it.description}</td>
<td>${it.qty}</td>
<td>${it.unit_price}</td>
<td>${it.qty * it.unit_price}</td>
</tr>
`).join('')}
</tbody>
</table>

<h3 style="text-align:right">Grand Total: ₹${q.total_value}</h3>

</body>
</html>
`;
};
