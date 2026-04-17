package com.example.oracleprocurementdemo;

import com.example.oracleprocurementdemo.common.exception.ApiErrorResponse;
import com.example.oracleprocurementdemo.purchaseorder.dto.PurchaseOrderResponse;
import com.example.oracleprocurementdemo.purchaseorder.dto.PurchaseOrderStatusSummaryResponse;
import com.example.oracleprocurementdemo.supplier.dto.SupplierResponse;
import java.math.BigDecimal;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.resttestclient.TestRestTemplate;
import org.springframework.boot.resttestclient.autoconfigure.AutoConfigureTestRestTemplate;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.SpringBootTest.WebEnvironment;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT)
@AutoConfigureTestRestTemplate
class OracleProcurementDemoApplicationTests {

	@Autowired
	private TestRestTemplate restTemplate;

	@Autowired
	private JdbcTemplate jdbcTemplate;

	@BeforeEach
	void cleanDatabase() {
		/*
		 * Intentional test-only cleanup for full integration test isolation.
		 *
		 * Clear all application data before each test so every scenario starts
		 * from a known empty state and test results stay deterministic.
		 *
		 * The delete order is intentional as well:
		 * 1. purchase_order_lines
		 * 2. purchase_orders
		 * 3. suppliers
		 *
		 * Child tables must be cleared before parent tables to avoid foreign key violations.
		 */
		jdbcTemplate.execute("DELETE FROM purchase_order_lines");
		jdbcTemplate.execute("DELETE FROM purchase_orders");
		jdbcTemplate.execute("DELETE FROM suppliers");
	}

	@Test
	void contextLoads() {
	}

	@Test
	@DisplayName("Should create and fetch a supplier through the real API")
	void shouldCreateAndFetchSupplier() {
		String createSupplierJson = """
                {
                  "supplierCode": "SUP-2001",
                  "name": "Nordic Industrial Parts",
                  "contactEmail": "orders@nordic-industrial.com",
                  "active": true
                }
                """;

		HttpEntity<String> request = jsonRequest(createSupplierJson);

		ResponseEntity<SupplierResponse> createResponse =
				restTemplate.postForEntity("/api/suppliers", request, SupplierResponse.class);

		assertEquals(HttpStatus.CREATED, createResponse.getStatusCode());
		assertNotNull(createResponse.getBody());
		assertNotNull(createResponse.getBody().getId());
		assertEquals("SUP-2001", createResponse.getBody().getSupplierCode());
		assertEquals("Nordic Industrial Parts", createResponse.getBody().getName());
		assertEquals("orders@nordic-industrial.com", createResponse.getBody().getContactEmail());
		assertEquals(Boolean.TRUE, createResponse.getBody().getActive());

		Long supplierId = createResponse.getBody().getId();

		ResponseEntity<SupplierResponse> getByIdResponse =
				restTemplate.getForEntity("/api/suppliers/" + supplierId, SupplierResponse.class);

		assertEquals(HttpStatus.OK, getByIdResponse.getStatusCode());
		assertNotNull(getByIdResponse.getBody());
		assertEquals(supplierId, getByIdResponse.getBody().getId());
		assertEquals("SUP-2001", getByIdResponse.getBody().getSupplierCode());

		ResponseEntity<List<SupplierResponse>> getAllResponse =
				restTemplate.exchange(
						"/api/suppliers",
						HttpMethod.GET,
						null,
						new ParameterizedTypeReference<>() {
						}
				);

		assertEquals(HttpStatus.OK, getAllResponse.getStatusCode());
		assertNotNull(getAllResponse.getBody());
		assertEquals(1, getAllResponse.getBody().size());
		assertEquals("SUP-2001", getAllResponse.getBody().getFirst().getSupplierCode());
	}

	@Test
	@DisplayName("Should create, submit, approve, and summarize a purchase order")
	void shouldCreateSubmitApproveAndSummarizePurchaseOrder() {
		Long supplierId = createSupplier(
				"SUP-3001",
				"Atlas Procurement GmbH",
				"buying@atlas-procurement.com"
		);

		String createPurchaseOrderJson = """
                {
                  "orderNumber": "PO-2026-3001",
                  "supplierId": %d,
                  "requestedBy": "Punschkrapferl",
                  "orderDate": "2026-04-14",
                  "lines": [
                    {
                      "lineNumber": 1,
                      "itemDescription": "Industrial safety gloves",
                      "quantity": 10,
                      "unitPrice": 4.90
                    },
                    {
                      "lineNumber": 2,
                      "itemDescription": "Protective safety goggles",
                      "quantity": 5,
                      "unitPrice": 12.50
                    }
                  ]
                }
                """.formatted(supplierId);

		ResponseEntity<PurchaseOrderResponse> createResponse =
				restTemplate.postForEntity(
						"/api/purchase-orders",
						jsonRequest(createPurchaseOrderJson),
						PurchaseOrderResponse.class
				);

		assertEquals(HttpStatus.CREATED, createResponse.getStatusCode());
		assertNotNull(createResponse.getBody());
		assertNotNull(createResponse.getBody().getId());
		assertEquals("PO-2026-3001", createResponse.getBody().getOrderNumber());
		assertEquals(supplierId, createResponse.getBody().getSupplierId());
		assertEquals("DRAFT", createResponse.getBody().getStatus().name());
		assertEquals("Punschkrapferl", createResponse.getBody().getRequestedBy());
		assertEquals(2, createResponse.getBody().getLines().size());
		assertBigDecimalEquals("111.50", createResponse.getBody().getTotalAmount());
		assertNull(createResponse.getBody().getCancellationReason());
		assertNull(createResponse.getBody().getCancelledAt());

		Long purchaseOrderId = createResponse.getBody().getId();

		ResponseEntity<PurchaseOrderResponse> submitResponse =
				restTemplate.postForEntity(
						"/api/purchase-orders/" + purchaseOrderId + "/submit",
						null,
						PurchaseOrderResponse.class
				);

		assertEquals(HttpStatus.OK, submitResponse.getStatusCode());
		assertNotNull(submitResponse.getBody());
		assertEquals("SUBMITTED", submitResponse.getBody().getStatus().name());

		ResponseEntity<PurchaseOrderResponse> approveResponse =
				restTemplate.postForEntity(
						"/api/purchase-orders/" + purchaseOrderId + "/approve",
						null,
						PurchaseOrderResponse.class
				);

		assertEquals(HttpStatus.OK, approveResponse.getStatusCode());
		assertNotNull(approveResponse.getBody());
		assertEquals("APPROVED", approveResponse.getBody().getStatus().name());
		assertNull(approveResponse.getBody().getCancellationReason());
		assertNull(approveResponse.getBody().getCancelledAt());

		ResponseEntity<PurchaseOrderResponse> getByIdResponse =
				restTemplate.getForEntity(
						"/api/purchase-orders/" + purchaseOrderId,
						PurchaseOrderResponse.class
				);

		assertEquals(HttpStatus.OK, getByIdResponse.getStatusCode());
		assertNotNull(getByIdResponse.getBody());
		assertEquals("APPROVED", getByIdResponse.getBody().getStatus().name());
		assertBigDecimalEquals("111.50", getByIdResponse.getBody().getTotalAmount());
		assertNull(getByIdResponse.getBody().getCancellationReason());
		assertNull(getByIdResponse.getBody().getCancelledAt());

		ResponseEntity<List<PurchaseOrderStatusSummaryResponse>> summaryResponse =
				restTemplate.exchange(
						"/api/purchase-orders/summary/status",
						HttpMethod.GET,
						null,
						new ParameterizedTypeReference<>() {
						}
				);

		assertEquals(HttpStatus.OK, summaryResponse.getStatusCode());
		assertNotNull(summaryResponse.getBody());
		assertEquals(1, summaryResponse.getBody().size());
		assertEquals("APPROVED", summaryResponse.getBody().getFirst().getStatus().name());
		assertEquals(1L, summaryResponse.getBody().getFirst().getCount());
	}

	@Test
	@DisplayName("Should cancel an approved purchase order with a reason")
	void shouldCancelApprovedPurchaseOrderWithReason() {
		Long supplierId = createSupplier(
				"SUP-3501",
				"Omega Industrial Supply",
				"orders@omega-industrial.com"
		);

		Long purchaseOrderId = createDraftPurchaseOrder("PO-2026-3501", supplierId);

		ResponseEntity<PurchaseOrderResponse> submitResponse =
				restTemplate.postForEntity(
						"/api/purchase-orders/" + purchaseOrderId + "/submit",
						null,
						PurchaseOrderResponse.class
				);

		assertEquals(HttpStatus.OK, submitResponse.getStatusCode());
		assertNotNull(submitResponse.getBody());
		assertEquals("SUBMITTED", submitResponse.getBody().getStatus().name());

		ResponseEntity<PurchaseOrderResponse> approveResponse =
				restTemplate.postForEntity(
						"/api/purchase-orders/" + purchaseOrderId + "/approve",
						null,
						PurchaseOrderResponse.class
				);

		assertEquals(HttpStatus.OK, approveResponse.getStatusCode());
		assertNotNull(approveResponse.getBody());
		assertEquals("APPROVED", approveResponse.getBody().getStatus().name());

		String cancelJson = """
                {
                  "reason": "Supplier could not confirm the delivery timeline"
                }
                """;

		ResponseEntity<PurchaseOrderResponse> cancelResponse =
				restTemplate.postForEntity(
						"/api/purchase-orders/" + purchaseOrderId + "/cancel",
						jsonRequest(cancelJson),
						PurchaseOrderResponse.class
				);

		assertEquals(HttpStatus.OK, cancelResponse.getStatusCode());
		assertNotNull(cancelResponse.getBody());
		assertEquals("CANCELLED", cancelResponse.getBody().getStatus().name());
		assertEquals(
				"Supplier could not confirm the delivery timeline",
				cancelResponse.getBody().getCancellationReason()
		);
		assertNotNull(cancelResponse.getBody().getCancelledAt());

		ResponseEntity<PurchaseOrderResponse> getByIdResponse =
				restTemplate.getForEntity(
						"/api/purchase-orders/" + purchaseOrderId,
						PurchaseOrderResponse.class
				);

		assertEquals(HttpStatus.OK, getByIdResponse.getStatusCode());
		assertNotNull(getByIdResponse.getBody());
		assertEquals("CANCELLED", getByIdResponse.getBody().getStatus().name());
		assertEquals(
				"Supplier could not confirm the delivery timeline",
				getByIdResponse.getBody().getCancellationReason()
		);
		assertNotNull(getByIdResponse.getBody().getCancelledAt());

		ResponseEntity<List<PurchaseOrderStatusSummaryResponse>> summaryResponse =
				restTemplate.exchange(
						"/api/purchase-orders/summary/status",
						HttpMethod.GET,
						null,
						new ParameterizedTypeReference<>() {
						}
				);

		assertEquals(HttpStatus.OK, summaryResponse.getStatusCode());
		assertNotNull(summaryResponse.getBody());
		assertEquals(1, summaryResponse.getBody().size());
		assertEquals("CANCELLED", summaryResponse.getBody().getFirst().getStatus().name());
		assertEquals(1L, summaryResponse.getBody().getFirst().getCount());
	}

	@Test
	@DisplayName("Should delete supplier after its purchase orders were cancelled")
	void shouldDeleteSupplierAfterItsPurchaseOrdersWereCancelled() {
		Long supplierId = createSupplier(
				"SUP-3601",
				"Round Trip Supply GmbH",
				"orders@roundtrip-supply.com"
		);

		Long purchaseOrderId = createDraftPurchaseOrder("PO-2026-3601", supplierId);

		ResponseEntity<PurchaseOrderResponse> submitResponse =
				restTemplate.postForEntity(
						"/api/purchase-orders/" + purchaseOrderId + "/submit",
						null,
						PurchaseOrderResponse.class
				);

		assertEquals(HttpStatus.OK, submitResponse.getStatusCode());
		assertNotNull(submitResponse.getBody());
		assertEquals("SUBMITTED", submitResponse.getBody().getStatus().name());

		ResponseEntity<PurchaseOrderResponse> approveResponse =
				restTemplate.postForEntity(
						"/api/purchase-orders/" + purchaseOrderId + "/approve",
						null,
						PurchaseOrderResponse.class
				);

		assertEquals(HttpStatus.OK, approveResponse.getStatusCode());
		assertNotNull(approveResponse.getBody());
		assertEquals("APPROVED", approveResponse.getBody().getStatus().name());

		String cancelJson = """
                {
                  "reason": "Order cancelled as part of supplier offboarding cleanup"
                }
                """;

		ResponseEntity<PurchaseOrderResponse> cancelResponse =
				restTemplate.postForEntity(
						"/api/purchase-orders/" + purchaseOrderId + "/cancel",
						jsonRequest(cancelJson),
						PurchaseOrderResponse.class
				);

		assertEquals(HttpStatus.OK, cancelResponse.getStatusCode());
		assertNotNull(cancelResponse.getBody());
		assertEquals("CANCELLED", cancelResponse.getBody().getStatus().name());

		ResponseEntity<Void> deleteSupplierResponse =
				restTemplate.exchange(
						"/api/suppliers/" + supplierId,
						HttpMethod.DELETE,
						null,
						Void.class
				);

		assertEquals(HttpStatus.NO_CONTENT, deleteSupplierResponse.getStatusCode());

		ResponseEntity<ApiErrorResponse> getDeletedSupplierResponse =
				restTemplate.getForEntity(
						"/api/suppliers/" + supplierId,
						ApiErrorResponse.class
				);

		assertEquals(HttpStatus.NOT_FOUND, getDeletedSupplierResponse.getStatusCode());
		assertNotNull(getDeletedSupplierResponse.getBody());

		ResponseEntity<ApiErrorResponse> getDeletedPurchaseOrderResponse =
				restTemplate.getForEntity(
						"/api/purchase-orders/" + purchaseOrderId,
						ApiErrorResponse.class
				);

		assertEquals(HttpStatus.NOT_FOUND, getDeletedPurchaseOrderResponse.getStatusCode());
		assertNotNull(getDeletedPurchaseOrderResponse.getBody());
	}

	@Test
	@DisplayName("Should reject purchase order approval while still in DRAFT")
	void shouldRejectApproveWhenOrderIsStillDraft() {
		Long supplierId = createSupplier(
				"SUP-4001",
				"Delta Manufacturing Supply",
				"procurement@delta-manufacturing.com"
		);

		Long purchaseOrderId = createDraftPurchaseOrder("PO-2026-4001", supplierId);

		ResponseEntity<ApiErrorResponse> response =
				restTemplate.postForEntity(
						"/api/purchase-orders/" + purchaseOrderId + "/approve",
						null,
						ApiErrorResponse.class
				);

		assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
		assertNotNull(response.getBody());
		assertTrue(response.getBody().getMessage().contains("Only SUBMITTED purchase orders can be approved"));
	}

	@Test
	@DisplayName("Should update a draft purchase order and replace lines without Oracle unique constraint errors")
	void shouldUpdateDraftPurchaseOrderAndReplaceLines() {
		Long supplierId = createSupplier(
				"SUP-5001",
				"Vertex Industrial Group",
				"orders@vertex-industrial.com"
		);

		Long purchaseOrderId = createDraftPurchaseOrder("PO-2026-5001", supplierId);

		String updatePurchaseOrderJson = """
                {
                  "orderNumber": "PO-2026-5001",
                  "supplierId": %d,
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
                """.formatted(supplierId);

		ResponseEntity<PurchaseOrderResponse> updateResponse =
				restTemplate.exchange(
						"/api/purchase-orders/" + purchaseOrderId,
						HttpMethod.PUT,
						jsonRequest(updatePurchaseOrderJson),
						PurchaseOrderResponse.class
				);

		assertEquals(HttpStatus.OK, updateResponse.getStatusCode());
		assertNotNull(updateResponse.getBody());
		assertEquals("DRAFT", updateResponse.getBody().getStatus().name());
		assertEquals(2, updateResponse.getBody().getLines().size());
		assertEquals(20, updateResponse.getBody().getLines().get(0).getQuantity());
		assertEquals(8, updateResponse.getBody().getLines().get(1).getQuantity());
		assertBigDecimalEquals("198.00", updateResponse.getBody().getTotalAmount());
		assertNull(updateResponse.getBody().getCancellationReason());
		assertNull(updateResponse.getBody().getCancelledAt());

		ResponseEntity<PurchaseOrderResponse> getByIdResponse =
				restTemplate.getForEntity(
						"/api/purchase-orders/" + purchaseOrderId,
						PurchaseOrderResponse.class
				);

		assertEquals(HttpStatus.OK, getByIdResponse.getStatusCode());
		assertNotNull(getByIdResponse.getBody());
		assertEquals(2, getByIdResponse.getBody().getLines().size());
		assertEquals(20, getByIdResponse.getBody().getLines().get(0).getQuantity());
		assertEquals(8, getByIdResponse.getBody().getLines().get(1).getQuantity());
		assertBigDecimalEquals("198.00", getByIdResponse.getBody().getTotalAmount());
		assertNull(getByIdResponse.getBody().getCancellationReason());
		assertNull(getByIdResponse.getBody().getCancelledAt());
	}

	private Long createSupplier(String supplierCode, String name, String contactEmail) {
		String createSupplierJson = """
                {
                  "supplierCode": "%s",
                  "name": "%s",
                  "contactEmail": "%s",
                  "active": true
                }
                """.formatted(supplierCode, name, contactEmail);

		ResponseEntity<SupplierResponse> response =
				restTemplate.postForEntity(
						"/api/suppliers",
						jsonRequest(createSupplierJson),
						SupplierResponse.class
				);

		assertEquals(HttpStatus.CREATED, response.getStatusCode());
		assertNotNull(response.getBody());
		assertNotNull(response.getBody().getId());

		return response.getBody().getId();
	}

	private Long createDraftPurchaseOrder(String orderNumber, Long supplierId) {
		String createPurchaseOrderJson = """
                {
                  "orderNumber": "%s",
                  "supplierId": %d,
                  "requestedBy": "Punschkrapferl",
                  "orderDate": "2026-04-14",
                  "lines": [
                    {
                      "lineNumber": 1,
                      "itemDescription": "Industrial safety gloves",
                      "quantity": 10,
                      "unitPrice": 4.90
                    },
                    {
                      "lineNumber": 2,
                      "itemDescription": "Protective safety goggles",
                      "quantity": 5,
                      "unitPrice": 12.50
                    }
                  ]
                }
                """.formatted(orderNumber, supplierId);

		ResponseEntity<PurchaseOrderResponse> response =
				restTemplate.postForEntity(
						"/api/purchase-orders",
						jsonRequest(createPurchaseOrderJson),
						PurchaseOrderResponse.class
				);

		assertEquals(HttpStatus.CREATED, response.getStatusCode());
		assertNotNull(response.getBody());
		assertNotNull(response.getBody().getId());

		return response.getBody().getId();
	}

	private HttpEntity<String> jsonRequest(String body) {
		HttpHeaders headers = new HttpHeaders();
		headers.setContentType(MediaType.APPLICATION_JSON);
		return new HttpEntity<>(body, headers);
	}

	private void assertBigDecimalEquals(String expected, BigDecimal actual) {
		assertNotNull(actual);
		assertEquals(0, new BigDecimal(expected).compareTo(actual));
	}
}