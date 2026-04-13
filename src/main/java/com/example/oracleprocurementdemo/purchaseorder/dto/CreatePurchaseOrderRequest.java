package com.example.oracleprocurementdemo.purchaseorder.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.util.List;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class CreatePurchaseOrderRequest {

    @NotBlank
    @Size(max = 50)
    private String orderNumber;

    @NotNull
    @Positive
    private Long supplierId;

    @NotBlank
    @Size(max = 100)
    private String requestedBy;

    @NotNull
    private LocalDate orderDate;

    @Valid
    @NotEmpty
    private List<PurchaseOrderLineRequest> lines;
}