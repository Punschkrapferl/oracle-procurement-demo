-- Creates the purchase order line table and enforces line-level
-- quantity, pricing, and uniqueness rules.

CREATE TABLE purchase_order_lines (
                                      id NUMBER(19) NOT NULL,
                                      purchase_order_id NUMBER(19) NOT NULL,
                                      line_number NUMBER(10) NOT NULL,
                                      item_description VARCHAR2(255 CHAR) NOT NULL,
                                      quantity NUMBER(10) NOT NULL,
                                      unit_price NUMBER(12, 2) NOT NULL,
                                      line_total NUMBER(12, 2) NOT NULL,

                                      CONSTRAINT pk_purchase_order_lines PRIMARY KEY (id),
                                      CONSTRAINT fk_purchase_order_lines_order
                                          FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders (id),
                                      CONSTRAINT uk_purchase_order_lines_order_line
                                          UNIQUE (purchase_order_id, line_number),
                                      CONSTRAINT ck_purchase_order_lines_quantity
                                          CHECK (quantity > 0),
                                      CONSTRAINT ck_purchase_order_lines_unit_price
                                          CHECK (unit_price >= 0),
                                      CONSTRAINT ck_purchase_order_lines_line_total
                                          CHECK (line_total >= 0)
);

CREATE INDEX idx_purchase_order_lines_order_id
    ON purchase_order_lines (purchase_order_id);