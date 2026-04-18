import { expect, test } from '@playwright/test';
import { uniqueSuffix } from './helpers/data';

test.describe('supplier flows', () => {
  test('create supplier and verify it appears in the list', async ({ page }) => {
    const suffix = uniqueSuffix();
    const supplierCode = `SUP-E2E-${suffix}`;
    const supplierName = `Playwright Supplier ${suffix}`;
    const supplierEmail = `playwright-supplier-${suffix}@example.com`;

    await page.goto('/suppliers/new');

    await expect(page.getByTestId('supplier-form-page')).toBeVisible();

    await page.getByTestId('supplier-code-input').fill(supplierCode);
    await page.getByTestId('supplier-name-input').fill(supplierName);
    await page.getByTestId('supplier-email-input').fill(supplierEmail);

    const activeCheckbox = page.getByTestId('supplier-active-checkbox');
    await expect(activeCheckbox).toBeChecked();

    await page.getByTestId('supplier-submit-button').click();

    await expect(page).toHaveURL(/\/suppliers$/);
    await expect(page.getByTestId('supplier-list-page')).toBeVisible();
    await expect(page.getByTestId('supplier-table')).toContainText(supplierCode);
    await expect(page.getByTestId('supplier-table')).toContainText(supplierName);
    await expect(page.getByTestId('supplier-table')).toContainText(supplierEmail);
  });
});
