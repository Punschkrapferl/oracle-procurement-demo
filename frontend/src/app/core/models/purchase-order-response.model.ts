import { PurchaseOrderLineResponse } from './purchase-order-line-response.model';

export interface PurchaseOrderResponse {
  id: number;
  orderNumber: string;
  supplierId: number;
  supplierCode: string;
  supplierName: string;
  status: string;
  requestedBy: string;
  orderDate: string;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
  cancellationReason: string | null;
  cancelledAt: string | null;
  lines: PurchaseOrderLineResponse[];
}
