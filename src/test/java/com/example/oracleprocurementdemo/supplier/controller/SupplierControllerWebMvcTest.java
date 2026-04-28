package com.example.oracleprocurementdemo.supplier.controller;

import com.example.oracleprocurementdemo.common.api.ApiPaths;
import com.example.oracleprocurementdemo.common.exception.GlobalExceptionHandler;
import com.example.oracleprocurementdemo.common.exception.ResourceConflictException;
import com.example.oracleprocurementdemo.common.exception.ResourceNotFoundException;
import com.example.oracleprocurementdemo.supplier.dto.SupplierResponse;
import com.example.oracleprocurementdemo.supplier.service.SupplierService;
import java.time.LocalDateTime;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(SupplierController.class)
@Import(GlobalExceptionHandler.class)
class SupplierControllerWebMvcTest {

    @Autowired
    private MockMvc mockMvc;

    /*
     * Initialized by Spring's test context.
     * IntelliJ may show "never assigned", but @MockitoBean creates and injects this mock.
     */
    @MockitoBean
    private SupplierService supplierService;

    @Test
    @DisplayName("POST /api/v1/suppliers returns 201 and the created supplier")
    void createSupplier_shouldReturnCreatedSupplier() throws Exception {
        SupplierResponse response = new SupplierResponse(
                1L,
                "SUP-1001",
                "Acme Industrial Supplies",
                "orders@acme-industrial.com",
                true,
                LocalDateTime.of(2026, 4, 14, 12, 0, 0)
        );

        when(supplierService.createSupplier(any())).thenReturn(response);

        String requestBody = """
                {
                  "supplierCode": "SUP-1001",
                  "name": "Acme Industrial Supplies",
                  "contactEmail": "orders@acme-industrial.com",
                  "active": true
                }
                """;

        mockMvc.perform(post(ApiPaths.SUPPLIERS)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.supplierCode").value("SUP-1001"))
                .andExpect(jsonPath("$.name").value("Acme Industrial Supplies"))
                .andExpect(jsonPath("$.contactEmail").value("orders@acme-industrial.com"))
                .andExpect(jsonPath("$.active").value(true))
                .andExpect(jsonPath("$.createdAt").value("2026-04-14T12:00:00"));
    }

    @Test
    @DisplayName("POST /api/v1/suppliers returns 400 when request validation fails")
    void createSupplier_shouldReturnBadRequest_whenValidationFails() throws Exception {
        String requestBody = """
                {
                  "supplierCode": "",
                  "name": "",
                  "contactEmail": "not-an-email",
                  "active": true
                }
                """;

        mockMvc.perform(post(ApiPaths.SUPPLIERS)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.error").value("Bad Request"))
                .andExpect(jsonPath("$.message").value("Validation failed"))
                .andExpect(jsonPath("$.path").value(ApiPaths.SUPPLIERS))
                .andExpect(jsonPath("$.validationErrors.supplierCode").value("must not be blank"))
                .andExpect(jsonPath("$.validationErrors.name").value("must not be blank"))
                .andExpect(jsonPath("$.validationErrors.contactEmail").value("must be a well-formed email address"));
    }

    @Test
    @DisplayName("PUT /api/v1/suppliers/{id} returns 200 and the updated supplier")
    void updateSupplier_shouldReturnUpdatedSupplier() throws Exception {
        SupplierResponse response = new SupplierResponse(
                3L,
                "SUP-3001",
                "Updated Supplier Name",
                "updated@email.com",
                false,
                LocalDateTime.of(2026, 4, 14, 13, 0, 0)
        );

        when(supplierService.updateSupplier(eq(3L), any())).thenReturn(response);

        String requestBody = """
                {
                  "supplierCode": "SUP-3001",
                  "name": "Updated Supplier Name",
                  "contactEmail": "updated@email.com",
                  "active": false
                }
                """;

        mockMvc.perform(put(ApiPaths.SUPPLIERS + "/{id}", 3L)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(3))
                .andExpect(jsonPath("$.supplierCode").value("SUP-3001"))
                .andExpect(jsonPath("$.name").value("Updated Supplier Name"))
                .andExpect(jsonPath("$.contactEmail").value("updated@email.com"))
                .andExpect(jsonPath("$.active").value(false))
                .andExpect(jsonPath("$.createdAt").value("2026-04-14T13:00:00"));
    }

    @Test
    @DisplayName("PUT /api/v1/suppliers/{id} returns 400 when active is missing")
    void updateSupplier_shouldReturnBadRequest_whenActiveIsMissing() throws Exception {
        String requestBody = """
                {
                  "supplierCode": "SUP-1001",
                  "name": "Acme Industrial Supplies",
                  "contactEmail": "orders@acme-industrial.com"
                }
                """;

        mockMvc.perform(put(ApiPaths.SUPPLIERS + "/{id}", 1L)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.error").value("Bad Request"))
                .andExpect(jsonPath("$.message").value("Validation failed"))
                .andExpect(jsonPath("$.path").value(ApiPaths.SUPPLIERS + "/1"))
                .andExpect(jsonPath("$.validationErrors.active").value("Active status is required"));
    }

    @Test
    @DisplayName("GET /api/v1/suppliers/{id} returns 200 and the supplier")
    void getSupplierById_shouldReturnSupplier() throws Exception {
        SupplierResponse response = new SupplierResponse(
                5L,
                "SUP-2000",
                "Global Parts GmbH",
                "sales@globalparts.com",
                true,
                LocalDateTime.of(2026, 4, 14, 9, 30, 0)
        );

        when(supplierService.getSupplierById(5L)).thenReturn(response);

        mockMvc.perform(get(ApiPaths.SUPPLIERS + "/{id}", 5L))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(5))
                .andExpect(jsonPath("$.supplierCode").value("SUP-2000"))
                .andExpect(jsonPath("$.name").value("Global Parts GmbH"))
                .andExpect(jsonPath("$.contactEmail").value("sales@globalparts.com"))
                .andExpect(jsonPath("$.active").value(true))
                .andExpect(jsonPath("$.createdAt").value("2026-04-14T09:30:00"));
    }

    @Test
    @DisplayName("GET /api/v1/suppliers/{id} returns 404 when supplier does not exist")
    void getSupplierById_shouldReturnNotFound_whenSupplierDoesNotExist() throws Exception {
        when(supplierService.getSupplierById(999L))
                .thenThrow(new ResourceNotFoundException("Supplier", 999L));

        mockMvc.perform(get(ApiPaths.SUPPLIERS + "/{id}", 999L))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.error").value("Not Found"))
                .andExpect(jsonPath("$.message").value("Supplier with id 999 not found"))
                .andExpect(jsonPath("$.path").value(ApiPaths.SUPPLIERS + "/999"));
    }

    @Test
    @DisplayName("DELETE /api/v1/suppliers/{id} returns 409 when supplier cannot be deleted")
    void deleteSupplier_shouldReturnConflict_whenSupplierHasPurchaseOrders() throws Exception {
        doThrow(new ResourceConflictException(
                "Supplier cannot be deleted because purchase order history exists for it. Deactivate the supplier instead."
        )).when(supplierService).deleteSupplier(10L);

        mockMvc.perform(delete(ApiPaths.SUPPLIERS + "/{id}", 10L))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.error").value("Conflict"))
                .andExpect(jsonPath("$.message")
                        .value("Supplier cannot be deleted because purchase order history exists for it. Deactivate the supplier instead."))
                .andExpect(jsonPath("$.path").value(ApiPaths.SUPPLIERS + "/10"));
    }

    @Test
    @DisplayName("GET /api/v1/suppliers returns 200 and the supplier list")
    void getAllSuppliers_shouldReturnSupplierList() throws Exception {
        List<SupplierResponse> suppliers = List.of(
                new SupplierResponse(
                        1L,
                        "SUP-1001",
                        "Acme Industrial Supplies",
                        "orders@acme-industrial.com",
                        true,
                        LocalDateTime.of(2026, 4, 14, 8, 0, 0)
                ),
                new SupplierResponse(
                        2L,
                        "SUP-1002",
                        "Beta Components",
                        "contact@beta-components.com",
                        false,
                        LocalDateTime.of(2026, 4, 14, 8, 30, 0)
                )
        );

        when(supplierService.getAllSuppliers()).thenReturn(suppliers);

        mockMvc.perform(get(ApiPaths.SUPPLIERS))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].supplierCode").value("SUP-1001"))
                .andExpect(jsonPath("$[0].name").value("Acme Industrial Supplies"))
                .andExpect(jsonPath("$[1].id").value(2))
                .andExpect(jsonPath("$[1].supplierCode").value("SUP-1002"))
                .andExpect(jsonPath("$[1].name").value("Beta Components"));
    }
}