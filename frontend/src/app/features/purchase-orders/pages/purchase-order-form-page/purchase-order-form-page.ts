import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { PurchaseOrderApiService } from '../../../../core/api/purchase-order-api.service';
import { SupplierApiService } from '../../../../core/api/supplier-api.service';
import { CreatePurchaseOrderRequest } from '../../../../core/models/create-purchase-order-request.model';
import { PurchaseOrderLineRequest } from '../../../../core/models/purchase-order-line-request.model';
import { PurchaseOrderResponse } from '../../../../core/models/purchase-order-response.model';
import { SupplierResponse } from '../../../../core/models/supplier-response.model';
import { UpdatePurchaseOrderRequest } from '../../../../core/models/update-purchase-order-request.model';

type PurchaseOrderLineFormGroup = FormGroup;

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
  private readonly route = inject(ActivatedRoute);

  readonly isLoadingSuppliers = signal(false);
  readonly supplierLoadErrorMessage = signal('');
  readonly suppliers = signal<SupplierResponse[]>([]);

  readonly isLoadingPurchaseOrder = signal(false);
  readonly purchaseOrderLoadErrorMessage = signal('');
  readonly loadedPurchaseOrder = signal<PurchaseOrderResponse | null>(null);

  readonly isSubmitting = signal(false);
  readonly submitErrorMessage = signal('');

  readonly purchaseOrderId = signal<number | null>(null);

  readonly isEditMode = computed(() => this.purchaseOrderId() !== null);
  readonly isEditBlocked = computed(() => this.isEditMode() && this.loadedPurchaseOrder()?.status !== 'DRAFT');

  readonly pageTitle = computed(() => {
    const purchaseOrder = this.loadedPurchaseOrder();

    if (this.isEditMode() && purchaseOrder) {
      return `Edit Draft Purchase Order ${purchaseOrder.orderNumber}`;
    }

    return this.isEditMode() ? 'Edit Purchase Order' : 'New Purchase Order';
  });

  readonly pageDescription = computed(() => {
    const purchaseOrder = this.loadedPurchaseOrder();

    if (this.isEditMode() && purchaseOrder) {
      return `Update draft ${purchaseOrder.orderNumber} and save the revised header fields and line items.`;
    }

    return this.isEditMode()
      ? 'Update an existing draft purchase order and save the revised line items.'
      : 'Create a draft purchase order and send it to the backend with real supplier data and line items.';
  });

  readonly formCardTitle = computed(() => {
    const purchaseOrder = this.loadedPurchaseOrder();

    if (this.isEditMode() && purchaseOrder) {
      return `Editing ${purchaseOrder.orderNumber}`;
    }

    return this.isEditMode() ? 'Edit Draft Purchase Order' : 'Purchase Order Details';
  });

  readonly formCardDescription = computed(() =>
    this.isEditMode()
      ? 'Only draft purchase orders can be edited. Update the header fields and line items below.'
      : 'Fill in the header fields, select a supplier, and add at least one line item.'
  );

  readonly submitButtonLabel = computed(() => {
    if (this.isSubmitting()) {
      return this.isEditMode() ? 'Updating Purchase Order...' : 'Creating Purchase Order...';
    }

    return this.isEditMode() ? 'Update Purchase Order' : 'Create Purchase Order';
  });

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
    lines: this.formBuilder.array([this.createLineGroup(1)])
  });

  ngOnInit(): void {
    this.initializeRouteState();
    this.loadSuppliers();

    if (this.isEditMode()) {
      this.loadPurchaseOrderForEdit();
    }
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
    return this.purchaseOrderForm.controls.lines as FormArray;
  }

  get lineFormGroups(): PurchaseOrderLineFormGroup[] {
    return this.lines.controls as PurchaseOrderLineFormGroup[];
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

  loadPurchaseOrderForEdit(): void {
    const id = this.purchaseOrderId();

    if (!id) {
      return;
    }

    this.isLoadingPurchaseOrder.set(true);
    this.purchaseOrderLoadErrorMessage.set('');
    this.submitErrorMessage.set('');

    this.purchaseOrderApiService
      .getPurchaseOrderById(id)
      .pipe(
        finalize(() => {
          this.isLoadingPurchaseOrder.set(false);
        })
      )
      .subscribe({
        next: (purchaseOrder) => {
          this.loadedPurchaseOrder.set(purchaseOrder);
          this.populateFormFromPurchaseOrder(purchaseOrder);

          if (purchaseOrder.status !== 'DRAFT') {
            this.purchaseOrderForm.disable({ emitEvent: false });
          } else {
            this.purchaseOrderForm.enable({ emitEvent: false });
          }
        },
        error: (error: HttpErrorResponse) => {
          this.loadedPurchaseOrder.set(null);
          this.purchaseOrderLoadErrorMessage.set(this.buildPurchaseOrderLoadErrorMessage(error));
          console.error('Failed to load purchase order for edit', error);
        }
      });
  }

  addLine(): void {
    if (this.isEditBlocked()) {
      return;
    }

    this.lines.push(this.createLineGroup(this.lines.length + 1));
  }

  removeLine(index: number): void {
    if (this.isEditBlocked() || this.lines.length === 1) {
      return;
    }

    this.lines.removeAt(index);
    this.recalculateLineNumbers();
  }

  getLineTotal(index: number): number {
    const lineGroup = this.lineFormGroups[index];
    const quantity = Number(lineGroup.controls['quantity'].value) || 0;
    const unitPrice = Number(lineGroup.controls['unitPrice'].value) || 0;

    return quantity * unitPrice;
  }

  getOrderTotal(): number {
    return this.lineFormGroups.reduce((total, _, index) => total + this.getLineTotal(index), 0);
  }

  onSubmit(): void {
    this.submitErrorMessage.set('');

    if (this.isEditBlocked()) {
      this.submitErrorMessage.set('Only purchase orders in DRAFT status can be edited.');
      return;
    }

    if (this.purchaseOrderForm.invalid) {
      this.purchaseOrderForm.markAllAsTouched();
      return;
    }

    const requestLines = this.lineFormGroups.map((lineGroup): PurchaseOrderLineRequest => ({
      lineNumber: Number(lineGroup.controls['lineNumber'].value),
      itemDescription: String(lineGroup.controls['itemDescription'].value ?? '').trim(),
      quantity: Number(lineGroup.controls['quantity'].value),
      unitPrice: Number(lineGroup.controls['unitPrice'].value)
    }));

    const request: CreatePurchaseOrderRequest | UpdatePurchaseOrderRequest = {
      orderNumber: this.orderNumber.value.trim(),
      supplierId: this.supplierId.value,
      requestedBy: this.requestedBy.value.trim(),
      orderDate: this.orderDate.value,
      lines: requestLines
    };

    this.isSubmitting.set(true);

    const request$ = this.isEditMode() && this.purchaseOrderId()
      ? this.purchaseOrderApiService.updatePurchaseOrder(this.purchaseOrderId()!, request)
      : this.purchaseOrderApiService.createPurchaseOrder(request);

    request$
      .pipe(
        finalize(() => {
          this.isSubmitting.set(false);
        })
      )
      .subscribe({
        next: (purchaseOrder) => {
          if (this.isEditMode()) {
            this.loadedPurchaseOrder.set(purchaseOrder);
            void this.router.navigate(['/purchase-orders', purchaseOrder.id]);
            return;
          }

          void this.router.navigate(['/purchase-orders']);
        },
        error: (error: HttpErrorResponse) => {
          this.submitErrorMessage.set(this.buildSubmitErrorMessage(error));
          console.error('Failed to save purchase order', error);
        }
      });
  }

  trackByLineControl(_index: number, control: AbstractControl): AbstractControl {
    return control;
  }

  private initializeRouteState(): void {
    const idParam = this.route.snapshot.paramMap.get('id');

    if (!idParam) {
      this.purchaseOrderId.set(null);
      return;
    }

    const parsedId = Number(idParam);

    if (!parsedId || Number.isNaN(parsedId)) {
      this.purchaseOrderId.set(null);
      this.purchaseOrderLoadErrorMessage.set('The purchase order id in the route is invalid.');
      return;
    }

    this.purchaseOrderId.set(parsedId);
  }

  private populateFormFromPurchaseOrder(purchaseOrder: PurchaseOrderResponse): void {
    this.purchaseOrderForm.patchValue({
      orderNumber: purchaseOrder.orderNumber,
      supplierId: purchaseOrder.supplierId,
      requestedBy: purchaseOrder.requestedBy,
      orderDate: purchaseOrder.orderDate
    });

    this.replaceLines(
      purchaseOrder.lines.map((line) => ({
        lineNumber: line.lineNumber,
        itemDescription: line.itemDescription,
        quantity: line.quantity,
        unitPrice: Number(line.unitPrice)
      }))
    );
  }

  private replaceLines(lines: PurchaseOrderLineRequest[]): void {
    const newLineGroups = lines.length > 0
      ? lines.map((line, index) => this.createLineGroup(index + 1, line))
      : [this.createLineGroup(1)];

    const newFormArray = this.formBuilder.array(newLineGroups);

    this.purchaseOrderForm.setControl('lines', newFormArray);
    this.recalculateLineNumbers();
  }

  private createLineGroup(lineNumber: number, line?: PurchaseOrderLineRequest): PurchaseOrderLineFormGroup {
    return this.formBuilder.nonNullable.group({
      lineNumber: [line?.lineNumber ?? lineNumber],
      itemDescription: [line?.itemDescription ?? '', [Validators.required, Validators.maxLength(255)]],
      quantity: [line?.quantity ?? 1, [Validators.required, Validators.min(1)]],
      unitPrice: [line?.unitPrice ?? 0.01, [Validators.required, Validators.min(0.01)]]
    });
  }

  private recalculateLineNumbers(): void {
    this.lineFormGroups.forEach((lineGroup, index) => {
      lineGroup.controls['lineNumber'].setValue(index + 1);
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

  private buildPurchaseOrderLoadErrorMessage(error: HttpErrorResponse): string {
    if (error.status === 0) {
      return 'The frontend could not reach the backend while loading the purchase order.';
    }

    if (error.status === 404) {
      return 'The requested purchase order could not be found.';
    }

    if (typeof error.error === 'string' && error.error.trim().length > 0) {
      return error.error;
    }

    if (error.error?.message) {
      return error.error.message;
    }

    return `Failed to load purchase order (status ${error.status}).`;
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
      return this.isEditMode()
        ? 'The updated purchase order data is invalid. Please check the form and line items.'
        : 'The purchase order data is invalid. Please check the form and line items.';
    }

    if (error.status === 409) {
      return this.isEditMode()
        ? 'Only DRAFT purchase orders can be edited, or the request violates a business rule.'
        : 'A conflicting purchase order already exists, or the request violates a business rule.';
    }

    return `Request failed with status ${error.status}${error.statusText ? ` (${error.statusText})` : ''}.`;
  }
}
