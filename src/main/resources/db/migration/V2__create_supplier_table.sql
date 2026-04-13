CREATE TABLE suppliers (
                           id NUMBER(19) NOT NULL,
                           supplier_code VARCHAR2(50 CHAR) NOT NULL,
                           name VARCHAR2(150 CHAR) NOT NULL,
                           contact_email VARCHAR2(150 CHAR) NOT NULL,
                           active NUMBER(1) DEFAULT 1 NOT NULL,
                           created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,

                           CONSTRAINT pk_suppliers PRIMARY KEY (id),
                           CONSTRAINT uk_suppliers_supplier_code UNIQUE (supplier_code),
                           CONSTRAINT ck_suppliers_active CHECK (active IN (0, 1))
);