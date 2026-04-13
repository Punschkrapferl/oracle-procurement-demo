package com.example.oracleprocurementdemo.supplier.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Schema(description = "Request payload for creating a supplier")
public class CreateSupplierRequest {

    @Schema(
            description = "Unique business identifier for the supplier",
            example = "SUP-1001"
    )
    @NotBlank
    @Size(max = 50)
    private String supplierCode;

    @Schema(
            description = "Supplier display name",
            example = "Acme Industrial Supplies"
    )
    @NotBlank
    @Size(max = 150)
    private String name;

    @Schema(
            description = "Supplier contact email address",
            example = "orders@acme-industrial.com"
    )
    @NotBlank
    @Email
    @Size(max = 150)
    private String contactEmail;

    @Schema(
            description = "Whether the supplier is active and can be used for purchase orders",
            example = "true"
    )
    private Boolean active;
}