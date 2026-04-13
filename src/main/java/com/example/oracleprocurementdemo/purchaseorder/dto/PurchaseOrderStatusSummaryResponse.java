package com.example.oracleprocurementdemo.purchaseorder.dto;

import com.example.oracleprocurementdemo.purchaseorder.entity.PurchaseOrderStatus;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class PurchaseOrderStatusSummaryResponse {

    private PurchaseOrderStatus status;
    private Long count;

    public PurchaseOrderStatusSummaryResponse(PurchaseOrderStatus status, Long count) {
        this.status = status;
        this.count = count;
    }
}