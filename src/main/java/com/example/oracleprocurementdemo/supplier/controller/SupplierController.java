package com.example.oracleprocurementdemo.supplier.controller;

import com.example.oracleprocurementdemo.common.api.ApiPaths;
import com.example.oracleprocurementdemo.supplier.dto.CreateSupplierRequest;
import com.example.oracleprocurementdemo.supplier.dto.SupplierResponse;
import com.example.oracleprocurementdemo.supplier.dto.UpdateSupplierRequest;
import com.example.oracleprocurementdemo.supplier.service.SupplierService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(ApiPaths.SUPPLIERS)
@Tag(name = "Suppliers", description = "Supplier management endpoints")
public class SupplierController {

    private final SupplierService supplierService;

    public SupplierController(SupplierService supplierService) {
        this.supplierService = supplierService;
    }

    @GetMapping
    @Operation(summary = "List all suppliers")
    public List<SupplierResponse> getAllSuppliers() {
        return supplierService.getAllSuppliers();
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a supplier by id")
    public SupplierResponse getSupplierById(@PathVariable Long id) {
        return supplierService.getSupplierById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Create a new supplier")
    @io.swagger.v3.oas.annotations.parameters.RequestBody(
            required = true,
            content = @Content(
                    mediaType = MediaType.APPLICATION_JSON_VALUE,
                    examples = @ExampleObject(
                            name = "Create supplier",
                            value = """
                                    {
                                      "supplierCode": "SUP-1001",
                                      "name": "Acme Industrial Supplies",
                                      "contactEmail": "orders@acme-industrial.com",
                                      "active": true
                                    }
                                    """
                    )
            )
    )
    public SupplierResponse createSupplier(@Valid @RequestBody CreateSupplierRequest request) {
        return supplierService.createSupplier(request);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update an existing supplier")
    @io.swagger.v3.oas.annotations.parameters.RequestBody(
            required = true,
            content = @Content(
                    mediaType = MediaType.APPLICATION_JSON_VALUE,
                    examples = @ExampleObject(
                            name = "Update supplier",
                            value = """
                                    {
                                      "supplierCode": "SUP-1001",
                                      "name": "Acme Industrial Supplies Europe",
                                      "contactEmail": "procurement@acme-industrial.com",
                                      "active": true
                                    }
                                    """
                    )
            )
    )
    public SupplierResponse updateSupplier(
            @PathVariable Long id,
            @Valid @RequestBody UpdateSupplierRequest request
    ) {
        return supplierService.updateSupplier(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Delete a supplier that has no purchase order history")
    public void deleteSupplier(@PathVariable Long id) {
        supplierService.deleteSupplier(id);
    }
}