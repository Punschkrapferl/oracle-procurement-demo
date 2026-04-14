package com.example.oracleprocurementdemo.purchaseorder.service;

import com.example.oracleprocurementdemo.common.exception.BusinessRuleException;
import com.example.oracleprocurementdemo.common.exception.ResourceConflictException;
import com.example.oracleprocurementdemo.common.exception.ResourceNotFoundException;
import com.example.oracleprocurementdemo.purchaseorder.dto.CreatePurchaseOrderRequest;
import com.example.oracleprocurementdemo.purchaseorder.dto.PurchaseOrderLineRequest;
import com.example.oracleprocurementdemo.purchaseorder.dto.PurchaseOrderResponse;
import com.example.oracleprocurementdemo.purchaseorder.entity.PurchaseOrder;
import com.example.oracleprocurementdemo.purchaseorder.entity.PurchaseOrderStatus;
import com.example.oracleprocurementdemo.purchaseorder.repository.PurchaseOrderRepository;
import com.example.oracleprocurementdemo.supplier.entity.Supplier;
import com.example.oracleprocurementdemo.supplier.repository.SupplierRepository;
import jakarta.persistence.EntityManager;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class PurchaseOrderServiceTest {

    private PurchaseOrderRepository purchaseOrderRepository;
    private SupplierRepository supplierRepository;
    private EntityManager entityManager;
    private PurchaseOrderService purchaseOrderService;

    @BeforeEach
    void setUp() {
        purchaseOrderRepository = mock(PurchaseOrderRepository.class);
        supplierRepository = mock(SupplierRepository.class);
        entityManager = mock(EntityManager.class);

        purchaseOrderService = new PurchaseOrderService(
                purchaseOrderRepository,
                supplierRepository,
                entityManager
        );
    }

    @Test
    @DisplayName("Should create purchase order for active supplier with valid lines")
    void shouldCreatePurchaseOrderSuccessfully() {
        CreatePurchaseOrderRequest request = buildCreateRequest(
                "PO-2026-1001",
                1L,
                "Punschkrapferl",
                List.of(
                        buildLineRequest(1, "Industrial safety gloves", 10, "4.90"),
                        buildLineRequest(2, "Protective safety goggles", 5, "12.50")
                )
        );

        Supplier supplier = buildActiveSupplier(1L, "SUP-1001");

        when(purchaseOrderRepository.existsByOrderNumber("PO-2026-1001")).thenReturn(false);
        when(supplierRepository.findById(1L)).thenReturn(Optional.of(supplier));

        when(purchaseOrderRepository.save(any(PurchaseOrder.class))).thenAnswer(invocation -> {
            PurchaseOrder po = invocation.getArgument(0);
            po.setId(100L);
            return po;
        });

        when(purchaseOrderRepository.findDetailsById(100L)).thenAnswer(invocation -> {
            PurchaseOrder saved = getCapturedSavedPurchaseOrder();
            return Optional.of(saved);
        });

        PurchaseOrderResponse response = purchaseOrderService.createPurchaseOrder(request);

        assertNotNull(response);
        assertEquals(100L, response.getId());
        assertEquals("PO-2026-1001", response.getOrderNumber());
        assertEquals(1L, response.getSupplierId());
        assertEquals("SUP-1001", response.getSupplierCode());
        assertEquals(PurchaseOrderStatus.DRAFT, response.getStatus());
        assertEquals("Punschkrapferl", response.getRequestedBy());
        assertEquals(LocalDate.of(2026, 4, 14), response.getOrderDate());
        assertEquals(0, new BigDecimal("111.50").compareTo(response.getTotalAmount()));
        assertEquals(2, response.getLines().size());

        verify(purchaseOrderRepository).existsByOrderNumber("PO-2026-1001");
        verify(supplierRepository).findById(1L);
        verify(purchaseOrderRepository).save(any(PurchaseOrder.class));
        verify(entityManager).flush();
        verify(purchaseOrderRepository).findDetailsById(100L);
    }

    @Test
    @DisplayName("Should reject create when purchase order number already exists")
    void shouldRejectCreateWhenOrderNumberAlreadyExists() {
        CreatePurchaseOrderRequest request = buildCreateRequest(
                "PO-2026-1001",
                1L,
                "Punschkrapferl",
                List.of(buildLineRequest(1, "Industrial safety gloves", 10, "4.90"))
        );

        when(purchaseOrderRepository.existsByOrderNumber("PO-2026-1001")).thenReturn(true);

        ResourceConflictException exception = assertThrows(
                ResourceConflictException.class,
                () -> purchaseOrderService.createPurchaseOrder(request)
        );

        assertEquals("Purchase order with number PO-2026-1001 already exists", exception.getMessage());

        verify(purchaseOrderRepository).existsByOrderNumber("PO-2026-1001");
        verifyNoInteractions(supplierRepository);
        verify(purchaseOrderRepository, never()).save(any());
        verify(entityManager, never()).flush();
    }

    @Test
    @DisplayName("Should reject create when supplier does not exist")
    void shouldRejectCreateWhenSupplierDoesNotExist() {
        CreatePurchaseOrderRequest request = buildCreateRequest(
                "PO-2026-1001",
                99L,
                "Punschkrapferl",
                List.of(buildLineRequest(1, "Industrial safety gloves", 10, "4.90"))
        );

        when(purchaseOrderRepository.existsByOrderNumber("PO-2026-1001")).thenReturn(false);
        when(supplierRepository.findById(99L)).thenReturn(Optional.empty());

        ResourceNotFoundException exception = assertThrows(
                ResourceNotFoundException.class,
                () -> purchaseOrderService.createPurchaseOrder(request)
        );

        assertEquals("Supplier with id 99 not found", exception.getMessage());

        verify(purchaseOrderRepository).existsByOrderNumber("PO-2026-1001");
        verify(supplierRepository).findById(99L);
        verify(purchaseOrderRepository, never()).save(any());
        verify(entityManager, never()).flush();
    }

    @Test
    @DisplayName("Should reject create when supplier is inactive")
    void shouldRejectCreateWhenSupplierIsInactive() {
        CreatePurchaseOrderRequest request = buildCreateRequest(
                "PO-2026-1001",
                1L,
                "Punschkrapferl",
                List.of(buildLineRequest(1, "Industrial safety gloves", 10, "4.90"))
        );

        Supplier supplier = buildInactiveSupplier(1L, "SUP-1001");

        when(purchaseOrderRepository.existsByOrderNumber("PO-2026-1001")).thenReturn(false);
        when(supplierRepository.findById(1L)).thenReturn(Optional.of(supplier));

        BusinessRuleException exception = assertThrows(
                BusinessRuleException.class,
                () -> purchaseOrderService.createPurchaseOrder(request)
        );

        assertEquals("Purchase orders can only be created for active suppliers", exception.getMessage());

        verify(purchaseOrderRepository).existsByOrderNumber("PO-2026-1001");
        verify(supplierRepository).findById(1L);
        verify(purchaseOrderRepository, never()).save(any());
        verify(entityManager, never()).flush();
    }

    @Test
    @DisplayName("Should reject create when duplicate line numbers exist")
    void shouldRejectCreateWhenDuplicateLineNumbersExist() {
        CreatePurchaseOrderRequest request = buildCreateRequest(
                "PO-2026-1001",
                1L,
                "Punschkrapferl",
                List.of(
                        buildLineRequest(1, "Industrial safety gloves", 10, "4.90"),
                        buildLineRequest(1, "Protective safety goggles", 5, "12.50")
                )
        );

        when(purchaseOrderRepository.existsByOrderNumber("PO-2026-1001")).thenReturn(false);

        BusinessRuleException exception = assertThrows(
                BusinessRuleException.class,
                () -> purchaseOrderService.createPurchaseOrder(request)
        );

        assertEquals("Duplicate line number 1 is not allowed", exception.getMessage());

        verify(purchaseOrderRepository).existsByOrderNumber("PO-2026-1001");
        verifyNoInteractions(supplierRepository);
        verify(purchaseOrderRepository, never()).save(any());
        verify(entityManager, never()).flush();
    }

    @Test
    @DisplayName("Should reject approval when order is not submitted")
    void shouldRejectApproveWhenOrderIsNotSubmitted() {
        PurchaseOrder draftOrder = buildPurchaseOrder(10L, PurchaseOrderStatus.DRAFT);

        when(purchaseOrderRepository.findDetailsById(10L)).thenReturn(Optional.of(draftOrder));

        BusinessRuleException exception = assertThrows(
                BusinessRuleException.class,
                () -> purchaseOrderService.approvePurchaseOrder(10L)
        );

        assertEquals("Only SUBMITTED purchase orders can be approved", exception.getMessage());

        verify(purchaseOrderRepository).findDetailsById(10L);
        verify(entityManager, never()).flush();
    }

    @Test
    @DisplayName("Should reject cancelling approved purchase order")
    void shouldRejectCancelWhenOrderIsApproved() {
        PurchaseOrder approvedOrder = buildPurchaseOrder(20L, PurchaseOrderStatus.APPROVED);

        when(purchaseOrderRepository.findDetailsById(20L)).thenReturn(Optional.of(approvedOrder));

        BusinessRuleException exception = assertThrows(
                BusinessRuleException.class,
                () -> purchaseOrderService.cancelPurchaseOrder(20L)
        );

        assertEquals("Approved purchase orders cannot be cancelled", exception.getMessage());

        verify(purchaseOrderRepository).findDetailsById(20L);
        verify(entityManager, never()).flush();
    }

    @Test
    @DisplayName("Should reject deleting non-draft purchase order")
    void shouldRejectDeleteWhenOrderIsNotDraft() {
        PurchaseOrder submittedOrder = buildPurchaseOrder(30L, PurchaseOrderStatus.SUBMITTED);

        when(purchaseOrderRepository.findDetailsById(30L)).thenReturn(Optional.of(submittedOrder));

        BusinessRuleException exception = assertThrows(
                BusinessRuleException.class,
                () -> purchaseOrderService.deletePurchaseOrder(30L)
        );

        assertEquals("Only DRAFT purchase orders can be edited or deleted", exception.getMessage());

        verify(purchaseOrderRepository).findDetailsById(30L);
        verify(purchaseOrderRepository, never()).delete(any());
    }

    private PurchaseOrder getCapturedSavedPurchaseOrder() {
        ArgumentCaptor<PurchaseOrder> captor = ArgumentCaptor.forClass(PurchaseOrder.class);
        verify(purchaseOrderRepository, atLeastOnce()).save(captor.capture());
        return captor.getValue();
    }

    private CreatePurchaseOrderRequest buildCreateRequest(
            String orderNumber,
            Long supplierId,
            String requestedBy,
            List<PurchaseOrderLineRequest> lines
    ) {
        CreatePurchaseOrderRequest request = new CreatePurchaseOrderRequest();
        request.setOrderNumber(orderNumber);
        request.setSupplierId(supplierId);
        request.setRequestedBy(requestedBy);
        request.setOrderDate(LocalDate.of(2026, 4, 14));
        request.setLines(lines);
        return request;
    }

    private PurchaseOrderLineRequest buildLineRequest(
            Integer lineNumber,
            String itemDescription,
            Integer quantity,
            String unitPrice
    ) {
        PurchaseOrderLineRequest line = new PurchaseOrderLineRequest();
        line.setLineNumber(lineNumber);
        line.setItemDescription(itemDescription);
        line.setQuantity(quantity);
        line.setUnitPrice(new BigDecimal(unitPrice));
        return line;
    }

    private Supplier buildActiveSupplier(Long id, String supplierCode) {
        Supplier supplier = new Supplier();
        supplier.setId(id);
        supplier.setSupplierCode(supplierCode);
        supplier.setName("Test Supplier");
        supplier.setContactEmail("orders@test.com");
        supplier.setActive(true);
        return supplier;
    }

    private Supplier buildInactiveSupplier(Long id, String supplierCode) {
        Supplier supplier = buildActiveSupplier(id, supplierCode);
        supplier.setActive(false);
        return supplier;
    }

    private PurchaseOrder buildPurchaseOrder(Long id, PurchaseOrderStatus status) {
        Supplier supplier = buildActiveSupplier(1L, "SUP-1001");

        PurchaseOrder purchaseOrder = new PurchaseOrder();
        purchaseOrder.setId(id);
        purchaseOrder.setOrderNumber("PO-TEST-" + id);
        purchaseOrder.setSupplier(supplier);
        purchaseOrder.setStatus(status);
        purchaseOrder.setRequestedBy("Punschkrapferl");
        purchaseOrder.setOrderDate(LocalDate.of(2026, 4, 14));
        purchaseOrder.setTotalAmount(BigDecimal.ZERO);
        assertNotNull(purchaseOrder.getLines());
        return purchaseOrder;
    }
}