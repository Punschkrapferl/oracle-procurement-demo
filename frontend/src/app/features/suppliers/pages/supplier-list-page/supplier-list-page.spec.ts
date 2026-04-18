import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { SupplierApiService } from '../../../../core/api/supplier-api.service';
import { SupplierResponse } from '../../../../core/models/supplier-response.model';
import { SupplierListPageComponent } from './supplier-list-page';

describe('SupplierListPageComponent', () => {
  let fixture: ComponentFixture<SupplierListPageComponent>;
  let component: SupplierListPageComponent;
  let supplierApiServiceSpy: jasmine.SpyObj<SupplierApiService>;

  const suppliersResponse: SupplierResponse[] = [
    {
      id: 1,
      supplierCode: 'SUP-1001',
      name: 'Acme Industrial Supplies',
      contactEmail: 'orders@acme-industrial.com',
      active: true
    },
    {
      id: 2,
      supplierCode: 'SUP-1002',
      name: 'Globex Procurement',
      contactEmail: 'purchasing@globex.com',
      active: false
    }
  ];

  beforeEach(async () => {
    // Mock the API so the component test stays focused on component behavior.
    supplierApiServiceSpy = jasmine.createSpyObj<SupplierApiService>(
      'SupplierApiService',
      ['getAllSuppliers']
    );

    await TestBed.configureTestingModule({
      imports: [SupplierListPageComponent],
      providers: [
        provideRouter([]),
        {
          provide: SupplierApiService,
          useValue: supplierApiServiceSpy
        }
      ]
    }).compileComponents();
  });

  function createComponent(): void {
    fixture = TestBed.createComponent(SupplierListPageComponent);
    component = fixture.componentInstance;
  }

  it('should create the supplier list page', async () => {
    supplierApiServiceSpy.getAllSuppliers.and.returnValue(of(suppliersResponse));

    createComponent();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component).toBeTruthy();
  });

  it('should load suppliers on init', async () => {
    supplierApiServiceSpy.getAllSuppliers.and.returnValue(of(suppliersResponse));

    createComponent();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.suppliers().length).toBe(2);
    expect(component.suppliers()[0].supplierCode).toBe('SUP-1001');
    expect(supplierApiServiceSpy.getAllSuppliers).toHaveBeenCalledTimes(1);
  });

  it('should render the supplier table when suppliers exist', async () => {
    supplierApiServiceSpy.getAllSuppliers.and.returnValue(of(suppliersResponse));

    createComponent();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelectorAll('tbody tr').length).toBe(2);
    expect(compiled.textContent).toContain('Supplier Directory');
    expect(compiled.textContent).toContain('Acme Industrial Supplies');
    expect(compiled.textContent).toContain('Active');
    expect(compiled.textContent).toContain('Inactive');
  });

  it('should render the empty state when no suppliers exist', async () => {
    supplierApiServiceSpy.getAllSuppliers.and.returnValue(of([]));

    createComponent();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;

    expect(component.suppliers().length).toBe(0);
    expect(compiled.textContent).toContain('No suppliers found');
    expect(compiled.textContent).toContain('Create First Supplier');
  });

  it('should show a backend connectivity error when the request fails with status 0', async () => {
    supplierApiServiceSpy.getAllSuppliers.and.returnValue(
      throwError(() => new HttpErrorResponse({ status: 0 }))
    );

    createComponent();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;

    expect(component.errorMessage()).toContain('could not reach the backend');
    expect(compiled.textContent).toContain('Could not load suppliers');
    expect(compiled.textContent).toContain('Make sure the Spring Boot application is running');
  });

  it('should render a retry button in the error state', async () => {
    supplierApiServiceSpy.getAllSuppliers.and.returnValue(
      throwError(() => new HttpErrorResponse({ status: 500, statusText: 'Server Error' }))
    );

    createComponent();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const retryButton = compiled.querySelector('button');

    expect(retryButton?.textContent).toContain('Try Again');
  });

  it('should track suppliers by id', () => {
    supplierApiServiceSpy.getAllSuppliers.and.returnValue(of([]));

    createComponent();

    const trackedValue = component.trackBySupplierId(0, suppliersResponse[0]);

    expect(trackedValue).toBe(1);
  });
});
