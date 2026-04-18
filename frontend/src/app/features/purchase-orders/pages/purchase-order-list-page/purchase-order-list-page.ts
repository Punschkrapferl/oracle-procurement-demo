import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { PurchaseOrderApiService } from '../../../../core/api/purchase-order-api.service';
import { PurchaseOrderResponse } from '../../../../core/models/purchase-order-response.model';

@Component({
  selector: 'app-purchase-order-list-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './purchase-order-list-page.html',
  styleUrl: './purchase-order-list-page.css'
})
export class PurchaseOrderListPageComponent implements OnInit {
  private readonly purchaseOrderApiService = inject(PurchaseOrderApiService);

  private readonly currencyFormatter = new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  private readonly dateFormatter = new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  readonly purchaseOrders = signal<PurchaseOrderResponse[]>([]);
  readonly isLoading = signal(false);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');
  readonly deleteErrorMessage = signal('');
  readonly deletingPurchaseOrderId = signal<number | null>(null);

  ngOnInit(): void {
    // Read one-time success feedback passed through browser history state.
    // This avoids relying on deprecated router navigation APIs.
    const historyState = window.history.state as { successMessage?: string } | undefined;
    this.successMessage.set(historyState?.successMessage ?? '');

    this.loadPurchaseOrders();
  }

  // Loads all purchase orders and keeps the newest IDs first in the table.
  loadPurchaseOrders(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.deleteErrorMessage.set('');

    this.purchaseOrderApiService
      .getAllPurchaseOrders()
      .pipe(
        finalize(() => {
          this.isLoading.set(false);
        })
      )
      .subscribe({
        next: (purchaseOrders) => {
          const sortedPurchaseOrders = [...purchaseOrders].sort((left, right) => right.id - left.id);
          this.purchaseOrders.set(sortedPurchaseOrders);
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(this.buildLoadErrorMessage(error));
          this.purchaseOrders.set([]);
          console.error('Failed to load purchase orders', error);
        }
      });
  }

  // Keeps DOM rows stable when Angular re-renders the list.
  trackByPurchaseOrderId(_: number, purchaseOrder: PurchaseOrderResponse): number {
    return purchaseOrder.id;
  }

  canEdit(purchaseOrder: PurchaseOrderResponse): boolean {
    return purchaseOrder.status === 'DRAFT';
  }

  canDelete(purchaseOrder: PurchaseOrderResponse): boolean {
    return purchaseOrder.status === 'DRAFT';
  }

  isDeleting(purchaseOrderId: number): boolean {
    return this.deletingPurchaseOrderId() === purchaseOrderId;
  }

  deletePurchaseOrder(purchaseOrder: PurchaseOrderResponse): void {
    if (!this.canDelete(purchaseOrder)) {
      return;
    }

    const confirmed = window.confirm(
      `Delete draft purchase order ${purchaseOrder.orderNumber}? This action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    this.deletingPurchaseOrderId.set(purchaseOrder.id);
    this.deleteErrorMessage.set('');
    this.successMessage.set('');

    this.purchaseOrderApiService
      .deletePurchaseOrder(purchaseOrder.id)
      .pipe(
        finalize(() => {
          this.deletingPurchaseOrderId.set(null);
        })
      )
      .subscribe({
        next: () => {
          this.purchaseOrders.update((currentPurchaseOrders) =>
            currentPurchaseOrders.filter((currentPurchaseOrder) => currentPurchaseOrder.id !== purchaseOrder.id)
          );

          this.successMessage.set(`Purchase order ${purchaseOrder.orderNumber} was deleted successfully.`);
        },
        error: (error: HttpErrorResponse) => {
          this.deleteErrorMessage.set(this.buildDeleteErrorMessage(error));
          console.error('Failed to delete purchase order', error);
        }
      });
  }

  dismissSuccessMessage(): void {
    this.successMessage.set('');
  }

  dismissDeleteErrorMessage(): void {
    this.deleteErrorMessage.set('');
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
    return this.currencyFormatter.format(amount);
  }

  formatDate(dateValue: string): string {
    const parsedDate = new Date(`${dateValue}T00:00:00`);

    if (Number.isNaN(parsedDate.getTime())) {
      return dateValue;
    }

    return this.dateFormatter.format(parsedDate);
  }

  getSupplierDisplayName(purchaseOrder: PurchaseOrderResponse): string {
    return `${purchaseOrder.supplierName} (${purchaseOrder.supplierCode})`;
  }

  private buildLoadErrorMessage(error: HttpErrorResponse): string {
    return this.buildErrorMessage(
      error,
      'The frontend could not reach the backend. Make sure the Spring Boot application is running on http://localhost:8080.',
      'Request failed'
    );
  }

  private buildDeleteErrorMessage(error: HttpErrorResponse): string {
    return this.buildErrorMessage(
      error,
      'The frontend could not reach the backend while deleting the purchase order.',
      'Delete action failed'
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
