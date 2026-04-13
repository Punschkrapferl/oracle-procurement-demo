package com.example.oracleprocurementdemo.purchaseorder.dto;

import com.example.oracleprocurementdemo.purchaseorder.entity.PurchaseOrderStatus;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PurchaseOrderResponse {

    private Long id;
    private String orderNumber;
    private Long supplierId;
    private String supplierCode;
    private PurchaseOrderStatus status;
    private String requestedBy;
    private LocalDate orderDate;
    private BigDecimal totalAmount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<PurchaseOrderLineResponse> lines;
}