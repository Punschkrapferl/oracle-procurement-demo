import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';

import { API_CONFIG } from '../config/api.config';
import { CancelPurchaseOrderRequest } from '../models/cancel-purchase-order-request.model';
import { PurchaseOrderResponse } from '../models/purchase-order-response.model';
import { PurchaseOrderStatusSummaryResponse } from '../models/purchase-order-status-summary-response.model';
import { PurchaseOrderApiService } from './purchase-order-api.service';

describe('PurchaseOrderApiService', () => {
  let service: PurchaseOrderApiService;
  let httpTestingController: HttpTestingController;

  const baseUrl = `${API_CONFIG.baseUrl}/purchase-orders`;

  const purchaseOrderResponse: PurchaseOrderResponse = {
    id: 1,
    orderNumber: 'PO-2026-1001',
    supplierId: 10,
    supplierCode: 'SUP-1001',
    supplierName: 'Acme',
    status: 'DRAFT',
    requestedBy: 'Abood',
    orderDate: '2026-04-18',
    totalAmount: 150,
    createdAt: '2026-04-18T10:00:00',
    updatedAt: '2026-04-18T10:00:00',
    cancellationReason: null,
    cancelledAt: null,
    lines: []
  };

  const statusSummaryResponse: PurchaseOrderStatusSummaryResponse[] = [
    { status: 'DRAFT', count: 1 },
    { status: 'APPROVED', count: 2 }
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        // The service under test uses Angular HttpClient internally.
        provideHttpClient(),

        // This testing provider lets us intercept outgoing HTTP calls safely.
        provideHttpClientTesting(),

        PurchaseOrderApiService
      ]
    });

    service = TestBed.inject(PurchaseOrderApiService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    // Verifies that every expected HTTP request was asserted in the test.
    httpTestingController.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should load all purchase orders', () => {
    let actualResponse: PurchaseOrderResponse[] | undefined;

    service.getAllPurchaseOrders().subscribe((response) => {
      actualResponse = response;
    });

    const request = httpTestingController.expectOne(baseUrl);

    expect(request.request.method).toBe('GET');

    request.flush([purchaseOrderResponse]);

    expect(actualResponse).toEqual([purchaseOrderResponse]);
  });

  it('should load a purchase order status summary', () => {
    let actualResponse: PurchaseOrderStatusSummaryResponse[] | undefined;

    service.getPurchaseOrderStatusSummary().subscribe((response) => {
      actualResponse = response;
    });

    const request = httpTestingController.expectOne(`${baseUrl}/summary/status`);

    expect(request.request.method).toBe('GET');

    request.flush(statusSummaryResponse);

    expect(actualResponse).toEqual(statusSummaryResponse);
  });

  it('should load one purchase order by id', () => {
    let actualResponse: PurchaseOrderResponse | undefined;

    service.getPurchaseOrderById(1).subscribe((response) => {
      actualResponse = response;
    });

    const request = httpTestingController.expectOne(`${baseUrl}/1`);

    expect(request.request.method).toBe('GET');

    request.flush(purchaseOrderResponse);

    expect(actualResponse).toEqual(purchaseOrderResponse);
  });

  it('should submit a purchase order', () => {
    let actualResponse: PurchaseOrderResponse | undefined;

    service.submitPurchaseOrder(1).subscribe((response) => {
      actualResponse = response;
    });

    const request = httpTestingController.expectOne(`${baseUrl}/1/submit`);

    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({});

    request.flush({
      ...purchaseOrderResponse,
      status: 'SUBMITTED'
    });

    expect(actualResponse?.status).toBe('SUBMITTED');
  });

  it('should approve a purchase order', () => {
    let actualResponse: PurchaseOrderResponse | undefined;

    service.approvePurchaseOrder(1).subscribe((response) => {
      actualResponse = response;
    });

    const request = httpTestingController.expectOne(`${baseUrl}/1/approve`);

    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({});

    request.flush({
      ...purchaseOrderResponse,
      status: 'APPROVED'
    });

    expect(actualResponse?.status).toBe('APPROVED');
  });

  it('should cancel a purchase order with the provided cancellation request', () => {
    const cancelRequest: CancelPurchaseOrderRequest = {
      reason: 'Budget removed'
    };

    let actualResponse: PurchaseOrderResponse | undefined;

    service.cancelPurchaseOrder(1, cancelRequest).subscribe((response) => {
      actualResponse = response;
    });

    const request = httpTestingController.expectOne(`${baseUrl}/1/cancel`);

    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(cancelRequest);

    request.flush({
      ...purchaseOrderResponse,
      status: 'CANCELLED',
      cancellationReason: 'Budget removed',
      cancelledAt: '2026-04-18T12:30:00'
    });

    expect(actualResponse?.status).toBe('CANCELLED');
    expect(actualResponse?.cancellationReason).toBe('Budget removed');
  });

  it('should delete a purchase order', () => {
    let completed = false;

    service.deletePurchaseOrder(1).subscribe(() => {
      completed = true;
    });

    const request = httpTestingController.expectOne(`${baseUrl}/1`);

    expect(request.request.method).toBe('DELETE');

    request.flush(null);

    expect(completed).toBeTrue();
  });
});
