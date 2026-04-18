import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { PurchaseOrderApiService } from '../../../../core/api/purchase-order-api.service';
import { PurchaseOrderResponse } from '../../../../core/models/purchase-order-response.model';

@Component({
  selector: 'app-purchase-order-detail-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './purchase-order-detail-page.html',
  styleUrl: './purchase-order-detail-page.css'
})
export class PurchaseOrderDetailPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly purchaseOrderApiService = inject(PurchaseOrderApiService);
  private readonly formBuilder = inject(FormBuilder);

  readonly purchaseOrder = signal<PurchaseOrderResponse | null>(null);
  readonly isLoading = signal(false);
  readonly errorMessage = signal('');
  readonly isWorkflowSubmitting = signal(false);
  readonly workflowErrorMessage = signal('');
  readonly workflowSuccessMessage = signal('');
  readonly isDeleting = signal(false);
  readonly deleteErrorMessage = signal('');

  readonly cancelForm = this.formBuilder.nonNullable.group({
    reason: ['', [Validators.required, Validators.maxLength(500)]]
  });

  readonly canEdit = computed(() => this.purchaseOrder()?.status === 'DRAFT');
  readonly canSubmit = computed(() => this.purchaseOrder()?.status === 'DRAFT');
  readonly canApprove = computed(() => this.purchaseOrder()?.status === 'SUBMITTED');
  readonly canCancel = computed(() => this.purchaseOrder()?.status === 'APPROVED');
  readonly canDelete = computed(() => this.purchaseOrder()?.status === 'DRAFT');

  ngOnInit(): void {
    this.loadPurchaseOrder();
  }

  get cancelReason() {
    return this.cancelForm.controls.reason;
  }

  loadPurchaseOrder(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    const purchaseOrderId = Number(idParam);

    if (!purchaseOrderId || Number.isNaN(purchaseOrderId)) {
      this.errorMessage.set('The purchase order id in the route is invalid.');
      this.purchaseOrder.set(null);
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');
    this.workflowErrorMessage.set('');
    this.workflowSuccessMessage.set('');
    this.deleteErrorMessage.set('');

    this.purchaseOrderApiService
      .getPurchaseOrderById(purchaseOrderId)
      .pipe(
        finalize(() => {
          this.isLoading.set(false);
        })
      )
      .subscribe({
        next: (purchaseOrder) => {
          this.purchaseOrder.set(purchaseOrder);
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(this.buildLoadErrorMessage(error));
          this.purchaseOrder.set(null);
          console.error('Failed to load purchase order detail', error);
        }
      });
  }

  submitPurchaseOrder(): void {
    const currentPurchaseOrder = this.purchaseOrder();

    if (!currentPurchaseOrder) {
      return;
    }

    this.runWorkflowAction(
      () => this.purchaseOrderApiService.submitPurchaseOrder(currentPurchaseOrder.id),
      'Purchase order submitted successfully.'
    );
  }

  approvePurchaseOrder(): void {
    const currentPurchaseOrder = this.purchaseOrder();

    if (!currentPurchaseOrder) {
      return;
    }

    this.runWorkflowAction(
      () => this.purchaseOrderApiService.approvePurchaseOrder(currentPurchaseOrder.id),
      'Purchase order approved successfully.'
    );
  }

  cancelPurchaseOrder(): void {
    const currentPurchaseOrder = this.purchaseOrder();

    if (!currentPurchaseOrder) {
      return;
    }

    if (this.cancelForm.invalid) {
      this.cancelForm.markAllAsTouched();
      return;
    }

    this.runWorkflowAction(
      () =>
        this.purchaseOrderApiService.cancelPurchaseOrder(currentPurchaseOrder.id, {
          reason: this.cancelReason.value.trim()
        }),
      'Purchase order cancelled successfully.',
      true
    );
  }

  deletePurchaseOrder(): void {
    const currentPurchaseOrder = this.purchaseOrder();

    if (!currentPurchaseOrder || currentPurchaseOrder.status !== 'DRAFT') {
      return;
    }

    const confirmed = window.confirm(
      `Delete draft purchase order ${currentPurchaseOrder.orderNumber}? This action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    this.isDeleting.set(true);
    this.deleteErrorMessage.set('');
    this.workflowErrorMessage.set('');
    this.workflowSuccessMessage.set('');

    this.purchaseOrderApiService
      .deletePurchaseOrder(currentPurchaseOrder.id)
      .pipe(
        finalize(() => {
          this.isDeleting.set(false);
        })
      )
      .subscribe({
        next: () => {
          void this.router.navigate(['/purchase-orders'], {
            state: {
              successMessage: `Purchase order ${currentPurchaseOrder.orderNumber} was deleted successfully.`
            }
          });
        },
        error: (error: HttpErrorResponse) => {
          this.deleteErrorMessage.set(this.buildDeleteErrorMessage(error));
          console.error('Failed to delete purchase order', error);
        }
      });
  }

  getStatusLabel(status: string): string {
    return status.replace(/_/g, ' ');
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'DRAFT':
        return 'status-draft';
      case 'SUBMITTED':
        return 'status-submitted';
      case 'APPROVED':
        return 'status-approved';
      case 'CANCELLED':
        return 'status-cancelled';
      default:
        return 'status-default';
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-GB', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }

  private runWorkflowAction(
    action: () => ReturnType<PurchaseOrderApiService['submitPurchaseOrder']>,
    successMessage: string,
    resetCancelForm = false
  ): void {
    this.isWorkflowSubmitting.set(true);
    this.workflowErrorMessage.set('');
    this.workflowSuccessMessage.set('');
    this.deleteErrorMessage.set('');

    action()
      .pipe(
        finalize(() => {
          this.isWorkflowSubmitting.set(false);
        })
      )
      .subscribe({
        next: (updatedPurchaseOrder) => {
          this.purchaseOrder.set(updatedPurchaseOrder);
          this.workflowSuccessMessage.set(successMessage);

          if (resetCancelForm) {
            this.cancelForm.reset({ reason: '' });
          }
        },
        error: (error: HttpErrorResponse) => {
          this.workflowErrorMessage.set(this.buildWorkflowErrorMessage(error));
          console.error('Workflow action failed', error);
        }
      });
  }

  private buildLoadErrorMessage(error: HttpErrorResponse): string {
    if (error.status === 0) {
      return 'The frontend could not reach the backend. Make sure the Spring Boot application is running on http://localhost:8080.';
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

    return `Request failed with status ${error.status}${error.statusText ? ` (${error.statusText})` : ''}.`;
  }

  private buildWorkflowErrorMessage(error: HttpErrorResponse): string {
    if (error.status === 0) {
      return 'The frontend could not reach the backend while performing the workflow action.';
    }

    if (typeof error.error === 'string' && error.error.trim().length > 0) {
      return error.error;
    }

    if (error.error?.message) {
      return error.error.message;
    }

    return `Workflow action failed with status ${error.status}${error.statusText ? ` (${error.statusText})` : ''}.`;
  }

  private buildDeleteErrorMessage(error: HttpErrorResponse): string {
    if (error.status === 0) {
      return 'The frontend could not reach the backend while deleting the purchase order.';
    }

    if (typeof error.error === 'string' && error.error.trim().length > 0) {
      return error.error;
    }

    if (error.error?.message) {
      return error.error.message;
    }

    return `Delete action failed with status ${error.status}${error.statusText ? ` (${error.statusText})` : ''}.`;
  }
}
