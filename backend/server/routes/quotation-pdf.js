// quotation-pdf.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const renderPdf = require('../pdf/renderQuotationPdf');
const buildHtml = require('../pdf/buildQuotationHtml');

router.get('/:id/pdf', async (req, res) => {
  const id = req.params.id;

  const [rows] = await db.query(
    'SELECT * FROM quotations WHERE id = ? AND is_deleted = 0',
    [id]
  );

  if (!rows.length) return res.status(404).send('Not found');

  const q = rows[0];
  q.items = JSON.parse(q.items || '[]');

  const html = buildHtml(q);
  const pdf = await renderPdf(html);

  const filename =
    `${q.quotation_no}_v${q.version}.pdf`.replace(/[\/\\]/g, '_');

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(pdf);
});

module.exports = router;
