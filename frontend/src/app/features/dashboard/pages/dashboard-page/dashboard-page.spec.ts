import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { PurchaseOrderApiService } from '../../../../core/api/purchase-order-api.service';
import { PurchaseOrderResponse } from '../../../../core/models/purchase-order-response.model';
import { PurchaseOrderStatusSummaryResponse } from '../../../../core/models/purchase-order-status-summary-response.model';
import { DashboardPageComponent } from './dashboard-page';

type PurchaseOrderApiServiceSpy = {
  getPurchaseOrderStatusSummary: jasmine.Spy;
  getAllPurchaseOrders: jasmine.Spy;
};

describe('DashboardPageComponent', () => {
  let fixture: ComponentFixture<DashboardPageComponent>;
  let component: DashboardPageComponent;
  let purchaseOrderApiServiceSpy: PurchaseOrderApiServiceSpy;

  const summaryResponse: PurchaseOrderStatusSummaryResponse[] = [
    { status: 'APPROVED', count: 2 },
    { status: 'CANCELLED', count: 2 },
    { status: 'DRAFT', count: 1 },
    { status: 'SUBMITTED', count: 1 }
  ];

  const purchaseOrdersResponse: PurchaseOrderResponse[] = [
    {
      id: 1,
      orderNumber: 'PO-2026-1001',
      supplierId: 10,
      supplierCode: 'SUP-1001',
      supplierName: 'Acme',
      status: 'CANCELLED',
      requestedBy: 'Punschkrapferl',
      orderDate: '2026-04-18',
      totalAmount: 250,
      createdAt: '2026-04-18T09:00:00',
      updatedAt: '2026-04-18T10:00:00',
      cancellationReason: 'Supplier issue',
      cancelledAt: '2026-04-18T10:30:00',
      lines: []
    },
    {
      id: 2,
      orderNumber: 'PO-2026-1002',
      supplierId: 11,
      supplierCode: 'SUP-1002',
      supplierName: 'Globex',
      status: 'APPROVED',
      requestedBy: 'Marino',
      orderDate: '2026-04-18',
      totalAmount: 300,
      createdAt: '2026-04-18T11:00:00',
      updatedAt: '2026-04-18T12:00:00',
      cancellationReason: null,
      cancelledAt: null,
      lines: []
    },
    {
      id: 3,
      orderNumber: 'PO-2026-1003',
      supplierId: 12,
      supplierCode: 'SUP-1003',
      supplierName: 'Initech',
      status: 'SUBMITTED',
      requestedBy: 'Tom',
      orderDate: '2026-04-18',
      totalAmount: 410,
      createdAt: '2026-04-18T12:00:00',
      updatedAt: '2026-04-18T13:00:00',
      cancellationReason: null,
      cancelledAt: null,
      lines: []
    },
    {
      id: 4,
      orderNumber: 'PO-2026-1004',
      supplierId: 13,
      supplierCode: 'SUP-1004',
      supplierName: 'Umbrella',
      status: 'DRAFT',
      requestedBy: 'Firas',
      orderDate: '2026-04-18',
      totalAmount: 125,
      createdAt: '2026-04-18T13:00:00',
      updatedAt: '2026-04-18T14:00:00',
      cancellationReason: null,
      cancelledAt: null,
      lines: []
    },
    {
      id: 5,
      orderNumber: 'PO-2026-1005',
      supplierId: 14,
      supplierCode: 'SUP-1005',
      supplierName: 'Soylent',
      status: 'APPROVED',
      requestedBy: 'Nina',
      orderDate: '2026-04-18',
      totalAmount: 910,
      createdAt: '2026-04-18T14:00:00',
      updatedAt: '2026-04-18T15:00:00',
      cancellationReason: null,
      cancelledAt: null,
      lines: []
    },
    {
      id: 6,
      orderNumber: 'PO-2026-1006',
      supplierId: 15,
      supplierCode: 'SUP-1006',
      supplierName: 'Vehement',
      status: 'CANCELLED',
      requestedBy: 'Punschkrapferl',
      orderDate: '2026-04-18',
      totalAmount: 510,
      createdAt: '2026-04-18T15:00:00',
      updatedAt: '2026-04-18T16:00:00',
      cancellationReason: 'Budget removed',
      cancelledAt: '2026-04-18T16:30:00',
      lines: []
    }
  ];

  beforeEach(async () => {
    purchaseOrderApiServiceSpy = jasmine.createSpyObj('PurchaseOrderApiService', [
      'getPurchaseOrderStatusSummary',
      'getAllPurchaseOrders'
    ]) as unknown as PurchaseOrderApiServiceSpy;

    await TestBed.configureTestingModule({
      imports: [DashboardPageComponent],
      providers: [
        provideRouter([]),
        {
          provide: PurchaseOrderApiService,
          useValue: purchaseOrderApiServiceSpy
        }
      ]
    }).compileComponents();
  });

  function createComponent(): void {
    fixture = TestBed.createComponent(DashboardPageComponent);
    component = fixture.componentInstance;
  }

  function mockSuccessfulDashboardLoad(): void {
    purchaseOrderApiServiceSpy.getPurchaseOrderStatusSummary.and.returnValue(of(summaryResponse));
    purchaseOrderApiServiceSpy.getAllPurchaseOrders.and.returnValue(of(purchaseOrdersResponse));
  }

  it('should create the dashboard page', async () => {
    mockSuccessfulDashboardLoad();

    createComponent();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component).toBeTruthy();
  });

  it('should load dashboard data on init and calculate totals', async () => {
    mockSuccessfulDashboardLoad();

    createComponent();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.totalCount()).toBe(6);
    expect(component.summary().length).toBe(4);
    expect(component.purchaseOrders().length).toBe(6);
    expect(purchaseOrderApiServiceSpy.getPurchaseOrderStatusSummary).toHaveBeenCalledTimes(1);
    expect(purchaseOrderApiServiceSpy.getAllPurchaseOrders).toHaveBeenCalledTimes(1);
  });

  it('should keep only the latest 5 recent purchase orders sorted by updatedAt descending', async () => {
    mockSuccessfulDashboardLoad();

    createComponent();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const recentOrders = component.recentPurchaseOrders();

    expect(recentOrders.length).toBe(5);
    expect(recentOrders[0].orderNumber).toBe('PO-2026-1006');
    expect(recentOrders[1].orderNumber).toBe('PO-2026-1005');
    expect(recentOrders[4].orderNumber).toBe('PO-2026-1002');
  });

  it('should keep only cancelled purchase orders sorted by cancelledAt descending', async () => {
    mockSuccessfulDashboardLoad();

    createComponent();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const cancelledOrders = component.recentCancelledPurchaseOrders();

    expect(cancelledOrders.length).toBe(2);
    expect(cancelledOrders[0].orderNumber).toBe('PO-2026-1006');
    expect(cancelledOrders[1].orderNumber).toBe('PO-2026-1001');
  });

  it('should render summary cards, recent orders, and cancelled order cards', async () => {
    mockSuccessfulDashboardLoad();

    createComponent();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const firstOrderLink = compiled.querySelector('.order-link');

    expect(compiled.querySelectorAll('.summary-card').length).toBe(4);
    expect(compiled.querySelectorAll('.dashboard-table tbody tr').length).toBe(5);
    expect(compiled.querySelectorAll('.cancelled-card').length).toBe(2);
    expect(firstOrderLink?.textContent).toContain('PO-2026-1006');
    expect(compiled.textContent).toContain('Recent Purchase Orders');
    expect(compiled.textContent).toContain('Recent Cancelled Purchase Orders');
    expect(compiled.textContent).toContain('Budget removed');
  });

  it('should show a backend connectivity error message when loading fails with status 0', async () => {
    purchaseOrderApiServiceSpy.getPurchaseOrderStatusSummary.and.returnValue(
      throwError(() => new HttpErrorResponse({ status: 0 }))
    );
    purchaseOrderApiServiceSpy.getAllPurchaseOrders.and.returnValue(of([]));

    createComponent();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;

    expect(component.errorMessage()).toContain('could not reach the backend');
    expect(compiled.textContent).toContain('Could not load dashboard');
    expect(compiled.textContent).toContain('Make sure the Spring Boot application is running');
  });

  it('should show a specific empty state when there are no cancelled purchase orders', async () => {
    const purchaseOrdersWithoutCancelled = purchaseOrdersResponse.filter(
      (purchaseOrder) => purchaseOrder.status !== 'CANCELLED'
    );

    purchaseOrderApiServiceSpy.getPurchaseOrderStatusSummary.and.returnValue(
      of([
        { status: 'APPROVED', count: 2 },
        { status: 'DRAFT', count: 1 },
        { status: 'SUBMITTED', count: 1 }
      ])
    );
    purchaseOrderApiServiceSpy.getAllPurchaseOrders.and.returnValue(of(purchaseOrdersWithoutCancelled));

    createComponent();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;

    expect(component.recentCancelledPurchaseOrders().length).toBe(0);
    expect(compiled.textContent).toContain('No cancelled purchase orders yet.');
  });

  it('should format a supplier as name and code when both are present', () => {
    createComponent();

    const formattedSupplier = component.formatSupplier({
      id: 99,
      orderNumber: 'PO-2026-9999',
      supplierId: 999,
      supplierCode: 'SUP-9999',
      supplierName: 'Test Supplier',
      status: 'DRAFT',
      requestedBy: 'Tester',
      orderDate: '2026-04-18',
      totalAmount: 100,
      createdAt: '2026-04-18T10:00:00',
      updatedAt: '2026-04-18T10:00:00',
      cancellationReason: null,
      cancelledAt: null,
      lines: []
    });

    expect(formattedSupplier).toBe('Test Supplier (SUP-9999)');
  });
});
