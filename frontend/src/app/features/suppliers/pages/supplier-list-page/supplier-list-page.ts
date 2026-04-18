import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { SupplierApiService } from '../../../../core/api/supplier-api.service';
import { SupplierResponse } from '../../../../core/models/supplier-response.model';

@Component({
  selector: 'app-supplier-list-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './supplier-list-page.html',
  styleUrl: './supplier-list-page.css'
})
export class SupplierListPageComponent implements OnInit {
  private readonly supplierApiService = inject(SupplierApiService);

  readonly suppliers = signal<SupplierResponse[]>([]);
  readonly isLoading = signal(false);
  readonly errorMessage = signal('');

  ngOnInit(): void {
    this.loadSuppliers();
  }

  loadSuppliers(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.supplierApiService
      .getAllSuppliers()
      .pipe(
        finalize(() => {
          this.isLoading.set(false);
        })
      )
      .subscribe({
        next: (suppliers) => {
          this.suppliers.set(suppliers);
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(this.buildErrorMessage(error));
          this.suppliers.set([]);
          console.error('Failed to load suppliers', error);
        }
      });
  }

  trackBySupplierId(index: number, supplier: SupplierResponse): number {
    return supplier.id;
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
