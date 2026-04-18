import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { finalize, forkJoin } from 'rxjs';

import { PurchaseOrderApiService } from '../../../../core/api/purchase-order-api.service';
import { PurchaseOrderResponse } from '../../../../core/models/purchase-order-response.model';
import { PurchaseOrderStatusSummaryResponse } from '../../../../core/models/purchase-order-status-summary-response.model';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-page.html',
  styleUrl: './dashboard-page.css'
})
export class DashboardPageComponent implements OnInit {
  private readonly purchaseOrderApiService = inject(PurchaseOrderApiService);

  readonly summary = signal<PurchaseOrderStatusSummaryResponse[]>([]);
  readonly purchaseOrders = signal<PurchaseOrderResponse[]>([]);
  readonly isLoading = signal(false);
  readonly errorMessage = signal('');
  readonly totalCount = signal(0);

  readonly recentPurchaseOrders = computed(() =>
    [...this.purchaseOrders()]
      .sort((a, b) => this.toTime(b.updatedAt) - this.toTime(a.updatedAt))
      .slice(0, 8)
  );

  readonly recentCancelledPurchaseOrders = computed(() =>
    this.purchaseOrders()
      .filter((purchaseOrder) => purchaseOrder.status === 'CANCELLED')
      .sort((a, b) => this.toTime(b.cancelledAt) - this.toTime(a.cancelledAt))
      .slice(0, 5)
  );

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    forkJoin({
      summary: this.purchaseOrderApiService.getPurchaseOrderStatusSummary(),
      purchaseOrders: this.purchaseOrderApiService.getAllPurchaseOrders()
    })
      .pipe(
        finalize(() => this.isLoading.set(false))
      )
      .subscribe({
        next: ({ summary, purchaseOrders }) => {
          const sortedSummary = [...summary].sort((a, b) => a.status.localeCompare(b.status));

          this.summary.set(sortedSummary);
          this.purchaseOrders.set(purchaseOrders);
          this.totalCount.set(sortedSummary.reduce((acc, item) => acc + item.count, 0));
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(this.buildErrorMessage(error));
          this.summary.set([]);
          this.purchaseOrders.set([]);
          this.totalCount.set(0);
          console.error('Failed to load dashboard', error);
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

  formatSupplier(purchaseOrder: PurchaseOrderResponse): string {
    if (purchaseOrder.supplierName && purchaseOrder.supplierCode) {
      return `${purchaseOrder.supplierName} (${purchaseOrder.supplierCode})`;
    }

    if (purchaseOrder.supplierName) {
      return purchaseOrder.supplierName;
    }

    if (purchaseOrder.supplierCode) {
      return purchaseOrder.supplierCode;
    }

    return '—';
  }

  trackByStatus(_: number, item: PurchaseOrderStatusSummaryResponse): string {
    return item.status;
  }

  trackByPurchaseOrder(_: number, item: PurchaseOrderResponse): number {
    return item.id;
  }

  private toTime(value: string | null | undefined): number {
    if (!value) {
      return 0;
    }

    const parsedValue = Date.parse(value);
    return Number.isNaN(parsedValue) ? 0 : parsedValue;
  }

  private buildErrorMessage(error: HttpErrorResponse): string {
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

    return `Request failed with status ${error.status}${error.statusText ? ` (${error.statusText})` : ''}.`;
  }
}
