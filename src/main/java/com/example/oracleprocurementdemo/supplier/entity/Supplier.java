package com.example.oracleprocurementdemo.supplier.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.SequenceGenerator;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import com.example.oracleprocurementdemo.common.persistence.BooleanToNumberConverter;
import jakarta.persistence.Convert;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "suppliers")
public class Supplier {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "supplier_seq_generator")
    @SequenceGenerator(
            name = "supplier_seq_generator",
            sequenceName = "supplier_seq",
            allocationSize = 1
    )
    private Long id;

    @Column(name = "supplier_code", nullable = false, unique = true, length = 50)
    private String supplierCode;

    @Column(name = "name", nullable = false, length = 200)
    private String name;

    @Column(name = "contact_email", nullable = false, length = 200)
    private String contactEmail;

    /*
     * Oracle stores active flags as NUMBER(1), not as a native BOOLEAN.
     *
     * The Java entity uses Boolean for readability, while the Flyway schema
     * stores the value as NUMBER(1). BooleanToNumberConverter keeps both sides
     * aligned by converting:
     *
     * true  -> 1
     * false -> 0
     *
     * This prevents Hibernate from trying to bind a Java Boolean directly to
     * an Oracle NUMBER column.
     */
    @Convert(converter = BooleanToNumberConverter.class)
    @Column(name = "active", nullable = false)
    private Boolean active = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /*
     * Supplier intentionally does not have a Supplier -> PurchaseOrder cascading
     * @OneToMany relationship.
     *
     * Purchase orders are business history and audit-relevant records.
     * They must not be deleted or modified accidentally through supplier persistence.
     *
     * The relationship is still represented from the owning side:
     * PurchaseOrder -> Supplier via @ManyToOne.
     */
    @PrePersist
    void prePersist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }

        if (active == null) {
            active = Boolean.TRUE;
        }
    }
}