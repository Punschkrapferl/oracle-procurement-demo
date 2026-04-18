import { PurchaseOrderLineRequest } from './purchase-order-line-request.model';

export interface UpdatePurchaseOrderRequest {
  orderNumber: string;
  supplierId: number;
  requestedBy: string;
  orderDate: string;
  lines: PurchaseOrderLineRequest[];
}
