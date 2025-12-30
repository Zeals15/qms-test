const express = require("express");
const router = express.Router();
const db = require("../db");
const authMiddleware = require("../middleware/auth");

/* ========================================
   Helpers
======================================== */

function roleFilter(req, alias = "q") {
  if (req.user.role === "admin") return { sql: "", params: [] };
  return {
    sql: `AND ${alias}.salesperson_id = ?`,
    params: [req.user.id],
  };
}

/* ========================================
   GET /api/dashboard/summary
======================================== */
router.get("/summary", authMiddleware, async (req, res) => {
  let conn;
  try {
    conn = await db.getConnection();
    const role = roleFilter(req);

    const [[summary]] = await conn.query(
      `
      SELECT

         SUM(CASE WHEN q.status = 'won' THEN 1 ELSE 0 END) AS won,
    SUM(CASE WHEN q.status = 'lost' THEN 1 ELSE 0 END) AS lost,

    SUM(
      CASE
        WHEN q.status = 'won' THEN q.total_value
        ELSE 0
      END
    ) AS won_revenue,

        SUM(
          CASE
            WHEN DATEDIFF(
              DATE_ADD(q.quotation_date, INTERVAL q.validity_days DAY),
              CURRENT_DATE
            ) < 0 THEN 1 ELSE 0
          END
        ) AS expired,

        SUM(
          CASE
            WHEN DATEDIFF(
              DATE_ADD(q.quotation_date, INTERVAL q.validity_days DAY),
              CURRENT_DATE
            ) = 0 THEN 1 ELSE 0
          END
        ) AS expiring_today,

        SUM(
          CASE
            WHEN DATEDIFF(
              DATE_ADD(q.quotation_date, INTERVAL q.validity_days DAY),
              CURRENT_DATE
            ) BETWEEN 1 AND 3 THEN 1 ELSE 0
          END
        ) AS expiring_soon,

        SUM(q.total_value) AS portfolio_value
      FROM quotations q
      WHERE q.is_deleted = 0
      AND q.reissued_from_id IS NULL
      ${role.sql}
      `,
      role.params
    );

    const [[followups]] = await conn.query(
      `
      SELECT
        SUM(
          CASE
            WHEN DATE(f.next_followup_date) = CURRENT_DATE
                 AND f.is_completed = 0 THEN 1 ELSE 0
          END
        ) AS due_today,

        SUM(
          CASE
            WHEN DATE(f.next_followup_date) < CURRENT_DATE
                 AND f.is_completed = 0 THEN 1 ELSE 0
          END
        ) AS overdue
      FROM quotation_followups f
      INNER JOIN quotations q ON q.id = f.quotation_id
      WHERE q.is_deleted = 0
      ${role.sql}
      `,
      role.params
    );

    res.json({
      ...summary,
      expiring_today: summary.expiring_today,
      expiring_soon: summary.expiring_soon,
      followups_due_today: followups.due_today,
      followups_overdue: followups.overdue,

     
    });
  } catch (err) {
    console.error("Dashboard summary error:", err);
    res.status(500).json({ error: "Dashboard summary failed" });
  } finally {
    if (conn) conn.release();
  }
});

/* ========================================
   GET /api/dashboard/action-quotations
======================================== */
router.get("/action-quotations", authMiddleware, async (req, res) => {
  let conn;
  try {
    conn = await db.getConnection();
    const role = roleFilter(req);

    const [rows] = await conn.query(
      `
      SELECT
        q.id,
        q.quotation_no,
        COALESCE(
  JSON_UNQUOTE(JSON_EXTRACT(q.customer_snapshot, '$.company_name')),
  c.company_name,
  q.customer_name
) AS company_name,

        DATE_ADD(
          q.quotation_date,
          INTERVAL q.validity_days DAY
        ) AS valid_until,

        DATEDIFF(
          DATE_ADD(q.quotation_date, INTERVAL q.validity_days DAY),
          CURRENT_DATE
        ) AS remaining_days,

        u.name AS salesperson_name,
        MAX(f.created_at) AS last_followup_at,

        CASE
          WHEN COUNT(f.id) = 0 THEN 1 ELSE 0
        END AS no_followup

      FROM quotations q
      INNER JOIN users u ON u.id = q.salesperson_id
      LEFT JOIN quotation_followups f
        ON f.quotation_id = q.id
        AND f.is_completed = 1
        LEFT JOIN customers c ON c.id = q.customer_id

      WHERE q.is_deleted = 0
  AND q.reissued_from_id IS NULL

   AND DATEDIFF(
    DATE_ADD(q.quotation_date, INTERVAL q.validity_days DAY),
    CURRENT_DATE
  ) >= 0


  AND (
    DATEDIFF(
      DATE_ADD(q.quotation_date, INTERVAL q.validity_days DAY),
      CURRENT_DATE
    ) <= 3
    OR NOT EXISTS (
      SELECT 1
      FROM quotation_followups fx
      WHERE fx.quotation_id = q.id
    )
  )
      ${role.sql}

      GROUP BY q.id
      ORDER BY remaining_days ASC, last_followup_at ASC
      LIMIT 10
      `,
      role.params
    );

    res.json(rows);
  } catch (err) {
    console.error("Action quotations error:", err);
    res.status(500).json({ error: "Action quotations failed" });
  } finally {
    if (conn) conn.release();
  }
});

/* ========================================
   GET /api/dashboard/followups-due
======================================== */
router.get("/followups-due", authMiddleware, async (req, res) => {
  let conn;
  try {
    conn = await db.getConnection();
    const role = roleFilter(req, "q");

    const [rows] = await conn.query(
      `
      SELECT
        f.id,
        f.quotation_id,
        q.quotation_no,

        /* ✅ CUSTOMER NAME — SNAPSHOT SAFE */
        COALESCE(
          JSON_UNQUOTE(JSON_EXTRACT(q.customer_snapshot, '$.company_name')),
          c.company_name,
          q.customer_name
        ) AS company_name,

        f.followup_type,
        f.next_followup_date,
        u.name AS salesperson_name

      FROM quotation_followups f
      INNER JOIN quotations q ON q.id = f.quotation_id
      LEFT JOIN customers c ON c.id = q.customer_id
      INNER JOIN users u ON u.id = q.salesperson_id

      WHERE f.is_completed = 0
        AND DATE(f.next_followup_date) <= CURRENT_DATE
        AND q.is_deleted = 0
        ${role.sql}

      ORDER BY f.next_followup_date ASC
      `,
      role.params
    );

    res.json(rows);
  } catch (err) {
    console.error("Followups due error:", err);
    res.status(500).json({ error: "Follow-ups due failed" });
  } finally {
    if (conn) conn.release();
  }
});


module.exports = router;
