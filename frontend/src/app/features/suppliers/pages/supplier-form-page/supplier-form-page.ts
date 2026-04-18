import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { SupplierApiService } from '../../../../core/api/supplier-api.service';
import { CreateSupplierRequest } from '../../../../core/models/create-supplier-request.model';

@Component({
  selector: 'app-supplier-form-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './supplier-form-page.html',
  styleUrl: './supplier-form-page.css'
})
export class SupplierFormPageComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly supplierApiService = inject(SupplierApiService);
  private readonly router = inject(Router);

  readonly isSubmitting = signal(false);
  readonly submitErrorMessage = signal('');

  readonly supplierForm = this.formBuilder.nonNullable.group({
    supplierCode: ['', [Validators.required, Validators.maxLength(50)]],
    name: ['', [Validators.required, Validators.maxLength(150)]],
    contactEmail: ['', [Validators.required, Validators.email, Validators.maxLength(150)]],
    active: [true]
  });

  // Validates, builds the request payload, and sends it to the backend.
  onSubmit(): void {
    this.submitErrorMessage.set('');

    if (this.supplierForm.invalid) {
      this.supplierForm.markAllAsTouched();
      return;
    }

    const request: CreateSupplierRequest = {
      supplierCode: this.supplierForm.controls.supplierCode.value.trim(),
      name: this.supplierForm.controls.name.value.trim(),
      contactEmail: this.supplierForm.controls.contactEmail.value.trim(),
      active: this.supplierForm.controls.active.value
    };

    this.isSubmitting.set(true);

    this.supplierApiService
      .createSupplier(request)
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
          console.error('Failed to create supplier', error);
        }
      });
  }

  // Short getters keep the template readable.
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

  private buildSubmitErrorMessage(error: HttpErrorResponse): string {
    if (error.status === 0) {
      return 'The frontend could not reach the backend. Make sure the Spring Boot application is running on http://localhost:8080.';
    }

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

    if (error.status === 400) {
      return 'The supplier data is invalid. Please check the form fields and try again.';
    }

    if (error.status === 409) {
      return 'A supplier with the same supplier code or email already exists.';
    }

    return `Request failed with status ${error.status}${error.statusText ? ` (${error.statusText})` : ''}.`;
  }
}
