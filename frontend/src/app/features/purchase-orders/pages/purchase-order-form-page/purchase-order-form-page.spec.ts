import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { PurchaseOrderApiService } from '../../../../core/api/purchase-order-api.service';
import { SupplierApiService } from '../../../../core/api/supplier-api.service';
import { PurchaseOrderResponse } from '../../../../core/models/purchase-order-response.model';
import { SupplierResponse } from '../../../../core/models/supplier-response.model';
import { PurchaseOrderFormPageComponent } from './purchase-order-form-page';

type PurchaseOrderApiServiceSpy = {
  getPurchaseOrderById: jasmine.Spy;
  createPurchaseOrder: jasmine.Spy;
  updatePurchaseOrder: jasmine.Spy;
};

type SupplierApiServiceSpy = {
  getAllSuppliers: jasmine.Spy;
};

describe('PurchaseOrderFormPageComponent', () => {
  let fixture: ComponentFixture<PurchaseOrderFormPageComponent>;
  let component: PurchaseOrderFormPageComponent;
  let purchaseOrderApiServiceSpy: PurchaseOrderApiServiceSpy;
  let supplierApiServiceSpy: SupplierApiServiceSpy;
  let router: Router;

  const suppliersResponse: SupplierResponse[] = [
    {
      id: 1,
      supplierCode: 'SUP-1001',
      name: 'Acme',
      contactEmail: 'orders@acme.com',
      active: true
    },
    {
      id: 2,
      supplierCode: 'SUP-1002',
      name: 'Inactive Supplier',
      contactEmail: 'inactive@acme.com',
      active: false
    }
  ];

  const draftPurchaseOrder: PurchaseOrderResponse = {
    id: 55,
    orderNumber: 'PO-2026-1055',
    supplierId: 1,
    supplierCode: 'SUP-1001',
    supplierName: 'Acme',
    status: 'DRAFT',
    requestedBy: 'Punschkrapferl',
    orderDate: '2026-04-18',
    totalAmount: 200,
    createdAt: '2026-04-18T10:00:00',
    updatedAt: '2026-04-18T10:30:00',
    cancellationReason: null,
    cancelledAt: null,
    lines: [
      {
        id: 1,
        lineNumber: 1,
        itemDescription: 'Laptop',
        quantity: 2,
        unitPrice: 100,
        lineTotal: 200
      }
    ]
  };

  async function configureTestingModule(routeParams: Record<string, string> = {}): Promise<void> {
    purchaseOrderApiServiceSpy = jasmine.createSpyObj('PurchaseOrderApiService', [
      'getPurchaseOrderById',
      'createPurchaseOrder',
      'updatePurchaseOrder'
    ]) as unknown as PurchaseOrderApiServiceSpy;

    supplierApiServiceSpy = jasmine.createSpyObj('SupplierApiService', [
      'getAllSuppliers'
    ]) as unknown as SupplierApiServiceSpy;

    await TestBed.configureTestingModule({
      imports: [PurchaseOrderFormPageComponent],
      providers: [
        provideRouter([]),
        {
          provide: PurchaseOrderApiService,
          useValue: purchaseOrderApiServiceSpy
        },
        {
          provide: SupplierApiService,
          useValue: supplierApiServiceSpy
        },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap(routeParams)
            }
          }
        }
      ]
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
  }

  beforeEach(async () => {
    await configureTestingModule();
  });

  function createComponent(): void {
    fixture = TestBed.createComponent(PurchaseOrderFormPageComponent);
    component = fixture.componentInstance;
  }

  it('should create the purchase order form page', async () => {
    supplierApiServiceSpy.getAllSuppliers.and.returnValue(of(suppliersResponse));

    createComponent();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component).toBeTruthy();
  });

  it('should load suppliers on init and keep only active suppliers in the dropdown model', async () => {
    supplierApiServiceSpy.getAllSuppliers.and.returnValue(of(suppliersResponse));

    createComponent();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.suppliers().length).toBe(2);
    expect(component.activeSuppliers().length).toBe(1);
    expect(component.activeSuppliers()[0].name).toBe('Acme');
  });

  it('should add and remove line items', async () => {
    supplierApiServiceSpy.getAllSuppliers.and.returnValue(of(suppliersResponse));

    createComponent();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.lines.length).toBe(1);

    component.addLine();
    expect(component.lines.length).toBe(2);

    component.removeLine(1);
    expect(component.lines.length).toBe(1);
  });

  it('should calculate line totals and order total', async () => {
    supplierApiServiceSpy.getAllSuppliers.and.returnValue(of(suppliersResponse));

    createComponent();
    fixture.detectChanges();
    await fixture.whenStable();

    component.lineFormGroups[0].patchValue({
      itemDescription: 'Laptop',
      quantity: 3,
      unitPrice: '99.50'
    });

    expect(component.getLineTotal(0)).toBe(298.5);
    expect(component.getOrderTotal()).toBe(298.5);
  });

  it('should prevent comma decimal input', async () => {
    supplierApiServiceSpy.getAllSuppliers.and.returnValue(of(suppliersResponse));

    createComponent();
    fixture.detectChanges();
    await fixture.whenStable();

    const event = new KeyboardEvent('keydown', { key: ',' });
    spyOn(event, 'preventDefault');

    component.preventCommaDecimal(event);

    expect(event.preventDefault).toHaveBeenCalled();
  });

  it('should sanitize pasted unit price values', async () => {
    supplierApiServiceSpy.getAllSuppliers.and.returnValue(of(suppliersResponse));

    createComponent();
    fixture.detectChanges();
    await fixture.whenStable();

    const clipboardEvent = {
      clipboardData: {
        getData: () => '€ 12,34'
      },
      preventDefault: jasmine.createSpy('preventDefault')
    } as unknown as ClipboardEvent;

    component.handleUnitPricePaste(0, clipboardEvent);

    expect(component.lineFormGroups[0].controls['unitPrice'].value).toBe('12.34');
  });

  it('should create a new purchase order and navigate back to the list', async () => {
    supplierApiServiceSpy.getAllSuppliers.and.returnValue(of(suppliersResponse));
    purchaseOrderApiServiceSpy.createPurchaseOrder.and.returnValue(of(draftPurchaseOrder));

    createComponent();
    fixture.detectChanges();
    await fixture.whenStable();

    component.purchaseOrderForm.patchValue({
      orderNumber: '  PO-2026-1055  ',
      supplierId: 1,
      requestedBy: '  Punschkrapferl  ',
      orderDate: '2026-04-18'
    });

    component.lineFormGroups[0].patchValue({
      itemDescription: '  Laptop  ',
      quantity: 2,
      unitPrice: '100.00'
    });

    component.onSubmit();

    expect(purchaseOrderApiServiceSpy.createPurchaseOrder).toHaveBeenCalledWith({
      orderNumber: 'PO-2026-1055',
      supplierId: 1,
      requestedBy: 'Punschkrapferl',
      orderDate: '2026-04-18',
      lines: [
        {
          lineNumber: 1,
          itemDescription: 'Laptop',
          quantity: 2,
          unitPrice: 100
        }
      ]
    });

    expect(router.navigate).toHaveBeenCalledWith(['/purchase-orders']);
  });

  it('should load a purchase order in edit mode and populate the form', async () => {
    TestBed.resetTestingModule();
    await configureTestingModule({ id: '55' });

    supplierApiServiceSpy.getAllSuppliers.and.returnValue(of(suppliersResponse));
    purchaseOrderApiServiceSpy.getPurchaseOrderById.and.returnValue(of(draftPurchaseOrder));

    createComponent();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.isEditMode()).toBeTrue();
    expect(component.loadedPurchaseOrder()?.orderNumber).toBe('PO-2026-1055');
    expect(component.orderNumber.value).toBe('PO-2026-1055');
    expect(component.lineFormGroups.length).toBe(1);
    expect(component.lineFormGroups[0].controls['itemDescription'].value).toBe('Laptop');
  });

  it('should update a draft purchase order in edit mode and navigate to detail page', async () => {
    TestBed.resetTestingModule();
    await configureTestingModule({ id: '55' });

    supplierApiServiceSpy.getAllSuppliers.and.returnValue(of(suppliersResponse));
    purchaseOrderApiServiceSpy.getPurchaseOrderById.and.returnValue(of(draftPurchaseOrder));
    purchaseOrderApiServiceSpy.updatePurchaseOrder.and.returnValue(
      of({
        ...draftPurchaseOrder,
        requestedBy: 'Updated User'
      })
    );

    createComponent();
    fixture.detectChanges();
    await fixture.whenStable();

    component.purchaseOrderForm.patchValue({
      requestedBy: '  Updated User  '
    });

    component.onSubmit();

    expect(purchaseOrderApiServiceSpy.updatePurchaseOrder).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/purchase-orders', 55]);
  });

  it('should block editing when the loaded purchase order is not in draft status', async () => {
    TestBed.resetTestingModule();
    await configureTestingModule({ id: '55' });

    supplierApiServiceSpy.getAllSuppliers.and.returnValue(of(suppliersResponse));
    purchaseOrderApiServiceSpy.getPurchaseOrderById.and.returnValue(
      of({
        ...draftPurchaseOrder,
        status: 'APPROVED'
      })
    );

    createComponent();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.isEditBlocked()).toBeTrue();
    expect(component.purchaseOrderForm.disabled).toBeTrue();
  });

  it('should show a submit error when the backend returns 400', async () => {
    supplierApiServiceSpy.getAllSuppliers.and.returnValue(of(suppliersResponse));
    purchaseOrderApiServiceSpy.createPurchaseOrder.and.returnValue(
      throwError(() => new HttpErrorResponse({ status: 400 }))
    );

    createComponent();
    fixture.detectChanges();
    await fixture.whenStable();

    component.purchaseOrderForm.patchValue({
      orderNumber: 'PO-2026-1055',
      supplierId: 1,
      requestedBy: 'Punschkrapferl',
      orderDate: '2026-04-18'
    });

    component.lineFormGroups[0].patchValue({
      itemDescription: 'Laptop',
      quantity: 2,
      unitPrice: '100.00'
    });

    component.onSubmit();

    expect(component.submitErrorMessage()).toContain('purchase order data is invalid');
  });
});
