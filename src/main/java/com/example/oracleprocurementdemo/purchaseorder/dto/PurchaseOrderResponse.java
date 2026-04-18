package com.example.oracleprocurementdemo.purchaseorder.dto;

import com.example.oracleprocurementdemo.purchaseorder.entity.PurchaseOrderStatus;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class PurchaseOrderResponse {

    private Long id;
    private String orderNumber;
    private Long supplierId;
    private String supplierCode;
    private String supplierName;
    private PurchaseOrderStatus status;
    private String requestedBy;
    private LocalDate orderDate;
    private BigDecimal totalAmount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String cancellationReason;
    private LocalDateTime cancelledAt;
    private List<PurchaseOrderLineResponse> lines;

    public PurchaseOrderResponse(
            Long id,
            String orderNumber,
            Long supplierId,
            String supplierCode,
            String supplierName,
            PurchaseOrderStatus status,
            String requestedBy,
            LocalDate orderDate,
            BigDecimal totalAmount,
            LocalDateTime createdAt,
            LocalDateTime updatedAt,
            String cancellationReason,
            LocalDateTime cancelledAt,
            List<PurchaseOrderLineResponse> lines
    ) {
        this.id = id;
        this.orderNumber = orderNumber;
        this.supplierId = supplierId;
        this.supplierCode = supplierCode;
        this.supplierName = supplierName;
        this.status = status;
        this.requestedBy = requestedBy;
        this.orderDate = orderDate;
        this.totalAmount = totalAmount;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.cancellationReason = cancellationReason;
        this.cancelledAt = cancelledAt;
        this.lines = lines;
    }

    public PurchaseOrderResponse(
            Long id,
            String orderNumber,
            Long supplierId,
            String supplierCode,
            PurchaseOrderStatus status,
            String requestedBy,
            LocalDate orderDate,
            BigDecimal totalAmount,
            LocalDateTime createdAt,
            LocalDateTime updatedAt,
            String cancellationReason,
            LocalDateTime cancelledAt,
            List<PurchaseOrderLineResponse> lines
    ) {
        this(
                id,
                orderNumber,
                supplierId,
                supplierCode,
                null,
                status,
                requestedBy,
                orderDate,
                totalAmount,
                createdAt,
                updatedAt,
                cancellationReason,
                cancelledAt,
                lines
        );
    }
}