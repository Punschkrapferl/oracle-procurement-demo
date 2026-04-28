package com.example.oracleprocurementdemo.supplier.service;

import com.example.oracleprocurementdemo.common.exception.ResourceConflictException;
import com.example.oracleprocurementdemo.common.exception.ResourceNotFoundException;
import com.example.oracleprocurementdemo.purchaseorder.repository.PurchaseOrderRepository;
import com.example.oracleprocurementdemo.supplier.dto.CreateSupplierRequest;
import com.example.oracleprocurementdemo.supplier.dto.SupplierResponse;
import com.example.oracleprocurementdemo.supplier.dto.UpdateSupplierRequest;
import com.example.oracleprocurementdemo.supplier.entity.Supplier;
import com.example.oracleprocurementdemo.supplier.repository.SupplierRepository;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Sort;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class SupplierServiceTest {

    private SupplierRepository supplierRepository;
    private PurchaseOrderRepository purchaseOrderRepository;
    private SupplierService supplierService;

    @BeforeEach
    void setUp() {
        supplierRepository = mock(SupplierRepository.class);
        purchaseOrderRepository = mock(PurchaseOrderRepository.class);

        supplierService = new SupplierService(supplierRepository, purchaseOrderRepository);
    }

    @Test
    @DisplayName("Should create supplier successfully")
    void shouldCreateSupplierSuccessfully() {
        CreateSupplierRequest request = new CreateSupplierRequest();
        request.setSupplierCode(" SUP-1001 ");
        request.setName(" Acme Industrial Supplies ");
        request.setContactEmail(" orders@acme-industrial.com ");
        request.setActive(true);

        when(supplierRepository.existsBySupplierCode("SUP-1001")).thenReturn(false);
        when(supplierRepository.save(any(Supplier.class))).thenAnswer(invocation -> {
            Supplier savedSupplier = invocation.getArgument(0);
            savedSupplier.setId(1L);
            return savedSupplier;
        });

        SupplierResponse response = supplierService.createSupplier(request);

        assertNotNull(response);
        assertEquals(1L, response.getId());
        assertEquals("SUP-1001", response.getSupplierCode());
        assertEquals("Acme Industrial Supplies", response.getName());
        assertEquals("orders@acme-industrial.com", response.getContactEmail());
        assertEquals(Boolean.TRUE, response.getActive());

        verify(supplierRepository).existsBySupplierCode("SUP-1001");
        verify(supplierRepository).save(any(Supplier.class));
    }

    @Test
    @DisplayName("Should default active to true when creating supplier")
    void shouldDefaultActiveToTrueWhenCreatingSupplier() {
        CreateSupplierRequest request = new CreateSupplierRequest();
        request.setSupplierCode("SUP-1002");
        request.setName("Beta Components");
        request.setContactEmail("contact@beta-components.com");
        request.setActive(null);

        when(supplierRepository.existsBySupplierCode("SUP-1002")).thenReturn(false);
        when(supplierRepository.save(any(Supplier.class))).thenAnswer(invocation -> {
            Supplier savedSupplier = invocation.getArgument(0);
            savedSupplier.setId(2L);
            return savedSupplier;
        });

        SupplierResponse response = supplierService.createSupplier(request);

        assertNotNull(response);
        assertEquals(Boolean.TRUE, response.getActive());

        verify(supplierRepository).existsBySupplierCode("SUP-1002");
        verify(supplierRepository).save(any(Supplier.class));
    }

    @Test
    @DisplayName("Should reject create when supplier code already exists")
    void shouldRejectCreateWhenSupplierCodeAlreadyExists() {
        CreateSupplierRequest request = new CreateSupplierRequest();
        request.setSupplierCode("SUP-1001");
        request.setName("Acme Industrial Supplies");
        request.setContactEmail("orders@acme-industrial.com");
        request.setActive(true);

        when(supplierRepository.existsBySupplierCode("SUP-1001")).thenReturn(true);

        ResourceConflictException exception = assertThrows(
                ResourceConflictException.class,
                () -> supplierService.createSupplier(request)
        );

        assertEquals("Supplier with code SUP-1001 already exists", exception.getMessage());

        verify(supplierRepository).existsBySupplierCode("SUP-1001");
        verify(supplierRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should return supplier by id")
    void shouldReturnSupplierById() {
        Supplier supplier = buildSupplier(10L, "SUP-2001", "Nordic Industrial Parts", "orders@nordic.com", true);

        when(supplierRepository.findById(10L)).thenReturn(Optional.of(supplier));

        SupplierResponse response = supplierService.getSupplierById(10L);

        assertNotNull(response);
        assertEquals(10L, response.getId());
        assertEquals("SUP-2001", response.getSupplierCode());
        assertEquals("Nordic Industrial Parts", response.getName());
        assertEquals("orders@nordic.com", response.getContactEmail());
        assertEquals(Boolean.TRUE, response.getActive());

        verify(supplierRepository).findById(10L);
    }

    @Test
    @DisplayName("Should reject get by id when supplier does not exist")
    void shouldRejectGetByIdWhenSupplierDoesNotExist() {
        when(supplierRepository.findById(99L)).thenReturn(Optional.empty());

        ResourceNotFoundException exception = assertThrows(
                ResourceNotFoundException.class,
                () -> supplierService.getSupplierById(99L)
        );

        assertEquals("Supplier with id 99 not found", exception.getMessage());

        verify(supplierRepository).findById(99L);
    }

    @Test
    @DisplayName("Should return all suppliers sorted by name")
    void shouldReturnAllSuppliersSortedByName() {
        Supplier supplier1 = buildSupplier(1L, "SUP-1001", "Acme Industrial Supplies", "orders@acme.com", true);
        Supplier supplier2 = buildSupplier(2L, "SUP-1002", "Beta Components", "contact@beta.com", false);

        when(supplierRepository.findAll(Sort.by(Sort.Direction.ASC, "name")))
                .thenReturn(List.of(supplier1, supplier2));

        List<SupplierResponse> responses = supplierService.getAllSuppliers();

        assertNotNull(responses);
        assertEquals(2, responses.size());
        assertEquals("SUP-1001", responses.get(0).getSupplierCode());
        assertEquals("SUP-1002", responses.get(1).getSupplierCode());

        verify(supplierRepository).findAll(Sort.by(Sort.Direction.ASC, "name"));
    }

    @Test
    @DisplayName("Should update supplier successfully")
    void shouldUpdateSupplierSuccessfully() {
        Supplier existingSupplier = buildSupplier(20L, "SUP-3001", "Old Name", "old@email.com", true);

        UpdateSupplierRequest request = new UpdateSupplierRequest();
        request.setSupplierCode(" SUP-3001 ");
        request.setName(" Updated Supplier Name ");
        request.setContactEmail(" updated@email.com ");
        request.setActive(false);

        when(supplierRepository.findById(20L)).thenReturn(Optional.of(existingSupplier));
        when(supplierRepository.findBySupplierCode("SUP-3001")).thenReturn(Optional.of(existingSupplier));

        SupplierResponse response = supplierService.updateSupplier(20L, request);

        assertNotNull(response);
        assertEquals(20L, response.getId());
        assertEquals("SUP-3001", response.getSupplierCode());
        assertEquals("Updated Supplier Name", response.getName());
        assertEquals("updated@email.com", response.getContactEmail());
        assertEquals(Boolean.FALSE, response.getActive());

        verify(supplierRepository).findById(20L);
        verify(supplierRepository).findBySupplierCode("SUP-3001");
    }

    @Test
    @DisplayName("Should allow deactivating supplier even when purchase order history may exist")
    void shouldAllowDeactivatingSupplierEvenWhenPurchaseOrderHistoryMayExist() {
        Supplier existingSupplier = buildSupplier(70L, "SUP-9001", "Supplier With History", "history@supplier.com", true);

        UpdateSupplierRequest request = new UpdateSupplierRequest();
        request.setSupplierCode("SUP-9001");
        request.setName("Supplier With History");
        request.setContactEmail("history@supplier.com");
        request.setActive(false);

        when(supplierRepository.findById(70L)).thenReturn(Optional.of(existingSupplier));
        when(supplierRepository.findBySupplierCode("SUP-9001")).thenReturn(Optional.of(existingSupplier));

        SupplierResponse response = supplierService.updateSupplier(70L, request);

        assertNotNull(response);
        assertEquals(70L, response.getId());
        assertEquals(Boolean.FALSE, response.getActive());

        verify(supplierRepository).findById(70L);
        verify(supplierRepository).findBySupplierCode("SUP-9001");

        /*
         * Deactivation is the correct alternative to deletion.
         * It should not require deleting or checking purchase order history.
         */
        verify(purchaseOrderRepository, never()).existsBySupplier_Id(70L);
    }

    @Test
    @DisplayName("Should reject update when supplier does not exist")
    void shouldRejectUpdateWhenSupplierDoesNotExist() {
        UpdateSupplierRequest request = new UpdateSupplierRequest();
        request.setSupplierCode("SUP-4001");
        request.setName("Updated Name");
        request.setContactEmail("updated@email.com");
        request.setActive(true);

        when(supplierRepository.findById(404L)).thenReturn(Optional.empty());

        ResourceNotFoundException exception = assertThrows(
                ResourceNotFoundException.class,
                () -> supplierService.updateSupplier(404L, request)
        );

        assertEquals("Supplier with id 404 not found", exception.getMessage());

        verify(supplierRepository).findById(404L);
        verify(supplierRepository, never()).findBySupplierCode(any());
    }

    @Test
    @DisplayName("Should reject update when another supplier already uses the same code")
    void shouldRejectUpdateWhenAnotherSupplierUsesSameCode() {
        Supplier existingSupplier = buildSupplier(30L, "SUP-5001", "Current Supplier", "current@email.com", true);
        Supplier conflictingSupplier = buildSupplier(31L, "SUP-5001", "Other Supplier", "other@email.com", true);

        UpdateSupplierRequest request = new UpdateSupplierRequest();
        request.setSupplierCode("SUP-5001");
        request.setName("Updated Name");
        request.setContactEmail("updated@email.com");
        request.setActive(true);

        when(supplierRepository.findById(30L)).thenReturn(Optional.of(existingSupplier));
        when(supplierRepository.findBySupplierCode("SUP-5001")).thenReturn(Optional.of(conflictingSupplier));

        ResourceConflictException exception = assertThrows(
                ResourceConflictException.class,
                () -> supplierService.updateSupplier(30L, request)
        );

        assertEquals("Supplier with code SUP-5001 already exists", exception.getMessage());

        verify(supplierRepository).findById(30L);
        verify(supplierRepository).findBySupplierCode("SUP-5001");
    }

    @Test
    @DisplayName("Should delete supplier when no purchase order history exists")
    void shouldDeleteSupplierWhenNoPurchaseOrderHistoryExists() {
        Supplier supplier = buildSupplier(40L, "SUP-6001", "Delete Me Supplier", "delete@me.com", true);

        when(supplierRepository.findById(40L)).thenReturn(Optional.of(supplier));
        when(purchaseOrderRepository.existsBySupplier_Id(40L)).thenReturn(false);

        supplierService.deleteSupplier(40L);

        verify(supplierRepository).findById(40L);
        verify(purchaseOrderRepository).existsBySupplier_Id(40L);
        verify(supplierRepository).delete(supplier);
    }

    @Test
    @DisplayName("Should reject delete when any purchase order history exists")
    void shouldRejectDeleteWhenAnyPurchaseOrderHistoryExists() {
        Supplier supplier = buildSupplier(50L, "SUP-7001", "Protected Supplier", "protected@sup.com", true);

        when(supplierRepository.findById(50L)).thenReturn(Optional.of(supplier));
        when(purchaseOrderRepository.existsBySupplier_Id(50L)).thenReturn(true);

        ResourceConflictException exception = assertThrows(
                ResourceConflictException.class,
                () -> supplierService.deleteSupplier(50L)
        );

        assertEquals(
                "Supplier cannot be deleted because purchase order history exists for it. Deactivate the supplier instead.",
                exception.getMessage()
        );

        verify(supplierRepository).findById(50L);
        verify(purchaseOrderRepository).existsBySupplier_Id(50L);
        verify(supplierRepository, never()).delete(any());
    }

    @Test
    @DisplayName("Should return supplier entity by id")
    void shouldReturnSupplierEntityById() {
        Supplier supplier = buildSupplier(60L, "SUP-8001", "Entity Supplier", "entity@sup.com", true);

        when(supplierRepository.findById(60L)).thenReturn(Optional.of(supplier));

        Supplier result = supplierService.findSupplierEntityById(60L);

        assertNotNull(result);
        assertEquals(60L, result.getId());
        assertEquals("SUP-8001", result.getSupplierCode());

        verify(supplierRepository).findById(60L);
    }

    private Supplier buildSupplier(
            Long id,
            String supplierCode,
            String name,
            String contactEmail,
            Boolean active
    ) {
        Supplier supplier = new Supplier();
        supplier.setId(id);
        supplier.setSupplierCode(supplierCode);
        supplier.setName(name);
        supplier.setContactEmail(contactEmail);
        supplier.setActive(active);
        return supplier;
    }
}