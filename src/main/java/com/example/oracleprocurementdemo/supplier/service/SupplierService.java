package com.example.oracleprocurementdemo.supplier.service;

import com.example.oracleprocurementdemo.common.exception.ResourceConflictException;
import com.example.oracleprocurementdemo.common.exception.ResourceNotFoundException;
import com.example.oracleprocurementdemo.purchaseorder.entity.PurchaseOrder;
import com.example.oracleprocurementdemo.purchaseorder.entity.PurchaseOrderStatus;
import com.example.oracleprocurementdemo.purchaseorder.repository.PurchaseOrderRepository;
import com.example.oracleprocurementdemo.supplier.dto.CreateSupplierRequest;
import com.example.oracleprocurementdemo.supplier.dto.SupplierResponse;
import com.example.oracleprocurementdemo.supplier.dto.UpdateSupplierRequest;
import com.example.oracleprocurementdemo.supplier.entity.Supplier;
import com.example.oracleprocurementdemo.supplier.repository.SupplierRepository;
import java.util.List;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class SupplierService {

    private final SupplierRepository supplierRepository;
    private final PurchaseOrderRepository purchaseOrderRepository;

    public SupplierService(
            SupplierRepository supplierRepository,
            PurchaseOrderRepository purchaseOrderRepository
    ) {
        this.supplierRepository = supplierRepository;
        this.purchaseOrderRepository = purchaseOrderRepository;
    }

    @Transactional(readOnly = true)
    public List<SupplierResponse> getAllSuppliers() {
        return supplierRepository.findAll(Sort.by(Sort.Direction.ASC, "name"))
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public SupplierResponse getSupplierById(Long id) {
        Supplier supplier = findSupplierById(id);
        return toResponse(supplier);
    }

    public SupplierResponse createSupplier(CreateSupplierRequest request) {
        String supplierCode = normalize(request.getSupplierCode());

        if (supplierRepository.existsBySupplierCode(supplierCode)) {
            throw new ResourceConflictException(
                    "Supplier with code " + supplierCode + " already exists"
            );
        }

        Supplier supplier = new Supplier();
        supplier.setSupplierCode(supplierCode);
        supplier.setName(normalize(request.getName()));
        supplier.setContactEmail(normalize(request.getContactEmail()));
        supplier.setActive(request.getActive() == null ? Boolean.TRUE : request.getActive());

        Supplier savedSupplier = supplierRepository.save(supplier);
        return toResponse(savedSupplier);
    }

    public SupplierResponse updateSupplier(Long id, UpdateSupplierRequest request) {
        Supplier supplier = findSupplierById(id);
        String supplierCode = normalize(request.getSupplierCode());

        supplierRepository.findBySupplierCode(supplierCode)
                .filter(existingSupplier -> !existingSupplier.getId().equals(supplier.getId()))
                .ifPresent(existingSupplier -> {
                    throw new ResourceConflictException(
                            "Supplier with code " + supplierCode + " already exists"
                    );
                });

        supplier.setSupplierCode(supplierCode);
        supplier.setName(normalize(request.getName()));
        supplier.setContactEmail(normalize(request.getContactEmail()));
        supplier.setActive(request.getActive() == null ? Boolean.TRUE : request.getActive());

        return toResponse(supplier);
    }

    public void deleteSupplier(Long id) {
        Supplier supplier = findSupplierById(id);

        // A supplier must not be deleted while purchase orders in an active business state
        // still reference it. This protects in-progress workflow data from disappearing.
        if (purchaseOrderRepository.existsBySupplier_IdAndStatusNot(id, PurchaseOrderStatus.CANCELLED)) {
            throw new ResourceConflictException(
                    "Supplier cannot be deleted because non-cancelled purchase orders still exist for it"
            );
        }

        // Cancelled purchase orders are treated as removable historical dependents here.
        // They are deleted first so the supplier relationship no longer blocks supplier deletion.
        List<PurchaseOrder> cancelledPurchaseOrders =
                purchaseOrderRepository.findAllBySupplier_IdAndStatus(id, PurchaseOrderStatus.CANCELLED);

        if (!cancelledPurchaseOrders.isEmpty()) {
            purchaseOrderRepository.deleteAll(cancelledPurchaseOrders);
        }

        supplierRepository.delete(supplier);
    }

    @Transactional(readOnly = true)
    public Supplier findSupplierEntityById(Long id) {
        return findSupplierById(id);
    }

    private Supplier findSupplierById(Long id) {
        return supplierRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier", id));
    }

    private SupplierResponse toResponse(Supplier supplier) {
        return new SupplierResponse(
                supplier.getId(),
                supplier.getSupplierCode(),
                supplier.getName(),
                supplier.getContactEmail(),
                supplier.getActive(),
                supplier.getCreatedAt()
        );
    }

    private String normalize(String value) {
        return value == null ? null : value.trim();
    }
}