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

  getAllSuppliers(): Observable<SupplierResponse[]> {
    return this.http.get<SupplierResponse[]>(this.baseUrl);
  }

  getSupplierById(id: number): Observable<SupplierResponse> {
    return this.http.get<SupplierResponse>(`${this.baseUrl}/${id}`);
  }

  createSupplier(request: CreateSupplierRequest): Observable<SupplierResponse> {
    return this.http.post<SupplierResponse>(this.baseUrl, request);
  }

  updateSupplier(id: number, request: CreateSupplierRequest): Observable<SupplierResponse> {
    return this.http.put<SupplierResponse>(`${this.baseUrl}/${id}`, request);
  }

  deleteSupplier(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
