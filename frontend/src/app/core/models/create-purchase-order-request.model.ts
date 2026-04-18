import { PurchaseOrderLineRequest } from './purchase-order-line-request.model';

export interface CreatePurchaseOrderRequest {
  orderNumber: string;
  supplierId: number;
  requestedBy: string;
  orderDate: string;
  lines: PurchaseOrderLineRequest[];
}
