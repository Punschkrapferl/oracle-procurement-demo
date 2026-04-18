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

  readonly purchaseOrders = signal<PurchaseOrderResponse[]>([]);
  readonly isLoading = signal(false);
  readonly errorMessage = signal('');

  ngOnInit(): void {
    this.loadPurchaseOrders();
  }

  loadPurchaseOrders(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

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
          this.errorMessage.set(this.buildErrorMessage(error));
          this.purchaseOrders.set([]);
          console.error('Failed to load purchase orders', error);
        }
      });
  }

  trackByPurchaseOrderId(index: number, purchaseOrder: PurchaseOrderResponse): number {
    return purchaseOrder.id;
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

  private buildErrorMessage(error: HttpErrorResponse): string {
    if (error.status === 0) {
      return 'The frontend could not reach the backend. Make sure the Spring Boot application is running on http://localhost:8080.';
    }

    if (typeof error.error === 'string' && error.error.trim().length > 0) {
      return error.error;
    }

    if (error.error?.message) {
      return error.error.message;
    }

    return `Request failed with status ${error.status}${error.statusText ? ` (${error.statusText})` : ''}.`;
  }
}
