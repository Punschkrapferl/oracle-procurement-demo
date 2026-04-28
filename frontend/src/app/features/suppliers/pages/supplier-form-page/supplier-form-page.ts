import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { SupplierApiService } from '../../../../core/api/supplier-api.service';
import { CreateSupplierRequest } from '../../../../core/models/create-supplier-request.model';
import { SupplierResponse } from '../../../../core/models/supplier-response.model';
import { UpdateSupplierRequest } from '../../../../core/models/update-supplier-request.model';

@Component({
  selector: 'app-supplier-form-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './supplier-form-page.html',
  styleUrl: './supplier-form-page.css'
})
export class SupplierFormPageComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly supplierApiService = inject(SupplierApiService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly supplierId = signal<number | null>(null);
  readonly loadedSupplier = signal<SupplierResponse | null>(null);

  readonly isLoadingSupplier = signal(false);
  readonly loadErrorMessage = signal('');
  readonly isSubmitting = signal(false);
  readonly submitErrorMessage = signal('');

  readonly isEditMode = computed(() => this.supplierId() !== null);

  readonly pageTitle = computed(() => {
    const supplier = this.loadedSupplier();

    if (this.isEditMode() && supplier) {
      return `Edit Supplier ${supplier.supplierCode}`;
    }

    return this.isEditMode() ? 'Edit Supplier' : 'New Supplier';
  });

  readonly pageDescription = computed(() =>
    this.isEditMode()
      ? 'Update supplier master data or reactivate an inactive supplier.'
      : 'Create a supplier that can later be used in the procurement workflow.'
  );

  readonly formCardTitle = computed(() =>
    this.isEditMode() ? 'Supplier Update' : 'Supplier Details'
  );

  readonly formCardDescription = computed(() =>
    this.isEditMode()
      ? 'Edit the supplier information and save the full update payload.'
      : 'Fill in the supplier information and submit it to the backend.'
  );

  readonly submitButtonLabel = computed(() => {
    if (this.isSubmitting()) {
      return this.isEditMode() ? 'Updating Supplier...' : 'Creating Supplier...';
    }

    return this.isEditMode() ? 'Update Supplier' : 'Create Supplier';
  });

  readonly supplierForm = this.formBuilder.nonNullable.group({
    supplierCode: ['', [Validators.required, Validators.maxLength(50)]],
    name: ['', [Validators.required, Validators.maxLength(150)]],
    contactEmail: ['', [Validators.required, Validators.email, Validators.maxLength(150)]],
    active: [true]
  });

  ngOnInit(): void {
    this.initializeRouteState();

    if (this.isEditMode()) {
      this.loadSupplierForEdit();
    }
  }

  get supplierCode() {
    return this.supplierForm.controls.supplierCode;
  }

  get name() {
    return this.supplierForm.controls.name;
  }

  get contactEmail() {
    return this.supplierForm.controls.contactEmail;
  }

  get active() {
    return this.supplierForm.controls.active;
  }

  loadSupplierForEdit(): void {
    const id = this.supplierId();

    if (!id) {
      return;
    }

    this.isLoadingSupplier.set(true);
    this.loadErrorMessage.set('');
    this.submitErrorMessage.set('');

    this.supplierApiService
      .getSupplierById(id)
      .pipe(
        finalize(() => {
          this.isLoadingSupplier.set(false);
        })
      )
      .subscribe({
        next: (supplier) => {
          this.loadedSupplier.set(supplier);
          this.populateFormFromSupplier(supplier);
        },
        error: (error: HttpErrorResponse) => {
          this.loadedSupplier.set(null);
          this.loadErrorMessage.set(this.buildLoadErrorMessage(error));
          console.error('Failed to load supplier for edit', error);
        }
      });
  }

  onSubmit(): void {
    this.submitErrorMessage.set('');

    if (this.supplierForm.invalid) {
      this.supplierForm.markAllAsTouched();
      return;
    }

    const request: CreateSupplierRequest | UpdateSupplierRequest = {
      supplierCode: this.supplierCode.value.trim(),
      name: this.name.value.trim(),
      contactEmail: this.contactEmail.value.trim(),
      active: this.active.value
    };

    this.isSubmitting.set(true);

    const request$ = this.isEditMode() && this.supplierId()
      ? this.supplierApiService.updateSupplier(this.supplierId()!, request)
      : this.supplierApiService.createSupplier(request);

    request$
      .pipe(
        finalize(() => {
          this.isSubmitting.set(false);
        })
      )
      .subscribe({
        next: () => {
          void this.router.navigate(['/suppliers']);
        },
        error: (error: HttpErrorResponse) => {
          this.submitErrorMessage.set(this.buildSubmitErrorMessage(error));
          console.error('Failed to save supplier', error);
        }
      });
  }

  private initializeRouteState(): void {
    const idParam = this.route.snapshot.paramMap.get('id');

    if (!idParam) {
      this.supplierId.set(null);
      return;
    }

    const parsedId = Number(idParam);

    if (!parsedId || Number.isNaN(parsedId)) {
      this.supplierId.set(null);
      this.loadErrorMessage.set('The supplier id in the route is invalid.');
      return;
    }

    this.supplierId.set(parsedId);
  }

  private populateFormFromSupplier(supplier: SupplierResponse): void {
    this.supplierForm.setValue({
      supplierCode: supplier.supplierCode,
      name: supplier.name,
      contactEmail: supplier.contactEmail,
      active: supplier.active
    });
  }

  private buildLoadErrorMessage(error: HttpErrorResponse): string {
    if (error.status === 404) {
      return 'The requested supplier could not be found.';
    }

    return this.buildErrorMessage(
      error,
      'The frontend could not reach the backend while loading the supplier.',
      'Failed to load supplier'
    );
  }

  private buildSubmitErrorMessage(error: HttpErrorResponse): string {
    if (error.status === 400) {
      return this.isEditMode()
        ? 'The updated supplier data is invalid. Please check the form fields and try again.'
        : 'The supplier data is invalid. Please check the form fields and try again.';
    }

    if (error.status === 409) {
      return 'A supplier with the same supplier code or email already exists.';
    }

    return this.buildErrorMessage(
      error,
      'The frontend could not reach the backend. Make sure the Spring Boot application is running on http://localhost:8080.',
      'Request failed'
    );
  }

  private buildErrorMessage(
    error: HttpErrorResponse,
    offlineMessage: string,
    fallbackPrefix: string
  ): string {
    if (error.status === 0) {
      return offlineMessage;
    }

    const backendMessage = this.extractBackendMessage(error);

    if (backendMessage) {
      return backendMessage;
    }

    return `${fallbackPrefix} with status ${error.status}${error.statusText ? ` (${error.statusText})` : ''}.`;
  }

  private extractBackendMessage(error: HttpErrorResponse): string | null {
    if (typeof error.error === 'string' && error.error.trim().length > 0) {
      return error.error;
    }

    if (
      error.error &&
      typeof error.error === 'object' &&
      'message' in error.error &&
      typeof error.error.message === 'string'
    ) {
      return error.error.message;
    }

    return null;
  }
}
