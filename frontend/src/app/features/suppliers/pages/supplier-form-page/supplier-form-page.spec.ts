import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { SupplierApiService } from '../../../../core/api/supplier-api.service';
import { SupplierFormPageComponent } from './supplier-form-page';

describe('SupplierFormPageComponent', () => {
  let fixture: ComponentFixture<SupplierFormPageComponent>;
  let component: SupplierFormPageComponent;
  let supplierApiServiceSpy: jasmine.SpyObj<SupplierApiService>;
  let router: Router;

  beforeEach(async () => {
    // Mock API calls so the test stays focused on form behavior.
    supplierApiServiceSpy = jasmine.createSpyObj<SupplierApiService>(
      'SupplierApiService',
      ['createSupplier']
    );

    await TestBed.configureTestingModule({
      imports: [SupplierFormPageComponent],
      providers: [
        provideRouter([]),
        {
          provide: SupplierApiService,
          useValue: supplierApiServiceSpy
        }
      ]
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
  });

  function createComponent(): void {
    fixture = TestBed.createComponent(SupplierFormPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('should create the supplier form page', () => {
    createComponent();

    expect(component).toBeTruthy();
  });

  it('should initialize the form with the active flag set to true', () => {
    createComponent();

    expect(component.supplierForm.controls.active.value).toBeTrue();
  });

  it('should mark all fields as touched and not submit when the form is invalid', () => {
    createComponent();

    component.onSubmit();

    expect(component.supplierForm.invalid).toBeTrue();
    expect(component.supplierCode.touched).toBeTrue();
    expect(component.name.touched).toBeTrue();
    expect(component.contactEmail.touched).toBeTrue();
    expect(supplierApiServiceSpy.createSupplier).not.toHaveBeenCalled();
  });

  it('should submit a trimmed supplier request and navigate to the supplier list on success', () => {
    supplierApiServiceSpy.createSupplier.and.returnValue(
      of({
        id: 1,
        supplierCode: 'SUP-1001',
        name: 'Acme Industrial Supplies',
        contactEmail: 'orders@acme-industrial.com',
        active: true
      })
    );

    createComponent();

    // Keep spaces on text fields to verify trimming behavior.
    // Do not keep spaces around the email, because Angular validates
    // the raw form value before onSubmit builds the trimmed request.
    component.supplierForm.setValue({
      supplierCode: '  SUP-1001  ',
      name: '  Acme Industrial Supplies  ',
      contactEmail: 'orders@acme-industrial.com',
      active: true
    });

    component.onSubmit();

    expect(component.supplierForm.valid).toBeTrue();

    expect(supplierApiServiceSpy.createSupplier).toHaveBeenCalledWith({
      supplierCode: 'SUP-1001',
      name: 'Acme Industrial Supplies',
      contactEmail: 'orders@acme-industrial.com',
      active: true
    });

    expect(router.navigate).toHaveBeenCalledWith(['/suppliers']);
  });

  it('should show a validation message in the template when a required field is touched and empty', () => {
    createComponent();

    component.supplierCode.markAsTouched();
    component.supplierCode.setValue('');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('Supplier code is required.');
  });

  it('should show an email validation message when the email is invalid', () => {
    createComponent();

    component.contactEmail.setValue('not-an-email');
    component.contactEmail.markAsTouched();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('Please enter a valid email address.');
  });

  it('should show a 409 conflict error message when the backend reports a duplicate supplier', () => {
    supplierApiServiceSpy.createSupplier.and.returnValue(
      throwError(() => new HttpErrorResponse({ status: 409 }))
    );

    createComponent();

    component.supplierForm.setValue({
      supplierCode: 'SUP-1001',
      name: 'Acme Industrial Supplies',
      contactEmail: 'orders@acme-industrial.com',
      active: true
    });

    component.onSubmit();
    fixture.detectChanges();

    expect(component.submitErrorMessage()).toBe('A supplier with the same supplier code or email already exists.');
  });

  it('should show a backend connectivity message when the backend cannot be reached', () => {
    supplierApiServiceSpy.createSupplier.and.returnValue(
      throwError(() => new HttpErrorResponse({ status: 0 }))
    );

    createComponent();

    component.supplierForm.setValue({
      supplierCode: 'SUP-1001',
      name: 'Acme Industrial Supplies',
      contactEmail: 'orders@acme-industrial.com',
      active: true
    });

    component.onSubmit();
    fixture.detectChanges();

    expect(component.submitErrorMessage()).toContain('could not reach the backend');
  });

  it('should disable the submit button while a submission is in progress', () => {
    createComponent();

    component.isSubmitting.set(true);
    fixture.detectChanges();

    const submitButton = fixture.nativeElement.querySelector('button[type="submit"]') as HTMLButtonElement;

    expect(submitButton.disabled).toBeTrue();
    expect(submitButton.textContent).toContain('Creating Supplier...');
  });
});
