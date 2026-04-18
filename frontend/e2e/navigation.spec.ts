import { expect, test } from '@playwright/test';

test.describe('sidebar navigation', () => {
  test('navigates through the main sidebar links', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByTestId('nav-dashboard-link')).toBeVisible();

    await page.getByTestId('nav-suppliers-link').click();
    await expect(page).toHaveURL(/\/suppliers$/);
    await expect(page.getByTestId('supplier-list-page')).toBeVisible();

    await page.getByTestId('nav-new-supplier-link').click();
    await expect(page).toHaveURL(/\/suppliers\/new$/);
    await expect(page.getByTestId('supplier-form-page')).toBeVisible();

    await page.getByTestId('nav-purchase-orders-link').click();
    await expect(page).toHaveURL(/\/purchase-orders$/);
    await expect(page.getByTestId('purchase-order-list-page')).toBeVisible();

    await page.getByTestId('nav-new-purchase-order-link').click();
    await expect(page).toHaveURL(/\/purchase-orders\/new$/);
    await expect(page.getByTestId('purchase-order-form-page')).toBeVisible();
  });
});
