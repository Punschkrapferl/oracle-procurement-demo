import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_CONFIG } from '../config/api.config';
import { CancelPurchaseOrderRequest } from '../models/cancel-purchase-order-request.model';
import { CreatePurchaseOrderRequest } from '../models/create-purchase-order-request.model';
import { PurchaseOrderResponse } from '../models/purchase-order-response.model';
import { PurchaseOrderStatusSummaryResponse } from '../models/purchase-order-status-summary-response.model';
import { UpdatePurchaseOrderRequest } from '../models/update-purchase-order-request.model';

@Injectable({
  providedIn: 'root'
})
export class PurchaseOrderApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_CONFIG.baseUrl}/purchase-orders`;

  getAllPurchaseOrders(): Observable<PurchaseOrderResponse[]> {
    return this.http.get<PurchaseOrderResponse[]>(this.baseUrl);
  }

  getPurchaseOrderById(id: number): Observable<PurchaseOrderResponse> {
    return this.http.get<PurchaseOrderResponse>(`${this.baseUrl}/${id}`);
  }

  createPurchaseOrder(request: CreatePurchaseOrderRequest): Observable<PurchaseOrderResponse> {
    return this.http.post<PurchaseOrderResponse>(this.baseUrl, request);
  }

  updatePurchaseOrder(id: number, request: UpdatePurchaseOrderRequest): Observable<PurchaseOrderResponse> {
    return this.http.put<PurchaseOrderResponse>(`${this.baseUrl}/${id}`, request);
  }

  deletePurchaseOrder(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  submitPurchaseOrder(id: number): Observable<PurchaseOrderResponse> {
    return this.http.post<PurchaseOrderResponse>(`${this.baseUrl}/${id}/submit`, {});
  }

  approvePurchaseOrder(id: number): Observable<PurchaseOrderResponse> {
    return this.http.post<PurchaseOrderResponse>(`${this.baseUrl}/${id}/approve`, {});
  }

  cancelPurchaseOrder(
    id: number,
    request: CancelPurchaseOrderRequest
  ): Observable<PurchaseOrderResponse> {
    return this.http.post<PurchaseOrderResponse>(`${this.baseUrl}/${id}/cancel`, request);
  }

  getPurchaseOrderStatusSummary(): Observable<PurchaseOrderStatusSummaryResponse[]> {
    return this.http.get<PurchaseOrderStatusSummaryResponse[]>(`${this.baseUrl}/summary/status`);
  }
}
