package com.example.oracleprocurementdemo.supplier.dto;

import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SupplierResponse {

    private Long id;
    private String supplierCode;
    private String name;
    private String contactEmail;
    private Boolean active;
    private LocalDateTime createdAt;
}