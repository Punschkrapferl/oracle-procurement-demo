package com.example.oracleprocurementdemo.purchaseorder.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Schema(description = "Request payload for one purchase order line")
public class PurchaseOrderLineRequest {

    @Schema(
            description = "Sequential business line number within the order",
            example = "1"
    )
    @NotNull
    @Positive
    private Integer lineNumber;

    @Schema(
            description = "Description of the requested item",
            example = "Industrial safety gloves"
    )
    @NotBlank
    @Size(max = 255)
    private String itemDescription;

    @Schema(
            description = "Requested quantity",
            example = "50"
    )
    @NotNull
    @Positive
    private Integer quantity;

    @Schema(
            description = "Price per unit",
            example = "4.90"
    )
    @NotNull
    @DecimalMin(value = "0.00")
    @Digits(integer = 10, fraction = 2)
    private BigDecimal unitPrice;
}