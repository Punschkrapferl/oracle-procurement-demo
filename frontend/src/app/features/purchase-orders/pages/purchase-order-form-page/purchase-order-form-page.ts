import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { PurchaseOrderApiService } from '../../../../core/api/purchase-order-api.service';
import { SupplierApiService } from '../../../../core/api/supplier-api.service';
import { CreatePurchaseOrderRequest } from '../../../../core/models/create-purchase-order-request.model';
import { PurchaseOrderLineRequest } from '../../../../core/models/purchase-order-line-request.model';
import { SupplierResponse } from '../../../../core/models/supplier-response.model';

@Component({
  selector: 'app-purchase-order-form-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './purchase-order-form-page.html',
  styleUrl: './purchase-order-form-page.css'
})
export class PurchaseOrderFormPageComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly purchaseOrderApiService = inject(PurchaseOrderApiService);
  private readonly supplierApiService = inject(SupplierApiService);
  private readonly router = inject(Router);

  readonly isLoadingSuppliers = signal(false);
  readonly supplierLoadErrorMessage = signal('');
  readonly suppliers = signal<SupplierResponse[]>([]);

  readonly isSubmitting = signal(false);
  readonly submitErrorMessage = signal('');

  readonly activeSuppliers = computed(() =>
    this.suppliers()
      .filter((supplier) => supplier.active)
      .sort((left, right) => left.name.localeCompare(right.name))
  );

  readonly purchaseOrderForm = this.formBuilder.nonNullable.group({
    orderNumber: ['', [Validators.required, Validators.maxLength(50)]],
    supplierId: [0, [Validators.required, Validators.min(1)]],
    requestedBy: ['', [Validators.required, Validators.maxLength(100)]],
    orderDate: [this.getTodayDateString(), [Validators.required]],
    lines: this.formBuilder.nonNullable.array([this.createLineGroup(1)])
  });

  ngOnInit(): void {
    this.loadSuppliers();
  }

  get orderNumber() {
    return this.purchaseOrderForm.controls.orderNumber;
  }

  get supplierId() {
    return this.purchaseOrderForm.controls.supplierId;
  }

  get requestedBy() {
    return this.purchaseOrderForm.controls.requestedBy;
  }

  get orderDate() {
    return this.purchaseOrderForm.controls.orderDate;
  }

  get lines(): FormArray {
    return this.purchaseOrderForm.controls.lines;
  }

  loadSuppliers(): void {
    this.isLoadingSuppliers.set(true);
    this.supplierLoadErrorMessage.set('');

    this.supplierApiService
      .getAllSuppliers()
      .pipe(
        finalize(() => {
          this.isLoadingSuppliers.set(false);
        })
      )
      .subscribe({
        next: (suppliers) => {
          this.suppliers.set(suppliers);
        },
        error: (error: HttpErrorResponse) => {
          this.supplierLoadErrorMessage.set(this.buildSupplierLoadErrorMessage(error));
          this.suppliers.set([]);
          console.error('Failed to load suppliers for purchase order form', error);
        }
      });
  }

  addLine(): void {
    this.lines.push(this.createLineGroup(this.lines.length + 1));
  }

  removeLine(index: number): void {
    if (this.lines.length === 1) {
      return;
    }

    this.lines.removeAt(index);
    this.recalculateLineNumbers();
  }

  getLineTotal(index: number): number {
    const lineGroup = this.lines.at(index);
    const quantity = Number(lineGroup.get('quantity')?.value) || 0;
    const unitPrice = Number(lineGroup.get('unitPrice')?.value) || 0;

    return quantity * unitPrice;
  }

  getOrderTotal(): number {
    return this.lines.controls.reduce((total, _, index) => total + this.getLineTotal(index), 0);
  }

  onSubmit(): void {
    this.submitErrorMessage.set('');

    if (this.purchaseOrderForm.invalid) {
      this.purchaseOrderForm.markAllAsTouched();
      return;
    }

    const request: CreatePurchaseOrderRequest = {
      orderNumber: this.orderNumber.value.trim(),
      supplierId: this.supplierId.value,
      requestedBy: this.requestedBy.value.trim(),
      orderDate: this.orderDate.value,
      lines: this.lines.controls.map((lineGroup): PurchaseOrderLineRequest => ({
        lineNumber: Number(lineGroup.get('lineNumber')?.value),
        itemDescription: String(lineGroup.get('itemDescription')?.value ?? '').trim(),
        quantity: Number(lineGroup.get('quantity')?.value),
        unitPrice: Number(lineGroup.get('unitPrice')?.value)
      }))
    };

    this.isSubmitting.set(true);

    this.purchaseOrderApiService
      .createPurchaseOrder(request)
      .pipe(
        finalize(() => {
          this.isSubmitting.set(false);
        })
      )
      .subscribe({
        next: () => {
          void this.router.navigate(['/purchase-orders']);
        },
        error: (error: HttpErrorResponse) => {
          this.submitErrorMessage.set(this.buildSubmitErrorMessage(error));
          console.error('Failed to create purchase order', error);
        }
      });
  }

  trackByLineIndex(index: number): number {
    return index;
  }

  private createLineGroup(lineNumber: number) {
    return this.formBuilder.nonNullable.group({
      lineNumber: [lineNumber],
      itemDescription: ['', [Validators.required, Validators.maxLength(255)]],
      quantity: [1, [Validators.required, Validators.min(1)]],
      unitPrice: [0.01, [Validators.required, Validators.min(0.01)]]
    });
  }

  private recalculateLineNumbers(): void {
    this.lines.controls.forEach((lineGroup, index) => {
      lineGroup.get('lineNumber')?.setValue(index + 1);
    });
  }

  private getTodayDateString(): string {
    return new Date().toISOString().split('T')[0];
  }

  private buildSupplierLoadErrorMessage(error: HttpErrorResponse): string {
    if (error.status === 0) {
      return 'The frontend could not reach the backend to load suppliers.';
    }

    if (error.error?.message) {
      return error.error.message;
    }

    return `Failed to load suppliers (status ${error.status}).`;
  }

  private buildSubmitErrorMessage(error: HttpErrorResponse): string {
    if (error.status === 0) {
      return 'The frontend could not reach the backend. Make sure the Spring Boot application is running on http://localhost:8080.';
    }

    if (typeof error.error === 'string' && error.error.trim().length > 0) {
      return error.error;
    }

    if (error.error?.message) {
      return error.error.message;
    }

    if (error.status === 400) {
      return 'The purchase order data is invalid. Please check the form and line items.';
    }

    if (error.status === 409) {
      return 'A conflicting purchase order already exists, or the request violates a business rule.';
    }

    return `Request failed with status ${error.status}${error.statusText ? ` (${error.statusText})` : ''}.`;
  }
}
