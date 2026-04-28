package com.example.oracleprocurementdemo.purchaseorder.controller;

import com.example.oracleprocurementdemo.common.api.ApiPaths;
import com.example.oracleprocurementdemo.common.exception.BusinessRuleException;
import com.example.oracleprocurementdemo.common.exception.GlobalExceptionHandler;
import com.example.oracleprocurementdemo.common.exception.ResourceNotFoundException;
import com.example.oracleprocurementdemo.purchaseorder.dto.PurchaseOrderLineResponse;
import com.example.oracleprocurementdemo.purchaseorder.dto.PurchaseOrderResponse;
import com.example.oracleprocurementdemo.purchaseorder.dto.PurchaseOrderStatusSummaryResponse;
import com.example.oracleprocurementdemo.purchaseorder.entity.PurchaseOrderStatus;
import com.example.oracleprocurementdemo.purchaseorder.service.PurchaseOrderService;
import java.math.BigDecimal;
import java.time.LocalDate;
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

@WebMvcTest(PurchaseOrderController.class)
@Import(GlobalExceptionHandler.class)
class PurchaseOrderControllerWebMvcTest {

    @Autowired
    private MockMvc mockMvc;

    /*
     * Initialized by Spring's test context.
     * IntelliJ may show "never assigned", but @MockitoBean creates and injects this mock.
     */
    @MockitoBean
    private PurchaseOrderService purchaseOrderService;

    @Test
    @DisplayName("POST /api/v1/purchase-orders returns 201 and created purchase order")
    void createPurchaseOrder_shouldReturnCreatedPurchaseOrder() throws Exception {
        PurchaseOrderResponse response = buildPurchaseOrderResponse(
                100L,
                "PO-2026-1001",
                1L,
                "SUP-1001",
                PurchaseOrderStatus.DRAFT,
                "Punschkrapferl",
                LocalDate.of(2026, 4, 13),
                new BigDecimal("495.00")
        );

        when(purchaseOrderService.createPurchaseOrder(any())).thenReturn(response);

        String requestBody = """
                {
                  "orderNumber": "PO-2026-1001",
                  "supplierId": 1,
                  "requestedBy": "Punschkrapferl",
                  "orderDate": "2026-04-13",
                  "lines": [
                    {
                      "lineNumber": 1,
                      "itemDescription": "Industrial safety gloves",
                      "quantity": 50,
                      "unitPrice": 4.90
                    },
                    {
                      "lineNumber": 2,
                      "itemDescription": "Protective safety goggles",
                      "quantity": 20,
                      "unitPrice": 12.50
                    }
                  ]
                }
                """;

        mockMvc.perform(post(ApiPaths.PURCHASE_ORDERS)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(100))
                .andExpect(jsonPath("$.orderNumber").value("PO-2026-1001"))
                .andExpect(jsonPath("$.supplierId").value(1))
                .andExpect(jsonPath("$.supplierCode").value("SUP-1001"))
                .andExpect(jsonPath("$.status").value("DRAFT"))
                .andExpect(jsonPath("$.requestedBy").value("Punschkrapferl"))
                .andExpect(jsonPath("$.orderDate").value("2026-04-13"))
                .andExpect(jsonPath("$.totalAmount").value(495.00))
                .andExpect(jsonPath("$.cancellationReason").doesNotExist())
                .andExpect(jsonPath("$.cancelledAt").doesNotExist())
                .andExpect(jsonPath("$.lines.length()").value(2))
                .andExpect(jsonPath("$.lines[0].lineNumber").value(1))
                .andExpect(jsonPath("$.lines[0].itemDescription").value("Industrial safety gloves"))
                .andExpect(jsonPath("$.lines[1].lineNumber").value(2))
                .andExpect(jsonPath("$.lines[1].itemDescription").value("Protective safety goggles"));
    }

    @Test
    @DisplayName("POST /api/v1/purchase-orders returns 400 when request validation fails")
    void createPurchaseOrder_shouldReturnBadRequest_whenValidationFails() throws Exception {
        String requestBody = """
                {
                  "orderNumber": "",
                  "supplierId": 0,
                  "requestedBy": "",
                  "orderDate": null,
                  "lines": []
                }
                """;

        mockMvc.perform(post(ApiPaths.PURCHASE_ORDERS)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.error").value("Bad Request"))
                .andExpect(jsonPath("$.message").value("Validation failed"))
                .andExpect(jsonPath("$.path").value(ApiPaths.PURCHASE_ORDERS))
                .andExpect(jsonPath("$.validationErrors.orderNumber").value("must not be blank"))
                .andExpect(jsonPath("$.validationErrors.supplierId").value("must be greater than 0"))
                .andExpect(jsonPath("$.validationErrors.requestedBy").value("must not be blank"))
                .andExpect(jsonPath("$.validationErrors.orderDate").value("must not be null"))
                .andExpect(jsonPath("$.validationErrors.lines").value("must not be empty"));
    }

    @Test
    @DisplayName("GET /api/v1/purchase-orders/{id} returns 200 and purchase order")
    void getPurchaseOrderById_shouldReturnPurchaseOrder() throws Exception {
        PurchaseOrderResponse response = buildPurchaseOrderResponse(
                200L,
                "PO-2026-2001",
                2L,
                "SUP-2001",
                PurchaseOrderStatus.SUBMITTED,
                "Punschkrapferl",
                LocalDate.of(2026, 4, 14),
                new BigDecimal("111.50")
        );

        when(purchaseOrderService.getPurchaseOrderById(200L)).thenReturn(response);

        mockMvc.perform(get(ApiPaths.PURCHASE_ORDERS + "/{id}", 200L))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(200))
                .andExpect(jsonPath("$.orderNumber").value("PO-2026-2001"))
                .andExpect(jsonPath("$.supplierId").value(2))
                .andExpect(jsonPath("$.supplierCode").value("SUP-2001"))
                .andExpect(jsonPath("$.status").value("SUBMITTED"))
                .andExpect(jsonPath("$.requestedBy").value("Punschkrapferl"))
                .andExpect(jsonPath("$.orderDate").value("2026-04-14"))
                .andExpect(jsonPath("$.totalAmount").value(111.50));
    }

    @Test
    @DisplayName("GET /api/v1/purchase-orders/{id} returns 404 when purchase order does not exist")
    void getPurchaseOrderById_shouldReturnNotFound_whenPurchaseOrderDoesNotExist() throws Exception {
        when(purchaseOrderService.getPurchaseOrderById(999L))
                .thenThrow(new ResourceNotFoundException("PurchaseOrder", 999L));

        mockMvc.perform(get(ApiPaths.PURCHASE_ORDERS + "/{id}", 999L))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.error").value("Not Found"))
                .andExpect(jsonPath("$.message").value("PurchaseOrder with id 999 not found"))
                .andExpect(jsonPath("$.path").value(ApiPaths.PURCHASE_ORDERS + "/999"));
    }

    @Test
    @DisplayName("PUT /api/v1/purchase-orders/{id} returns 200 and updated draft purchase order")
    void updatePurchaseOrder_shouldReturnUpdatedPurchaseOrder() throws Exception {
        PurchaseOrderResponse response = new PurchaseOrderResponse(
                300L,
                "PO-2026-3001",
                3L,
                "SUP-3001",
                PurchaseOrderStatus.DRAFT,
                "Punschkrapferl",
                LocalDate.of(2026, 4, 14),
                new BigDecimal("198.00"),
                LocalDateTime.of(2026, 4, 14, 10, 0, 0),
                LocalDateTime.of(2026, 4, 14, 11, 0, 0),
                null,
                null,
                List.of(
                        new PurchaseOrderLineResponse(
                                1L,
                                1,
                                "Industrial safety gloves",
                                20,
                                new BigDecimal("4.90"),
                                new BigDecimal("98.00")
                        ),
                        new PurchaseOrderLineResponse(
                                2L,
                                2,
                                "Protective safety goggles",
                                8,
                                new BigDecimal("12.50"),
                                new BigDecimal("100.00")
                        )
                )
        );

        when(purchaseOrderService.updatePurchaseOrder(eq(300L), any()))
                .thenReturn(response);

        String requestBody = """
                {
                  "orderNumber": "PO-2026-3001",
                  "supplierId": 3,
                  "requestedBy": "Punschkrapferl",
                  "orderDate": "2026-04-14",
                  "lines": [
                    {
                      "lineNumber": 1,
                      "itemDescription": "Industrial safety gloves",
                      "quantity": 20,
                      "unitPrice": 4.90
                    },
                    {
                      "lineNumber": 2,
                      "itemDescription": "Protective safety goggles",
                      "quantity": 8,
                      "unitPrice": 12.50
                    }
                  ]
                }
                """;

        mockMvc.perform(put(ApiPaths.PURCHASE_ORDERS + "/{id}", 300L)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(300))
                .andExpect(jsonPath("$.status").value("DRAFT"))
                .andExpect(jsonPath("$.totalAmount").value(198.00))
                .andExpect(jsonPath("$.lines[0].quantity").value(20))
                .andExpect(jsonPath("$.lines[1].quantity").value(8));
    }

    @Test
    @DisplayName("POST /api/v1/purchase-orders/{id}/submit returns 200 and submitted order")
    void submitPurchaseOrder_shouldReturnSubmittedOrder() throws Exception {
        PurchaseOrderResponse response = buildPurchaseOrderResponse(
                400L,
                "PO-2026-4001",
                4L,
                "SUP-4001",
                PurchaseOrderStatus.SUBMITTED,
                "Punschkrapferl",
                LocalDate.of(2026, 4, 14),
                new BigDecimal("111.50")
        );

        when(purchaseOrderService.submitPurchaseOrder(400L)).thenReturn(response);

        mockMvc.perform(post(ApiPaths.PURCHASE_ORDERS + "/{id}/submit", 400L))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(400))
                .andExpect(jsonPath("$.status").value("SUBMITTED"));
    }

    @Test
    @DisplayName("POST /api/v1/purchase-orders/{id}/approve returns 400 when business rule fails")
    void approvePurchaseOrder_shouldReturnBadRequest_whenBusinessRuleFails() throws Exception {
        when(purchaseOrderService.approvePurchaseOrder(500L))
                .thenThrow(new BusinessRuleException("Only SUBMITTED purchase orders can be approved"));

        mockMvc.perform(post(ApiPaths.PURCHASE_ORDERS + "/{id}/approve", 500L))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.error").value("Bad Request"))
                .andExpect(jsonPath("$.message").value("Only SUBMITTED purchase orders can be approved"))
                .andExpect(jsonPath("$.path").value(ApiPaths.PURCHASE_ORDERS + "/500/approve"));
    }

    @Test
    @DisplayName("POST /api/v1/purchase-orders/{id}/cancel returns 200 and cancelled order")
    void cancelPurchaseOrder_shouldReturnCancelledOrder() throws Exception {
        PurchaseOrderResponse response = new PurchaseOrderResponse(
                600L,
                "PO-2026-6001",
                6L,
                "SUP-6001",
                PurchaseOrderStatus.CANCELLED,
                "Punschkrapferl",
                LocalDate.of(2026, 4, 14),
                new BigDecimal("111.50"),
                LocalDateTime.of(2026, 4, 14, 10, 0, 0),
                LocalDateTime.of(2026, 4, 14, 12, 30, 0),
                "Supplier could not confirm the delivery timeline",
                LocalDateTime.of(2026, 4, 14, 12, 30, 0),
                List.of(
                        new PurchaseOrderLineResponse(
                                1L,
                                1,
                                "Industrial safety gloves",
                                10,
                                new BigDecimal("4.90"),
                                new BigDecimal("49.00")
                        ),
                        new PurchaseOrderLineResponse(
                                2L,
                                2,
                                "Protective safety goggles",
                                5,
                                new BigDecimal("12.50"),
                                new BigDecimal("62.50")
                        )
                )
        );

        when(purchaseOrderService.cancelPurchaseOrder(eq(600L), any())).thenReturn(response);

        String requestBody = """
                {
                  "reason": "Supplier could not confirm the delivery timeline"
                }
                """;

        mockMvc.perform(post(ApiPaths.PURCHASE_ORDERS + "/{id}/cancel", 600L)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(600))
                .andExpect(jsonPath("$.status").value("CANCELLED"))
                .andExpect(jsonPath("$.cancellationReason")
                        .value("Supplier could not confirm the delivery timeline"))
                .andExpect(jsonPath("$.cancelledAt").value("2026-04-14T12:30:00"));
    }

    @Test
    @DisplayName("POST /api/v1/purchase-orders/{id}/cancel returns 400 when reason is blank")
    void cancelPurchaseOrder_shouldReturnBadRequest_whenReasonIsBlank() throws Exception {
        String requestBody = """
                {
                  "reason": ""
                }
                """;

        mockMvc.perform(post(ApiPaths.PURCHASE_ORDERS + "/{id}/cancel", 601L)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.error").value("Bad Request"))
                .andExpect(jsonPath("$.message").value("Validation failed"))
                .andExpect(jsonPath("$.path").value(ApiPaths.PURCHASE_ORDERS + "/601/cancel"))
                .andExpect(jsonPath("$.validationErrors.reason").value("must not be blank"));
    }

    @Test
    @DisplayName("DELETE /api/v1/purchase-orders/{id} returns 400 when deleting non-draft order")
    void deletePurchaseOrder_shouldReturnBadRequest_whenOrderIsNotDraft() throws Exception {
        doThrow(new BusinessRuleException("Only DRAFT purchase orders can be edited or deleted"))
                .when(purchaseOrderService).deletePurchaseOrder(700L);

        mockMvc.perform(delete(ApiPaths.PURCHASE_ORDERS + "/{id}", 700L))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.error").value("Bad Request"))
                .andExpect(jsonPath("$.message").value("Only DRAFT purchase orders can be edited or deleted"))
                .andExpect(jsonPath("$.path").value(ApiPaths.PURCHASE_ORDERS + "/700"));
    }

    @Test
    @DisplayName("GET /api/v1/purchase-orders/summary/status returns 200 and grouped status summary")
    void getPurchaseOrderStatusSummary_shouldReturnSummary() throws Exception {
        List<PurchaseOrderStatusSummaryResponse> summary = List.of(
                new PurchaseOrderStatusSummaryResponse(PurchaseOrderStatus.DRAFT, 2L),
                new PurchaseOrderStatusSummaryResponse(PurchaseOrderStatus.APPROVED, 5L)
        );

        when(purchaseOrderService.getPurchaseOrderStatusSummary()).thenReturn(summary);

        mockMvc.perform(get(ApiPaths.PURCHASE_ORDERS + "/summary/status"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].status").value("DRAFT"))
                .andExpect(jsonPath("$[0].count").value(2))
                .andExpect(jsonPath("$[1].status").value("APPROVED"))
                .andExpect(jsonPath("$[1].count").value(5));
    }

    private PurchaseOrderResponse buildPurchaseOrderResponse(
            Long id,
            String orderNumber,
            Long supplierId,
            String supplierCode,
            PurchaseOrderStatus status,
            String requestedBy,
            LocalDate orderDate,
            BigDecimal totalAmount
    ) {
        List<PurchaseOrderLineResponse> lines = List.of(
                new PurchaseOrderLineResponse(
                        1L,
                        1,
                        "Industrial safety gloves",
                        10,
                        new BigDecimal("4.90"),
                        new BigDecimal("49.00")
                ),
                new PurchaseOrderLineResponse(
                        2L,
                        2,
                        "Protective safety goggles",
                        5,
                        new BigDecimal("12.50"),
                        new BigDecimal("62.50")
                )
        );

        return new PurchaseOrderResponse(
                id,
                orderNumber,
                supplierId,
                supplierCode,
                status,
                requestedBy,
                orderDate,
                totalAmount,
                LocalDateTime.of(2026, 4, 14, 10, 0, 0),
                LocalDateTime.of(2026, 4, 14, 11, 0, 0),
                null,
                null,
                lines
        );
    }
}