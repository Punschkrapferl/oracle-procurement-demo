-- Creates the Oracle sequences used by the supplier, purchase order,
-- and purchase order line entities.

CREATE SEQUENCE supplier_seq
    START WITH 1
    INCREMENT BY 1
    NOCACHE
    NOCYCLE;

CREATE SEQUENCE purchase_order_seq
    START WITH 1
    INCREMENT BY 1
    NOCACHE
    NOCYCLE;

CREATE SEQUENCE purchase_order_line_seq
    START WITH 1
    INCREMENT BY 1
    NOCACHE
    NOCYCLE;