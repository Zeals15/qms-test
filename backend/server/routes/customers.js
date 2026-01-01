const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const requireAdmin = require("../middleware/requireAdmin");
const db = require("../db");

/**
 * EXPORT SINGLE CUSTOMER (WITH LOCATIONS + CONTACTS)
 * GET /api/customers/:id/export
 */
router.get("/customers/:id/export", auth, requireAdmin, async (req, res) => {
  const customerId = Number(req.params.id);
  if (!customerId) {
    return res.status(400).json({ error: "invalid_customer_id" });
  }

  let conn;
  try {
    conn = await db.getConnection();

    const [rows] = await conn.query(`
      SELECT
        c.company_name,
        c.gstin AS customer_gstin,
        c.address AS customer_address,

        l.location_name,
        l.gstin AS location_gstin,
        l.address AS location_address,
        l.city,
        l.state,

        ct.contact_name,
        ct.phone,
        ct.email,
        ct.is_primary

      FROM customers c
      LEFT JOIN customer_locations l ON l.customer_id = c.id AND l.is_active = 1
      LEFT JOIN customer_contacts ct ON ct.customer_location_id = l.id AND ct.is_active = 1
      WHERE c.id = ?
      ORDER BY l.location_name, ct.is_primary DESC, ct.contact_name
    `, [customerId]);

    if (!rows.length) {
      return res.status(404).json({ error: "customer_not_found" });
    }

    // CSV HEADER
    let csv = [
      [
        "Customer Name",
        "Customer GSTIN",
        "Customer Address",
        "Location",
        "Location GSTIN",
        "Location Address",
        "City",
        "State",
        "Contact Name",
        "Phone",
        "Email",
        "Primary Contact"
      ].join(",")
    ];

    for (const r of rows) {
      csv.push([
        r.company_name,
        r.customer_gstin || "",
        r.customer_address || "",
        r.location_name || "",
        r.location_gstin || "",
        r.location_address || "",
        r.city || "",
        r.state || "",
        r.contact_name || "",
        r.phone || "",
        r.email || "",
        r.is_primary ? "YES" : "NO"
      ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(","));
    }

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=customer_${customerId}.csv`
    );

    res.send(csv.join("\n"));

  } catch (err) {
    console.error("Customer export error:", err);
    res.status(500).json({ error: "export_failed" });
  } finally {
    if (conn) conn.release();
  }
});

/**
 * EXPORT SINGLE CUSTOMER (WITH LOCATIONS + CONTACTS)
 * GET /api/customers/:id/export
 */
router.get("/customers/:id/export", auth, requireAdmin, async (req, res) => {
  const customerId = Number(req.params.id);
  if (!customerId) {
    return res.status(400).json({ error: "invalid_customer_id" });
  }

  let conn;
  try {
    conn = await db.getConnection();

    const [rows] = await conn.query(`
      SELECT
        c.company_name,
        c.gstin AS customer_gstin,
        c.address AS customer_address,

        l.location_name,
        l.gstin AS location_gstin,
        l.address AS location_address,
        l.city,
        l.state,

        ct.contact_name,
        ct.phone,
        ct.email,
        ct.is_primary

      FROM customers c
      LEFT JOIN customer_locations l ON l.customer_id = c.id AND l.is_active = 1
      LEFT JOIN customer_contacts ct ON ct.customer_location_id = l.id AND ct.is_active = 1
      WHERE c.id = ?
      ORDER BY l.location_name, ct.is_primary DESC, ct.contact_name
    `, [customerId]);

    if (!rows.length) {
      return res.status(404).json({ error: "customer_not_found" });
    }

    let csv = [
      [
        "Customer Name",
        "Customer GSTIN",
        "Customer Address",
        "Location",
        "Location GSTIN",
        "Location Address",
        "City",
        "State",
        "Contact Name",
        "Phone",
        "Email",
        "Primary Contact"
      ].join(",")
    ];

    for (const r of rows) {
      csv.push(
        [
          r.company_name,
          r.customer_gstin || "",
          r.customer_address || "",
          r.location_name || "",
          r.location_gstin || "",
          r.location_address || "",
          r.city || "",
          r.state || "",
          r.contact_name || "",
          r.phone || "",
          r.email || "",
          r.is_primary ? "YES" : "NO"
        ]
          .map(v => `"${String(v).replace(/"/g, '""')}"`)
          .join(",")
      );
    }

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=customer_${customerId}.csv`
    );

    res.send(csv.join("\n"));
  } catch (err) {
    console.error("Customer export error:", err);
    res.status(500).json({ error: "export_failed" });
  } finally {
    if (conn) conn.release();
  }
});

module.exports = router;
