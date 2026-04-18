import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { PurchaseOrderApiService } from '../../../../core/api/purchase-order-api.service';
import { PurchaseOrderResponse } from '../../../../core/models/purchase-order-response.model';
import { PurchaseOrderListPageComponent } from './purchase-order-list-page';

type PurchaseOrderApiServiceSpy = {
  getAllPurchaseOrders: jasmine.Spy;
  deletePurchaseOrder: jasmine.Spy;
};

describe('PurchaseOrderListPageComponent', () => {
  let fixture: ComponentFixture<PurchaseOrderListPageComponent>;
  let component: PurchaseOrderListPageComponent;
  let purchaseOrderApiServiceSpy: PurchaseOrderApiServiceSpy;

  const purchaseOrdersResponse: PurchaseOrderResponse[] = [
    {
      id: 1,
      orderNumber: 'PO-2026-1001',
      supplierId: 10,
      supplierCode: 'SUP-1001',
      supplierName: 'Acme',
      status: 'DRAFT',
      requestedBy: 'Punschkrapferl',
      orderDate: '2026-04-18',
      totalAmount: 100,
      createdAt: '2026-04-18T10:00:00',
      updatedAt: '2026-04-18T10:00:00',
      cancellationReason: null,
      cancelledAt: null,
      lines: []
    },
    {
      id: 3,
      orderNumber: 'PO-2026-1003',
      supplierId: 11,
      supplierCode: 'SUP-1002',
      supplierName: 'Globex',
      status: 'APPROVED',
      requestedBy: 'Tom',
      orderDate: '2026-04-19',
      totalAmount: 300,
      createdAt: '2026-04-19T10:00:00',
      updatedAt: '2026-04-19T10:00:00',
      cancellationReason: null,
      cancelledAt: null,
      lines: []
    },
    {
      id: 2,
      orderNumber: 'PO-2026-1002',
      supplierId: 12,
      supplierCode: 'SUP-1003',
      supplierName: 'Initech',
      status: 'CANCELLED',
      requestedBy: 'Nina',
      orderDate: '2026-04-20',
      totalAmount: 250,
      createdAt: '2026-04-20T10:00:00',
      updatedAt: '2026-04-20T10:00:00',
      cancellationReason: 'Budget removed',
      cancelledAt: '2026-04-20T11:00:00',
      lines: []
    }
  ];

  beforeEach(async () => {
    purchaseOrderApiServiceSpy = jasmine.createSpyObj('PurchaseOrderApiService', [
      'getAllPurchaseOrders',
      'deletePurchaseOrder'
    ]) as unknown as PurchaseOrderApiServiceSpy;

    await TestBed.configureTestingModule({
      imports: [PurchaseOrderListPageComponent],
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
    fixture = TestBed.createComponent(PurchaseOrderListPageComponent);
    component = fixture.componentInstance;
  }

  it('should create the purchase order list page', async () => {
    purchaseOrderApiServiceSpy.getAllPurchaseOrders.and.returnValue(of(purchaseOrdersResponse));

    createComponent();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component).toBeTruthy();
  });

  it('should load and sort purchase orders by id descending', async () => {
    purchaseOrderApiServiceSpy.getAllPurchaseOrders.and.returnValue(of(purchaseOrdersResponse));

    createComponent();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.purchaseOrders().map((purchaseOrder) => purchaseOrder.id)).toEqual([3, 2, 1]);
  });

  it('should render the purchase order table when data exists', async () => {
    purchaseOrderApiServiceSpy.getAllPurchaseOrders.and.returnValue(of(purchaseOrdersResponse));

    createComponent();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelectorAll('tbody tr').length).toBe(3);
    expect(compiled.textContent).toContain('Purchase Order Directory');
    expect(compiled.textContent).toContain('PO-2026-1003');
    expect(compiled.textContent).toContain('View');
  });

  it('should render the empty state when no purchase orders exist', async () => {
    purchaseOrderApiServiceSpy.getAllPurchaseOrders.and.returnValue(of([]));

    createComponent();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('No purchase orders found');
    expect(compiled.textContent).toContain('Create First Purchase Order');
  });

  it('should show an error state when loading fails', async () => {
    purchaseOrderApiServiceSpy.getAllPurchaseOrders.and.returnValue(
      throwError(() => new HttpErrorResponse({ status: 0 }))
    );

    createComponent();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;

    expect(component.errorMessage()).toContain('could not reach the backend');
    expect(compiled.textContent).toContain('Could not load purchase orders');
  });

  it('should only allow edit and delete for draft purchase orders', () => {
    createComponent();

    expect(component.canEdit(purchaseOrdersResponse[0])).toBeTrue();
    expect(component.canDelete(purchaseOrdersResponse[0])).toBeTrue();
    expect(component.canEdit(purchaseOrdersResponse[1])).toBeFalse();
    expect(component.canDelete(purchaseOrdersResponse[2])).toBeFalse();
  });

  it('should delete a draft purchase order after confirmation', async () => {
    purchaseOrderApiServiceSpy.getAllPurchaseOrders.and.returnValue(of(purchaseOrdersResponse));
    purchaseOrderApiServiceSpy.deletePurchaseOrder.and.returnValue(of(void 0));
    spyOn(window, 'confirm').and.returnValue(true);

    createComponent();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    component.deletePurchaseOrder(purchaseOrdersResponse[0]);
    fixture.detectChanges();

    expect(purchaseOrderApiServiceSpy.deletePurchaseOrder).toHaveBeenCalledWith(1);
    expect(component.purchaseOrders().map((purchaseOrder) => purchaseOrder.id)).toEqual([3, 2]);
    expect(component.successMessage()).toContain('was deleted successfully');
  });

  it('should not delete when the user cancels the confirmation dialog', async () => {
    purchaseOrderApiServiceSpy.getAllPurchaseOrders.and.returnValue(of(purchaseOrdersResponse));
    spyOn(window, 'confirm').and.returnValue(false);

    createComponent();
    fixture.detectChanges();
    await fixture.whenStable();

    component.deletePurchaseOrder(purchaseOrdersResponse[0]);

    expect(purchaseOrderApiServiceSpy.deletePurchaseOrder).not.toHaveBeenCalled();
  });

  it('should not attempt to delete a non-draft purchase order', () => {
    createComponent();

    component.deletePurchaseOrder(purchaseOrdersResponse[1]);

    expect(purchaseOrderApiServiceSpy.deletePurchaseOrder).not.toHaveBeenCalled();
  });

  it('should track purchase orders by id', () => {
    createComponent();

    expect(component.trackByPurchaseOrderId(0, purchaseOrdersResponse[0])).toBe(1);
  });
});
