package com.example.oracleprocurementdemo.purchaseorder.dto;

import io.swagger.v3.oas.annotations.media.Schema;
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
@Schema(description = "Request payload for creating a purchase order")
public class CreatePurchaseOrderRequest {

    @Schema(
            description = "Unique purchase order number",
            example = "PO-2026-1001"
    )
    @NotBlank
    @Size(max = 50)
    private String orderNumber;

    @Schema(
            description = "Id of an existing supplier",
            example = "1"
    )
    @NotNull
    @Positive
    private Long supplierId;

    @Schema(
            description = "Name of the employee requesting the order",
            example = "Punschkrapferl"
    )
    @NotBlank
    @Size(max = 100)
    private String requestedBy;

    @Schema(
            description = "Business order date",
            example = "2026-04-13"
    )
    @NotNull
    private LocalDate orderDate;

    @Schema(description = "Line items belonging to the purchase order")
    @Valid
    @NotEmpty
    private List<PurchaseOrderLineRequest> lines;
}