package com.example.oracleprocurementdemo.purchaseorder.controller;

import com.example.oracleprocurementdemo.common.api.ApiPaths;
import com.example.oracleprocurementdemo.purchaseorder.dto.CancelPurchaseOrderRequest;
import com.example.oracleprocurementdemo.purchaseorder.dto.CreatePurchaseOrderRequest;
import com.example.oracleprocurementdemo.purchaseorder.dto.PurchaseOrderResponse;
import com.example.oracleprocurementdemo.purchaseorder.dto.PurchaseOrderStatusSummaryResponse;
import com.example.oracleprocurementdemo.purchaseorder.dto.UpdatePurchaseOrderRequest;
import com.example.oracleprocurementdemo.purchaseorder.service.PurchaseOrderService;
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
@RequestMapping(ApiPaths.PURCHASE_ORDERS)
@Tag(name = "Purchase Orders", description = "Purchase order lifecycle endpoints")
public class PurchaseOrderController {

    private final PurchaseOrderService purchaseOrderService;

    public PurchaseOrderController(PurchaseOrderService purchaseOrderService) {
        this.purchaseOrderService = purchaseOrderService;
    }

    @GetMapping
    @Operation(summary = "List all purchase orders")
    public List<PurchaseOrderResponse> getAllPurchaseOrders() {
        return purchaseOrderService.getAllPurchaseOrders();
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a purchase order by id")
    public PurchaseOrderResponse getPurchaseOrderById(@PathVariable Long id) {
        return purchaseOrderService.getPurchaseOrderById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Create a new purchase order")
    @io.swagger.v3.oas.annotations.parameters.RequestBody(
            required = true,
            content = @Content(
                    mediaType = MediaType.APPLICATION_JSON_VALUE,
                    examples = @ExampleObject(
                            name = "Create purchase order",
                            value = """
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
                                    """
                    )
            )
    )
    public PurchaseOrderResponse createPurchaseOrder(
            @Valid @RequestBody CreatePurchaseOrderRequest request
    ) {
        return purchaseOrderService.createPurchaseOrder(request);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a draft purchase order")
    @io.swagger.v3.oas.annotations.parameters.RequestBody(
            required = true,
            content = @Content(
                    mediaType = MediaType.APPLICATION_JSON_VALUE,
                    examples = @ExampleObject(
                            name = "Update draft purchase order",
                            value = """
                                    {
                                      "orderNumber": "PO-2026-1001",
                                      "supplierId": 1,
                                      "requestedBy": "Punschkrapferl",
                                      "orderDate": "2026-04-13",
                                      "lines": [
                                        {
                                          "lineNumber": 1,
                                          "itemDescription": "Industrial safety gloves",
                                          "quantity": 60,
                                          "unitPrice": 4.90
                                        },
                                        {
                                          "lineNumber": 2,
                                          "itemDescription": "Protective safety goggles",
                                          "quantity": 25,
                                          "unitPrice": 12.50
                                        }
                                      ]
                                    }
                                    """
                    )
            )
    )
    public PurchaseOrderResponse updatePurchaseOrder(
            @PathVariable Long id,
            @Valid @RequestBody UpdatePurchaseOrderRequest request
    ) {
        return purchaseOrderService.updatePurchaseOrder(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Delete a draft purchase order")
    public void deletePurchaseOrder(@PathVariable Long id) {
        purchaseOrderService.deletePurchaseOrder(id);
    }

    @PostMapping("/{id}/submit")
    @Operation(summary = "Submit a draft purchase order")
    public PurchaseOrderResponse submitPurchaseOrder(@PathVariable Long id) {
        return purchaseOrderService.submitPurchaseOrder(id);
    }

    @PostMapping("/{id}/approve")
    @Operation(summary = "Approve a submitted purchase order")
    public PurchaseOrderResponse approvePurchaseOrder(@PathVariable Long id) {
        return purchaseOrderService.approvePurchaseOrder(id);
    }

    @PostMapping("/{id}/cancel")
    @Operation(summary = "Cancel an approved purchase order")
    @io.swagger.v3.oas.annotations.parameters.RequestBody(
            required = true,
            content = @Content(
                    mediaType = MediaType.APPLICATION_JSON_VALUE,
                    examples = @ExampleObject(
                            name = "Cancel approved purchase order",
                            value = """
                                    {
                                      "reason": "Supplier could not confirm the delivery timeline"
                                    }
                                    """
                    )
            )
    )
    public PurchaseOrderResponse cancelPurchaseOrder(
            @PathVariable Long id,
            @Valid @RequestBody CancelPurchaseOrderRequest request
    ) {
        return purchaseOrderService.cancelPurchaseOrder(id, request);
    }

    @GetMapping("/summary/status")
    @Operation(summary = "Get purchase order counts grouped by status")
    public List<PurchaseOrderStatusSummaryResponse> getPurchaseOrderStatusSummary() {
        return purchaseOrderService.getPurchaseOrderStatusSummary();
    }
}