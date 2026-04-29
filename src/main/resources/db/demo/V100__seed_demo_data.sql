-- Optional demo seed data for Oracle Procurement Demo.
--
-- IMPORTANT:
-- This file is intentionally stored under db/demo, not db/migration.
-- The configured Flyway location is classpath:db/migration, so this script is not executed automatically.
--
-- Run this only against a disposable local/demo Oracle database when you want realistic sample data.
--
-- Re-run safety:
-- The cleanup below deletes only the demo rows inserted by this script, identified by fixed
-- order numbers and supplier codes. It does not wipe arbitrary business data.

-- Expected result after running this script:
-- 4 suppliers:
--   3 active suppliers
--   1 inactive supplier
--
-- 4 purchase orders:
--   1 DRAFT
--   1 SUBMITTED
--   1 APPROVED
--   1 CANCELLED
--
-- 8 purchase order lines

-- =========================================================
-- Remove previous rows created by this demo seed only
-- =========================================================

-- Demo cleanup only:
-- Delete line items belonging to the fixed demo purchase order numbers below.
-- This intentionally does not delete unrelated purchase order lines.
DELETE FROM purchase_order_lines
WHERE purchase_order_id IN (
    SELECT id
    FROM purchase_orders
    WHERE order_number IN (
                           'PO-2026-1001',
                           'PO-2026-1002',
                           'PO-2026-1003',
                           'PO-2026-1004'
        )
);

-- Demo cleanup only:
-- Delete the fixed demo purchase order numbers inserted by this script.
-- This intentionally does not delete unrelated purchase orders.
DELETE FROM purchase_orders
WHERE order_number IN (
                       'PO-2026-1001',
                       'PO-2026-1002',
                       'PO-2026-1003',
                       'PO-2026-1004'
    );

-- Demo cleanup only:
-- Delete the fixed demo suppliers inserted by this script, but only when they are no longer
-- referenced by any purchase order.
--
-- If one of these suppliers is referenced by non-demo purchase order history, this DELETE will
-- leave it in place and the following INSERT may fail with a unique constraint error.
-- That is intentional: reset the demo database instead of deleting unknown business history.
DELETE FROM suppliers supplier
WHERE supplier.supplier_code IN (
                                 'SUP-1001',
                                 'SUP-1002',
                                 'SUP-1003',
                                 'SUP-1004'
    )
  AND NOT EXISTS (
    SELECT 1
    FROM purchase_orders purchase_order
    WHERE purchase_order.supplier_id = supplier.id
);

-- =========================================================
-- Suppliers
-- =========================================================

INSERT INTO suppliers (
    id,
    supplier_code,
    name,
    contact_email,
    active,
    created_at
) VALUES (
             supplier_seq.NEXTVAL,
             'SUP-1001',
             'Acme Industrial Supplies',
             'orders@acme-industrial.com',
             1,
             TIMESTAMP '2026-04-14 08:00:00'
         );

INSERT INTO suppliers (
    id,
    supplier_code,
    name,
    contact_email,
    active,
    created_at
) VALUES (
             supplier_seq.NEXTVAL,
             'SUP-1002',
             'Global Parts GmbH',
             'sales@globalparts.com',
             1,
             TIMESTAMP '2026-04-14 08:15:00'
         );

INSERT INTO suppliers (
    id,
    supplier_code,
    name,
    contact_email,
    active,
    created_at
) VALUES (
             supplier_seq.NEXTVAL,
             'SUP-1003',
             'Vertex Industrial Group',
             'orders@vertex-industrial.com',
             1,
             TIMESTAMP '2026-04-14 08:30:00'
         );

INSERT INTO suppliers (
    id,
    supplier_code,
    name,
    contact_email,
    active,
    created_at
) VALUES (
             supplier_seq.NEXTVAL,
             'SUP-1004',
             'Round Trip Supply GmbH',
             'orders@roundtrip-supply.com',
             0,
             TIMESTAMP '2026-04-14 08:45:00'
         );

-- =========================================================
-- Purchase Order: DRAFT
-- =========================================================

INSERT INTO purchase_orders (
    id,
    order_number,
    supplier_id,
    status,
    requested_by,
    order_date,
    total_amount,
    cancellation_reason,
    cancelled_at,
    created_at,
    updated_at
) VALUES (
             purchase_order_seq.NEXTVAL,
             'PO-2026-1001',
             (SELECT id FROM suppliers WHERE supplier_code = 'SUP-1001'),
             'DRAFT',
             'Punschkrapferl',
             DATE '2026-04-14',
             111.50,
             NULL,
             NULL,
             TIMESTAMP '2026-04-14 09:00:00',
             TIMESTAMP '2026-04-14 09:00:00'
         );

INSERT INTO purchase_order_lines (
    id,
    purchase_order_id,
    line_number,
    item_description,
    quantity,
    unit_price,
    line_total
) VALUES (
             purchase_order_line_seq.NEXTVAL,
             (SELECT id FROM purchase_orders WHERE order_number = 'PO-2026-1001'),
             1,
             'Industrial safety gloves',
             10,
             4.90,
             49.00
         );

INSERT INTO purchase_order_lines (
    id,
    purchase_order_id,
    line_number,
    item_description,
    quantity,
    unit_price,
    line_total
) VALUES (
             purchase_order_line_seq.NEXTVAL,
             (SELECT id FROM purchase_orders WHERE order_number = 'PO-2026-1001'),
             2,
             'Protective safety goggles',
             5,
             12.50,
             62.50
         );

-- =========================================================
-- Purchase Order: SUBMITTED
-- =========================================================

INSERT INTO purchase_orders (
    id,
    order_number,
    supplier_id,
    status,
    requested_by,
    order_date,
    total_amount,
    cancellation_reason,
    cancelled_at,
    created_at,
    updated_at
) VALUES (
             purchase_order_seq.NEXTVAL,
             'PO-2026-1002',
             (SELECT id FROM suppliers WHERE supplier_code = 'SUP-1002'),
             'SUBMITTED',
             'Marino',
             DATE '2026-04-15',
             350.00,
             NULL,
             NULL,
             TIMESTAMP '2026-04-15 10:00:00',
             TIMESTAMP '2026-04-15 10:30:00'
         );

INSERT INTO purchase_order_lines (
    id,
    purchase_order_id,
    line_number,
    item_description,
    quantity,
    unit_price,
    line_total
) VALUES (
             purchase_order_line_seq.NEXTVAL,
             (SELECT id FROM purchase_orders WHERE order_number = 'PO-2026-1002'),
             1,
             'Warehouse barcode scanner',
             2,
             125.00,
             250.00
         );

INSERT INTO purchase_order_lines (
    id,
    purchase_order_id,
    line_number,
    item_description,
    quantity,
    unit_price,
    line_total
) VALUES (
             purchase_order_line_seq.NEXTVAL,
             (SELECT id FROM purchase_orders WHERE order_number = 'PO-2026-1002'),
             2,
             'Thermal label rolls',
             10,
             10.00,
             100.00
         );

-- =========================================================
-- Purchase Order: APPROVED
-- =========================================================

INSERT INTO purchase_orders (
    id,
    order_number,
    supplier_id,
    status,
    requested_by,
    order_date,
    total_amount,
    cancellation_reason,
    cancelled_at,
    created_at,
    updated_at
) VALUES (
             purchase_order_seq.NEXTVAL,
             'PO-2026-1003',
             (SELECT id FROM suppliers WHERE supplier_code = 'SUP-1003'),
             'APPROVED',
             'Nina',
             DATE '2026-04-16',
             1275.00,
             NULL,
             NULL,
             TIMESTAMP '2026-04-16 11:00:00',
             TIMESTAMP '2026-04-16 12:00:00'
         );

INSERT INTO purchase_order_lines (
    id,
    purchase_order_id,
    line_number,
    item_description,
    quantity,
    unit_price,
    line_total
) VALUES (
             purchase_order_line_seq.NEXTVAL,
             (SELECT id FROM purchase_orders WHERE order_number = 'PO-2026-1003'),
             1,
             'Conveyor belt spare kit',
             1,
             850.00,
             850.00
         );

INSERT INTO purchase_order_lines (
    id,
    purchase_order_id,
    line_number,
    item_description,
    quantity,
    unit_price,
    line_total
) VALUES (
             purchase_order_line_seq.NEXTVAL,
             (SELECT id FROM purchase_orders WHERE order_number = 'PO-2026-1003'),
             2,
             'Optical sensor module',
             5,
             85.00,
             425.00
         );

-- =========================================================
-- Purchase Order: CANCELLED
-- Linked to inactive supplier to demonstrate historical data.
-- =========================================================

INSERT INTO purchase_orders (
    id,
    order_number,
    supplier_id,
    status,
    requested_by,
    order_date,
    total_amount,
    cancellation_reason,
    cancelled_at,
    created_at,
    updated_at
) VALUES (
             purchase_order_seq.NEXTVAL,
             'PO-2026-1004',
             (SELECT id FROM suppliers WHERE supplier_code = 'SUP-1004'),
             'CANCELLED',
             'Punschkrapferl',
             DATE '2026-04-17',
             486.00,
             'Supplier could not confirm the delivery timeline',
             TIMESTAMP '2026-04-17 15:30:00',
             TIMESTAMP '2026-04-17 13:00:00',
             TIMESTAMP '2026-04-17 15:30:00'
         );

INSERT INTO purchase_order_lines (
    id,
    purchase_order_id,
    line_number,
    item_description,
    quantity,
    unit_price,
    line_total
) VALUES (
             purchase_order_line_seq.NEXTVAL,
             (SELECT id FROM purchase_orders WHERE order_number = 'PO-2026-1004'),
             1,
             'Packaging workstation tools',
             3,
             92.00,
             276.00
         );

INSERT INTO purchase_order_lines (
    id,
    purchase_order_id,
    line_number,
    item_description,
    quantity,
    unit_price,
    line_total
) VALUES (
             purchase_order_line_seq.NEXTVAL,
             (SELECT id FROM purchase_orders WHERE order_number = 'PO-2026-1004'),
             2,
             'Replacement packing scale',
             1,
             210.00,
             210.00
         );

COMMIT;