package com.example.oracleprocurementdemo.purchaseorder.repository;

import com.example.oracleprocurementdemo.purchaseorder.dto.PurchaseOrderStatusSummaryResponse;
import com.example.oracleprocurementdemo.purchaseorder.entity.PurchaseOrder;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface PurchaseOrderRepository extends JpaRepository<PurchaseOrder, Long> {

    boolean existsByOrderNumber(String orderNumber);

    Optional<PurchaseOrder> findByOrderNumber(String orderNumber);

    boolean existsBySupplier_Id(Long supplierId);

    @EntityGraph(attributePaths = {"supplier", "lines"})
    @Query("select po from PurchaseOrder po where po.id = :id")
    Optional<PurchaseOrder> findDetailsById(Long id);

    @EntityGraph(attributePaths = {"supplier"})
    @Query("select po from PurchaseOrder po order by po.createdAt desc")
    List<PurchaseOrder> findAllWithSupplierOrderByCreatedAtDesc();

    @Query("""
           select new com.example.oracleprocurementdemo.purchaseorder.dto.PurchaseOrderStatusSummaryResponse(
               po.status,
               count(po)
           )
           from PurchaseOrder po
           group by po.status
           order by po.status
           """)
    List<PurchaseOrderStatusSummaryResponse> getStatusSummary();
}