-- Creates the purchase order header table with workflow status and
-- basic consistency constraints.

CREATE TABLE purchase_orders (
                                 id NUMBER(19) NOT NULL,
                                 order_number VARCHAR2(50 CHAR) NOT NULL,
                                 supplier_id NUMBER(19) NOT NULL,
                                 status VARCHAR2(20 CHAR) NOT NULL,
                                 requested_by VARCHAR2(100 CHAR) NOT NULL,
                                 order_date DATE NOT NULL,
                                 total_amount NUMBER(12, 2) DEFAULT 0 NOT NULL,
                                 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
                                 updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,

                                 CONSTRAINT pk_purchase_orders PRIMARY KEY (id),
                                 CONSTRAINT uk_purchase_orders_order_number UNIQUE (order_number),
                                 CONSTRAINT fk_purchase_orders_supplier
                                     FOREIGN KEY (supplier_id) REFERENCES suppliers (id),
                                 CONSTRAINT ck_purchase_orders_status
                                     CHECK (status IN ('DRAFT', 'SUBMITTED', 'APPROVED', 'CANCELLED')),
                                 CONSTRAINT ck_purchase_orders_total_amount
                                     CHECK (total_amount >= 0)
);

CREATE INDEX idx_purchase_orders_supplier_id
    ON purchase_orders (supplier_id);

CREATE INDEX idx_purchase_orders_status
    ON purchase_orders (status);