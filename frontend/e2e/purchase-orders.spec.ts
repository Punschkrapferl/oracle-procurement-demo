import { expect, Page, test } from '@playwright/test';
import { uniqueSuffix } from './helpers/data';

async function createSupplier(
  page: Page,
  suffix: string
): Promise<{ supplierCode: string; supplierName: string; supplierEmail: string }> {
  const supplierCode = `SUP-E2E-${suffix}`;
  const supplierName = `Playwright Supplier ${suffix}`;
  const supplierEmail = `playwright-supplier-${suffix}@example.com`;

  await page.goto('/suppliers/new');
  await expect(page.getByTestId('supplier-form-page')).toBeVisible();

  await page.getByTestId('supplier-code-input').fill(supplierCode);
  await page.getByTestId('supplier-name-input').fill(supplierName);
  await page.getByTestId('supplier-email-input').fill(supplierEmail);
  await page.getByTestId('supplier-submit-button').click();

  await expect(page).toHaveURL(/\/suppliers$/);
  await expect(page.getByTestId('supplier-table')).toContainText(supplierCode);

  return { supplierCode, supplierName, supplierEmail };
}

async function createPurchaseOrder(
  page: Page,
  suffix: string,
  supplierName: string,
  supplierCode: string
): Promise<{ orderNumber: string; lineDescription: string }> {
  const orderNumber = `PO-E2E-${suffix}`;
  const requestedBy = 'Punschkrapferl';
  const lineDescription = `Playwright Laptop ${suffix}`;

  await page.goto('/purchase-orders/new');
  await expect(page.getByTestId('purchase-order-form-page')).toBeVisible();

  await page.getByTestId('purchase-order-number-input').fill(orderNumber);
  await page.getByTestId('purchase-order-requested-by-input').fill(requestedBy);
  await page.getByTestId('purchase-order-date-input').fill('2026-04-18');
  await page
    .getByTestId('purchase-order-supplier-select')
    .selectOption({ label: `${supplierName} (${supplierCode})` });

  await page.getByTestId('purchase-order-line-description-input').first().fill(lineDescription);
  await page.getByTestId('purchase-order-line-quantity-input').first().fill('2');
  await page.getByTestId('purchase-order-line-unit-price-input').first().fill('125.50');

  await expect(page.getByTestId('purchase-order-total')).toContainText('251');

  await page.getByTestId('purchase-order-submit-button').click();

  return { orderNumber, lineDescription };
}

test.describe('purchase order flows', () => {
  test('create purchase order and verify it appears in the list', async ({ page }) => {
    const suffix = uniqueSuffix();
    const { supplierCode, supplierName } = await createSupplier(page, suffix);

    const { orderNumber } = await createPurchaseOrder(page, suffix, supplierName, supplierCode);

    await expect(page).toHaveURL(/\/purchase-orders$/);
    await expect(page.getByTestId('purchase-order-list-page')).toBeVisible();

    const row = page.getByTestId('purchase-order-row').filter({ hasText: orderNumber });

    await expect(row).toBeVisible();
    await expect(row).toContainText(orderNumber);
    await expect(row).toContainText(supplierName);
    await expect(row).toContainText('DRAFT');
  });

  test('open purchase order and complete submit to approve flow', async ({ page }) => {
    const suffix = uniqueSuffix();
    const { supplierCode, supplierName } = await createSupplier(page, suffix);

    const { orderNumber, lineDescription } = await createPurchaseOrder(
      page,
      suffix,
      supplierName,
      supplierCode
    );

    await expect(page).toHaveURL(/\/purchase-orders$/);

    const row = page.getByTestId('purchase-order-row').filter({ hasText: orderNumber });
    await expect(row).toBeVisible();

    await row.getByTestId('purchase-order-view-link').click();

    await expect(page.getByTestId('purchase-order-detail-page')).toBeVisible();
    await expect(page.getByTestId('purchase-order-detail-order-number')).toHaveText(orderNumber);
    await expect(page.getByTestId('purchase-order-detail-status-badge')).toContainText('DRAFT');
    await expect(page.getByTestId('purchase-order-line-table')).toContainText(lineDescription);

    await page.getByTestId('purchase-order-submit-workflow-button').click();

    await expect(page.getByTestId('purchase-order-workflow-success')).toContainText('submitted');
    await expect(page.getByTestId('purchase-order-detail-status-badge')).toContainText('SUBMITTED');

    await page.getByTestId('purchase-order-approve-workflow-button').click();

    await expect(page.getByTestId('purchase-order-workflow-success')).toContainText('approved');
    await expect(page.getByTestId('purchase-order-detail-status-badge')).toContainText('APPROVED');
    await expect(page.getByTestId('purchase-order-cancel-form')).toBeVisible();
    await expect(page.getByTestId('purchase-order-cancel-workflow-button')).toBeVisible();
  });
});
