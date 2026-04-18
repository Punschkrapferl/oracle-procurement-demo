export interface PurchaseOrderLineRequest {
  lineNumber: number;
  itemDescription: string;
  quantity: number;
  unitPrice: number;
}
