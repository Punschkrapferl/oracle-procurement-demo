-- Adds cancellation metadata to purchase orders and enforces that
-- cancelled orders must store both a reason and a timestamp.

ALTER TABLE purchase_orders
    ADD (
        cancellation_reason VARCHAR2(500 CHAR),
        cancelled_at TIMESTAMP
        );

ALTER TABLE purchase_orders
    ADD CONSTRAINT ck_purchase_orders_cancellation_metadata
        CHECK (
                (status = 'CANCELLED' AND cancellation_reason IS NOT NULL AND cancelled_at IS NOT NULL)
                OR
                (status <> 'CANCELLED' AND cancellation_reason IS NULL AND cancelled_at IS NULL)
            );