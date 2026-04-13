package com.example.oracleprocurementdemo.purchaseorder.service;

import com.example.oracleprocurementdemo.common.exception.BusinessRuleException;
import com.example.oracleprocurementdemo.common.exception.ResourceConflictException;
import com.example.oracleprocurementdemo.common.exception.ResourceNotFoundException;
import com.example.oracleprocurementdemo.purchaseorder.dto.CreatePurchaseOrderRequest;
import com.example.oracleprocurementdemo.purchaseorder.dto.PurchaseOrderLineRequest;
import com.example.oracleprocurementdemo.purchaseorder.dto.PurchaseOrderLineResponse;
import com.example.oracleprocurementdemo.purchaseorder.dto.PurchaseOrderResponse;
import com.example.oracleprocurementdemo.purchaseorder.dto.PurchaseOrderStatusSummaryResponse;
import com.example.oracleprocurementdemo.purchaseorder.dto.UpdatePurchaseOrderRequest;
import com.example.oracleprocurementdemo.purchaseorder.entity.PurchaseOrder;
import com.example.oracleprocurementdemo.purchaseorder.entity.PurchaseOrderLine;
import com.example.oracleprocurementdemo.purchaseorder.entity.PurchaseOrderStatus;
import com.example.oracleprocurementdemo.purchaseorder.repository.PurchaseOrderRepository;
import com.example.oracleprocurementdemo.supplier.entity.Supplier;
import com.example.oracleprocurementdemo.supplier.repository.SupplierRepository;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class PurchaseOrderService {

    private final PurchaseOrderRepository purchaseOrderRepository;
    private final SupplierRepository supplierRepository;

    public PurchaseOrderService(
            PurchaseOrderRepository purchaseOrderRepository,
            SupplierRepository supplierRepository
    ) {
        this.purchaseOrderRepository = purchaseOrderRepository;
        this.supplierRepository = supplierRepository;
    }

    @Transactional(readOnly = true)
    public List<PurchaseOrderResponse> getAllPurchaseOrders() {
        return purchaseOrderRepository.findAllWithSupplierOrderByCreatedAtDesc()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public PurchaseOrderResponse getPurchaseOrderById(Long id) {
        PurchaseOrder purchaseOrder = findPurchaseOrderDetailsById(id);
        return toResponse(purchaseOrder);
    }

    public PurchaseOrderResponse createPurchaseOrder(CreatePurchaseOrderRequest request) {
        String orderNumber = normalize(request.getOrderNumber());

        if (purchaseOrderRepository.existsByOrderNumber(orderNumber)) {
            throw new ResourceConflictException(
                    "Purchase order with number " + orderNumber + " already exists"
            );
        }

        validateLineNumbers(request.getLines());

        Supplier supplier = findActiveSupplierById(request.getSupplierId());

        PurchaseOrder purchaseOrder = new PurchaseOrder();
        purchaseOrder.setOrderNumber(orderNumber);
        purchaseOrder.setSupplier(supplier);
        purchaseOrder.setStatus(PurchaseOrderStatus.DRAFT);
        purchaseOrder.setRequestedBy(normalize(request.getRequestedBy()));
        purchaseOrder.setOrderDate(request.getOrderDate());
        purchaseOrder.setTotalAmount(BigDecimal.ZERO);

        replaceLines(purchaseOrder, request.getLines());

        PurchaseOrder savedPurchaseOrder = purchaseOrderRepository.save(purchaseOrder);
        return getPurchaseOrderById(savedPurchaseOrder.getId());
    }

    public PurchaseOrderResponse updatePurchaseOrder(Long id, UpdatePurchaseOrderRequest request) {
        PurchaseOrder purchaseOrder = findPurchaseOrderDetailsById(id);

        ensureDraft(purchaseOrder);

        String orderNumber = normalize(request.getOrderNumber());

        purchaseOrderRepository.findByOrderNumber(orderNumber)
                .filter(existingOrder -> !existingOrder.getId().equals(purchaseOrder.getId()))
                .ifPresent(existingOrder -> {
                    throw new ResourceConflictException(
                            "Purchase order with number " + orderNumber + " already exists"
                    );
                });

        validateLineNumbers(request.getLines());

        Supplier supplier = findActiveSupplierById(request.getSupplierId());

        purchaseOrder.setOrderNumber(orderNumber);
        purchaseOrder.setSupplier(supplier);
        purchaseOrder.setRequestedBy(normalize(request.getRequestedBy()));
        purchaseOrder.setOrderDate(request.getOrderDate());

        replaceLines(purchaseOrder, request.getLines());

        return toResponse(purchaseOrder);
    }

    public void deletePurchaseOrder(Long id) {
        PurchaseOrder purchaseOrder = findPurchaseOrderDetailsById(id);

        ensureDraft(purchaseOrder);

        purchaseOrderRepository.delete(purchaseOrder);
    }

    public PurchaseOrderResponse submitPurchaseOrder(Long id) {
        PurchaseOrder purchaseOrder = findPurchaseOrderDetailsById(id);

        if (purchaseOrder.getStatus() != PurchaseOrderStatus.DRAFT) {
            throw new BusinessRuleException("Only DRAFT purchase orders can be submitted");
        }

        if (purchaseOrder.getLines() == null || purchaseOrder.getLines().isEmpty()) {
            throw new BusinessRuleException("Purchase order must contain at least one line");
        }

        purchaseOrder.setStatus(PurchaseOrderStatus.SUBMITTED);
        return toResponse(purchaseOrder);
    }

    public PurchaseOrderResponse approvePurchaseOrder(Long id) {
        PurchaseOrder purchaseOrder = findPurchaseOrderDetailsById(id);

        if (purchaseOrder.getStatus() != PurchaseOrderStatus.SUBMITTED) {
            throw new BusinessRuleException("Only SUBMITTED purchase orders can be approved");
        }

        purchaseOrder.setStatus(PurchaseOrderStatus.APPROVED);
        return toResponse(purchaseOrder);
    }

    public PurchaseOrderResponse cancelPurchaseOrder(Long id) {
        PurchaseOrder purchaseOrder = findPurchaseOrderDetailsById(id);

        if (purchaseOrder.getStatus() == PurchaseOrderStatus.APPROVED) {
            throw new BusinessRuleException("Approved purchase orders cannot be cancelled");
        }

        if (purchaseOrder.getStatus() == PurchaseOrderStatus.CANCELLED) {
            throw new BusinessRuleException("Purchase order is already cancelled");
        }

        purchaseOrder.setStatus(PurchaseOrderStatus.CANCELLED);
        return toResponse(purchaseOrder);
    }

    @Transactional(readOnly = true)
    public List<PurchaseOrderStatusSummaryResponse> getPurchaseOrderStatusSummary() {
        return purchaseOrderRepository.getStatusSummary();
    }

    private PurchaseOrder findPurchaseOrderDetailsById(Long id) {
        return purchaseOrderRepository.findDetailsById(id)
                .orElseThrow(() -> new ResourceNotFoundException("PurchaseOrder", id));
    }

    private Supplier findActiveSupplierById(Long supplierId) {
        Supplier supplier = supplierRepository.findById(supplierId)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier", supplierId));

        if (Boolean.FALSE.equals(supplier.getActive())) {
            throw new BusinessRuleException("Purchase orders can only be created for active suppliers");
        }

        return supplier;
    }

    private void ensureDraft(PurchaseOrder purchaseOrder) {
        if (purchaseOrder.getStatus() != PurchaseOrderStatus.DRAFT) {
            throw new BusinessRuleException("Only DRAFT purchase orders can be edited or deleted");
        }
    }

    private void validateLineNumbers(List<PurchaseOrderLineRequest> lines) {
        Set<Integer> lineNumbers = new HashSet<>();

        for (PurchaseOrderLineRequest line : lines) {
            if (!lineNumbers.add(line.getLineNumber())) {
                throw new BusinessRuleException(
                        "Duplicate line number " + line.getLineNumber() + " is not allowed"
                );
            }
        }
    }

    private void replaceLines(PurchaseOrder purchaseOrder, List<PurchaseOrderLineRequest> lineRequests) {
        List<PurchaseOrderLine> existingLines = new ArrayList<>(purchaseOrder.getLines());

        for (PurchaseOrderLine existingLine : existingLines) {
            purchaseOrder.removeLine(existingLine);
        }

        for (PurchaseOrderLineRequest lineRequest : lineRequests) {
            PurchaseOrderLine line = new PurchaseOrderLine();
            line.setLineNumber(lineRequest.getLineNumber());
            line.setItemDescription(normalize(lineRequest.getItemDescription()));
            line.setQuantity(lineRequest.getQuantity());
            line.setUnitPrice(lineRequest.getUnitPrice());
            line.recalculateLineTotal();

            purchaseOrder.addLine(line);
        }

        purchaseOrder.recalculateTotalAmount();
    }

    private PurchaseOrderResponse toResponse(PurchaseOrder purchaseOrder) {
        List<PurchaseOrderLineResponse> lineResponses = purchaseOrder.getLines()
                .stream()
                .sorted(Comparator.comparing(PurchaseOrderLine::getLineNumber))
                .map(line -> new PurchaseOrderLineResponse(
                        line.getId(),
                        line.getLineNumber(),
                        line.getItemDescription(),
                        line.getQuantity(),
                        line.getUnitPrice(),
                        line.getLineTotal()
                ))
                .toList();

        return new PurchaseOrderResponse(
                purchaseOrder.getId(),
                purchaseOrder.getOrderNumber(),
                purchaseOrder.getSupplier().getId(),
                purchaseOrder.getSupplier().getSupplierCode(),
                purchaseOrder.getStatus(),
                purchaseOrder.getRequestedBy(),
                purchaseOrder.getOrderDate(),
                purchaseOrder.getTotalAmount(),
                purchaseOrder.getCreatedAt(),
                purchaseOrder.getUpdatedAt(),
                lineResponses
        );
    }

    private String normalize(String value) {
        return value == null ? null : value.trim();
    }
}