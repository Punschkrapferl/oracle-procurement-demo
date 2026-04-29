import { expect, Page, test } from '@playwright/test';

function collectApiFailures(page: Page): string[] {
  const failures: string[] = [];

  page.on('response', (response) => {
    const url = response.url();

    if (url.includes('/api/') && response.status() >= 400) {
      failures.push(`${response.status()} ${url}`);
    }
  });

  page.on('requestfailed', (request) => {
    const url = request.url();

    if (url.includes('/api/')) {
      failures.push(
        `FAILED ${url}: ${request.failure()?.errorText ?? 'unknown error'}`
      );
    }
  });

  return failures;
}

async function expectDockerPageLoads(
  page: Page,
  path: string,
  expectedText: RegExp
): Promise<void> {
  const apiFailures = collectApiFailures(page);

  await page.goto(path);
  await page.waitForLoadState('networkidle');

  await expect(page.locator('body')).toContainText(expectedText);

  expect(
    apiFailures,
    `Unexpected API failures while loading ${path}:\n${apiFailures.join('\n')}`
  ).toEqual([]);
}

test.describe('Dockerized Oracle Procurement frontend smoke test', () => {
  test('serves the Angular app from the Docker container', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('body')).toContainText(
      /procurement|supplier|purchase|order|dashboard/i
    );
  });

  test('loads the dashboard page from the Dockerized frontend', async ({
                                                                         page,
                                                                       }) => {
    await expectDockerPageLoads(
      page,
      '/dashboard',
      /dashboard|procurement|purchase|supplier|order/i
    );
  });

  test('loads the suppliers page from the Dockerized frontend', async ({
                                                                         page,
                                                                       }) => {
    await expectDockerPageLoads(
      page,
      '/suppliers',
      /supplier|suppliers|vendor|company/i
    );
  });

  test('loads the purchase orders page from the Dockerized frontend', async ({
                                                                               page,
                                                                             }) => {
    await expectDockerPageLoads(
      page,
      '/purchase-orders',
      /purchase|order|orders|status|supplier/i
    );
  });
});
