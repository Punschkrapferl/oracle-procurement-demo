import { Location } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter, Router } from '@angular/router';

import { App } from './app';
import { routes } from './app.routes';

describe('App router integration', () => {
  let router: Router;
  let location: Location;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter(routes),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    router = TestBed.inject(Router);
    location = TestBed.inject(Location);
  });

  async function createAppAt(url: string) {
    const fixture = TestBed.createComponent(App);

    await router.navigateByUrl(url);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    return fixture;
  }

  it('should create the app shell', async () => {
    const fixture = await createAppAt('/dashboard');

    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should redirect the empty route to /dashboard', async () => {
    await createAppAt('/');

    expect(location.path()).toBe('/dashboard');
  });

  it('should redirect an unknown route to /dashboard', async () => {
    await createAppAt('/does-not-exist');

    expect(location.path()).toBe('/dashboard');
  });

  it('should render the sidebar navigation links', async () => {
    const fixture = await createAppAt('/dashboard');
    const compiled = fixture.nativeElement as HTMLElement;
    const navLinks = Array.from(compiled.querySelectorAll('.nav-link'));

    expect(navLinks.length).toBe(5);
    expect(compiled.textContent).toContain('Dashboard');
    expect(compiled.textContent).toContain('Suppliers');
    expect(compiled.textContent).toContain('New Supplier');
    expect(compiled.textContent).toContain('Purchase Orders');
    expect(compiled.textContent).toContain('New Purchase Order');
  });

  it('should navigate to /suppliers when the Suppliers sidebar link is clicked', async () => {
    const fixture = await createAppAt('/dashboard');
    const supplierLink = fixture.debugElement.queryAll(By.css('.nav-link'))[1]
      .nativeElement as HTMLAnchorElement;

    supplierLink.click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(location.path()).toBe('/suppliers');
  });

  it('should navigate to /suppliers/new when the New Supplier sidebar link is clicked', async () => {
    const fixture = await createAppAt('/dashboard');
    const newSupplierLink = fixture.debugElement.queryAll(By.css('.nav-link'))[2]
      .nativeElement as HTMLAnchorElement;

    newSupplierLink.click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(location.path()).toBe('/suppliers/new');
  });

  it('should navigate to /purchase-orders when the Purchase Orders sidebar link is clicked', async () => {
    const fixture = await createAppAt('/dashboard');
    const purchaseOrdersLink = fixture.debugElement.queryAll(By.css('.nav-link'))[3]
      .nativeElement as HTMLAnchorElement;

    purchaseOrdersLink.click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(location.path()).toBe('/purchase-orders');
  });

  it('should navigate to /purchase-orders/new when the New Purchase Order sidebar link is clicked', async () => {
    const fixture = await createAppAt('/dashboard');
    const newPurchaseOrderLink = fixture.debugElement.queryAll(By.css('.nav-link'))[4]
      .nativeElement as HTMLAnchorElement;

    newPurchaseOrderLink.click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(location.path()).toBe('/purchase-orders/new');
  });

  it('should show the dashboard page content when navigating to /dashboard', async () => {
    const fixture = await createAppAt('/dashboard');
    const compiled = fixture.nativeElement as HTMLElement;

    expect(location.path()).toBe('/dashboard');
    expect(compiled.textContent).toContain('Dashboard');
    expect(compiled.textContent).toContain('Procurement overview');
  });

  it('should show the suppliers page content when navigating to /suppliers', async () => {
    const fixture = await createAppAt('/suppliers');
    const compiled = fixture.nativeElement as HTMLElement;

    expect(location.path()).toBe('/suppliers');
    expect(compiled.textContent).toContain('Suppliers');
    expect(compiled.textContent).toContain('Supplier');
  });

  it('should show the purchase orders page content when navigating to /purchase-orders', async () => {
    const fixture = await createAppAt('/purchase-orders');
    const compiled = fixture.nativeElement as HTMLElement;

    expect(location.path()).toBe('/purchase-orders');
    expect(compiled.textContent).toContain('Purchase Orders');
  });
});
