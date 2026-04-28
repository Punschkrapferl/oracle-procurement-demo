import { Routes } from '@angular/router';
import { DashboardPageComponent } from './features/dashboard/pages/dashboard-page/dashboard-page';
import { PurchaseOrderDetailPageComponent } from './features/purchase-orders/pages/purchase-order-detail-page/purchase-order-detail-page';
import { PurchaseOrderFormPageComponent } from './features/purchase-orders/pages/purchase-order-form-page/purchase-order-form-page';
import { PurchaseOrderListPageComponent } from './features/purchase-orders/pages/purchase-order-list-page/purchase-order-list-page';
import { SupplierFormPageComponent } from './features/suppliers/pages/supplier-form-page/supplier-form-page';
import { SupplierListPageComponent } from './features/suppliers/pages/supplier-list-page/supplier-list-page';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'dashboard'
  },
  {
    path: 'dashboard',
    component: DashboardPageComponent
  },
  {
    path: 'suppliers',
    component: SupplierListPageComponent
  },
  {
    path: 'suppliers/new',
    component: SupplierFormPageComponent
  },
  {
    path: 'suppliers/:id/edit',
    component: SupplierFormPageComponent
  },
  {
    path: 'purchase-orders',
    component: PurchaseOrderListPageComponent
  },
  {
    path: 'purchase-orders/new',
    component: PurchaseOrderFormPageComponent
  },
  {
    path: 'purchase-orders/:id/edit',
    component: PurchaseOrderFormPageComponent
  },
  {
    path: 'purchase-orders/:id',
    component: PurchaseOrderDetailPageComponent
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
