package com.example.oracleprocurementdemo.purchaseorder.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Schema(description = "Request payload for cancelling an approved purchase order")
public class CancelPurchaseOrderRequest {

    @Schema(
            description = "Business reason for cancelling an approved purchase order",
            example = "Supplier could not confirm the delivery timeline"
    )
    @NotBlank
    @Size(max = 500)
    private String reason;
}