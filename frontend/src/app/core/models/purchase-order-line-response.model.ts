export interface PurchaseOrderLineResponse {
  id: number;
  lineNumber: number;
  itemDescription: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}
