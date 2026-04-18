import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { PurchaseOrderApiService } from '../../../../core/api/purchase-order-api.service';
import { PurchaseOrderResponse } from '../../../../core/models/purchase-order-response.model';
import { PurchaseOrderDetailPageComponent } from './purchase-order-detail-page';

type PurchaseOrderApiServiceSpy = {
  getPurchaseOrderById: jasmine.Spy;
  submitPurchaseOrder: jasmine.Spy;
  approvePurchaseOrder: jasmine.Spy;
  cancelPurchaseOrder: jasmine.Spy;
  deletePurchaseOrder: jasmine.Spy;
};

describe('PurchaseOrderDetailPageComponent', () => {
  let fixture: ComponentFixture<PurchaseOrderDetailPageComponent>;
  let component: PurchaseOrderDetailPageComponent;
  let purchaseOrderApiServiceSpy: PurchaseOrderApiServiceSpy;
  let router: Router;

  const draftPurchaseOrder: PurchaseOrderResponse = {
    id: 1,
    orderNumber: 'PO-2026-1001',
    supplierId: 10,
    supplierCode: 'SUP-1001',
    supplierName: 'Acme',
    status: 'DRAFT',
    requestedBy: 'Punschkrapferl',
    orderDate: '2026-04-18',
    totalAmount: 250,
    createdAt: '2026-04-18T10:00:00',
    updatedAt: '2026-04-18T11:00:00',
    cancellationReason: null,
    cancelledAt: null,
    lines: [
      {
        id: 101,
        lineNumber: 1,
        itemDescription: 'Laptop',
        quantity: 2,
        unitPrice: 100,
        lineTotal: 200
      }
    ]
  };

  beforeEach(async () => {
    purchaseOrderApiServiceSpy = jasmine.createSpyObj('PurchaseOrderApiService', [
      'getPurchaseOrderById',
      'submitPurchaseOrder',
      'approvePurchaseOrder',
      'cancelPurchaseOrder',
      'deletePurchaseOrder'
    ]) as unknown as PurchaseOrderApiServiceSpy;

    await TestBed.configureTestingModule({
      imports: [PurchaseOrderDetailPageComponent],
      providers: [
        provideRouter([]),
        {
          provide: PurchaseOrderApiService,
          useValue: purchaseOrderApiServiceSpy
        },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({ id: '1' })
            }
          }
        }
      ]
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
  });

  function createComponent(): void {
    fixture = TestBed.createComponent(PurchaseOrderDetailPageComponent);
    component = fixture.componentInstance;
  }

  it('should create the purchase order detail page', async () => {
    purchaseOrderApiServiceSpy.getPurchaseOrderById.and.returnValue(of(draftPurchaseOrder));

    createComponent();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component).toBeTruthy();
  });

  it('should load the purchase order on init', async () => {
    purchaseOrderApiServiceSpy.getPurchaseOrderById.and.returnValue(of(draftPurchaseOrder));

    createComponent();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.purchaseOrder()?.orderNumber).toBe('PO-2026-1001');
    expect(component.canEdit()).toBeTrue();
    expect(component.canSubmit()).toBeTrue();
    expect(component.canApprove()).toBeFalse();
    expect(component.canCancel()).toBeFalse();
  });

  it('should render purchase order details and line items', async () => {
    purchaseOrderApiServiceSpy.getPurchaseOrderById.and.returnValue(of(draftPurchaseOrder));

    createComponent();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('PO-2026-1001');
    expect(compiled.textContent).toContain('Laptop');
    expect(compiled.textContent).toContain('Workflow Actions');
  });

  it('should submit a draft purchase order successfully', () => {
    purchaseOrderApiServiceSpy.submitPurchaseOrder.and.returnValue(
      of({
        ...draftPurchaseOrder,
        status: 'SUBMITTED'
      })
    );

    createComponent();
    component.purchaseOrder.set(draftPurchaseOrder);

    component.submitPurchaseOrder();

    expect(purchaseOrderApiServiceSpy.submitPurchaseOrder).toHaveBeenCalledWith(1);
    expect(component.purchaseOrder()?.status).toBe('SUBMITTED');
    expect(component.workflowSuccessMessage()).toContain('submitted successfully');
  });

  it('should approve a submitted purchase order successfully', () => {
    purchaseOrderApiServiceSpy.approvePurchaseOrder.and.returnValue(
      of({
        ...draftPurchaseOrder,
        status: 'APPROVED'
      })
    );

    createComponent();
    component.purchaseOrder.set({
      ...draftPurchaseOrder,
      status: 'SUBMITTED'
    });

    component.approvePurchaseOrder();

    expect(purchaseOrderApiServiceSpy.approvePurchaseOrder).toHaveBeenCalledWith(1);
    expect(component.purchaseOrder()?.status).toBe('APPROVED');
    expect(component.workflowSuccessMessage()).toContain('approved successfully');
  });

  it('should require a cancellation reason before cancelling', () => {
    createComponent();
    component.purchaseOrder.set({
      ...draftPurchaseOrder,
      status: 'APPROVED'
    });

    component.cancelPurchaseOrder();

    expect(component.cancelReason.touched).toBeTrue();
    expect(purchaseOrderApiServiceSpy.cancelPurchaseOrder).not.toHaveBeenCalled();
  });

  it('should cancel an approved purchase order and reset the cancel form', () => {
    purchaseOrderApiServiceSpy.cancelPurchaseOrder.and.returnValue(
      of({
        ...draftPurchaseOrder,
        status: 'CANCELLED',
        cancellationReason: 'Budget removed',
        cancelledAt: '2026-04-18T12:00:00'
      })
    );

    createComponent();
    component.purchaseOrder.set({
      ...draftPurchaseOrder,
      status: 'APPROVED'
    });
    component.cancelForm.setValue({ reason: '  Budget removed  ' });

    component.cancelPurchaseOrder();

    expect(purchaseOrderApiServiceSpy.cancelPurchaseOrder).toHaveBeenCalledWith(1, {
      reason: 'Budget removed'
    });
    expect(component.purchaseOrder()?.status).toBe('CANCELLED');
    expect(component.cancelReason.value).toBe('');
  });

  it('should navigate back to the list after successful deletion of a draft purchase order', () => {
    purchaseOrderApiServiceSpy.deletePurchaseOrder.and.returnValue(of(void 0));
    spyOn(window, 'confirm').and.returnValue(true);

    createComponent();
    component.purchaseOrder.set(draftPurchaseOrder);

    component.deletePurchaseOrder();

    expect(purchaseOrderApiServiceSpy.deletePurchaseOrder).toHaveBeenCalledWith(1);
    expect(router.navigate).toHaveBeenCalledWith(['/purchase-orders'], {
      state: {
        successMessage: 'Purchase order PO-2026-1001 was deleted successfully.'
      }
    });
  });

  it('should show an error when loading fails', async () => {
    purchaseOrderApiServiceSpy.getPurchaseOrderById.and.returnValue(
      throwError(() => new HttpErrorResponse({ status: 404 }))
    );

    createComponent();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.errorMessage()).toBe('The requested purchase order could not be found.');
  });
});
