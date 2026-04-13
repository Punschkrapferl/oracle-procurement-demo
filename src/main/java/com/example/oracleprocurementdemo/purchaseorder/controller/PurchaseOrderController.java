package com.example.oracleprocurementdemo.purchaseorder.controller;

import com.example.oracleprocurementdemo.purchaseorder.dto.CreatePurchaseOrderRequest;
import com.example.oracleprocurementdemo.purchaseorder.dto.PurchaseOrderResponse;
import com.example.oracleprocurementdemo.purchaseorder.dto.PurchaseOrderStatusSummaryResponse;
import com.example.oracleprocurementdemo.purchaseorder.dto.UpdatePurchaseOrderRequest;
import com.example.oracleprocurementdemo.purchaseorder.service.PurchaseOrderService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
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
@RequestMapping("/api/purchase-orders")
public class PurchaseOrderController {

    private final PurchaseOrderService purchaseOrderService;

    public PurchaseOrderController(PurchaseOrderService purchaseOrderService) {
        this.purchaseOrderService = purchaseOrderService;
    }

    @GetMapping
    public List<PurchaseOrderResponse> getAllPurchaseOrders() {
        return purchaseOrderService.getAllPurchaseOrders();
    }

    @GetMapping("/{id}")
    public PurchaseOrderResponse getPurchaseOrderById(@PathVariable Long id) {
        return purchaseOrderService.getPurchaseOrderById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PurchaseOrderResponse createPurchaseOrder(
            @Valid @RequestBody CreatePurchaseOrderRequest request
    ) {
        return purchaseOrderService.createPurchaseOrder(request);
    }

    @PutMapping("/{id}")
    public PurchaseOrderResponse updatePurchaseOrder(
            @PathVariable Long id,
            @Valid @RequestBody UpdatePurchaseOrderRequest request
    ) {
        return purchaseOrderService.updatePurchaseOrder(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deletePurchaseOrder(@PathVariable Long id) {
        purchaseOrderService.deletePurchaseOrder(id);
    }

    @PostMapping("/{id}/submit")
    public PurchaseOrderResponse submitPurchaseOrder(@PathVariable Long id) {
        return purchaseOrderService.submitPurchaseOrder(id);
    }

    @PostMapping("/{id}/approve")
    public PurchaseOrderResponse approvePurchaseOrder(@PathVariable Long id) {
        return purchaseOrderService.approvePurchaseOrder(id);
    }

    @PostMapping("/{id}/cancel")
    public PurchaseOrderResponse cancelPurchaseOrder(@PathVariable Long id) {
        return purchaseOrderService.cancelPurchaseOrder(id);
    }

    @GetMapping("/summary/status")
    public List<PurchaseOrderStatusSummaryResponse> getPurchaseOrderStatusSummary() {
        return purchaseOrderService.getPurchaseOrderStatusSummary();
    }
}