import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_CONFIG } from '../config/api.config';
import { CreateSupplierRequest } from '../models/create-supplier-request.model';
import { SupplierResponse } from '../models/supplier-response.model';

@Injectable({
  providedIn: 'root'
})
export class SupplierApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_CONFIG.baseUrl}/suppliers`;

  // Load all suppliers for the supplier list page and purchase-order usage.
  getAllSuppliers(): Observable<SupplierResponse[]> {
    return this.http.get<SupplierResponse[]>(this.baseUrl);
  }

  // Create a new supplier from the supplier form page.
  createSupplier(request: CreateSupplierRequest): Observable<SupplierResponse> {
    return this.http.post<SupplierResponse>(this.baseUrl, request);
  }
}
