import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Derive the expected posting count from the job content collection so this
// assertion stays correct as roles are added or removed.
const jobsDir = fileURLToPath(new URL('../src/content/jobs', import.meta.url));
const expectedRoleCount = readdirSync(jobsDir).filter((f) => f.endsWith('.md')).length;

test.describe('Open roles listing', () => {
    test('shows the roles grid with all postings', async ({ page }) => {
        await page.goto('/');
        await expect(page.getByRole('heading', { name: 'Open roles' })).toBeVisible();

        const grid = page.getByTestId('roles-grid');
        await expect(grid).toBeVisible();
        await expect(page.getByTestId('role-card')).toHaveCount(expectedRoleCount);
    });

    test('links through to a role detail page', async ({ page }) => {
        await page.goto('/');
        const firstCard = page.getByTestId('role-card').first();
        const title = await firstCard.getByTestId('role-title').textContent();
        await firstCard.click();
        await expect(page.getByTestId('role-detail-title')).toHaveText(title!.trim());
        await expect(page.getByTestId('apply-form')).toBeVisible();
    });

    for (const { title, location } of [
        { title: 'Senior Frontend Engineer', location: 'Remote (US & Canada)' },
        { title: 'Financial Analyst', location: 'Woodinville, WA, USA' },
    ]) {
        test(`shows ${title} location on the card and details`, async ({ page }) => {
            await page.goto('/');
            const card = page.getByTestId('role-card').filter({
                has: page.getByRole('heading', { name: title, exact: true }),
            });

            await expect(card).toBeVisible();
            await expect(card.getByText(location, { exact: true })).toBeVisible();
            await card.click();
            await expect(page.getByText(location, { exact: true })).toBeVisible();
        });
    }

    test('filters by department and persists the selection in the URL', async ({ page }) => {
        await page.goto('/');
        await page.getByLabel('Finance', { exact: true }).check();

        await expect(page.locator('[data-testid="role-card"]:visible')).toHaveCount(2);
        await expect(page).toHaveURL(/department=Finance/);
    });

    test('filters by location', async ({ page }) => {
        await page.goto('/');
        await page.getByLabel('Woodinville, WA, USA', { exact: true }).check();

        await expect(page.locator('[data-testid="role-card"]:visible')).toHaveCount(3);
        await expect(page.getByTestId('filter-count')).toHaveText('Showing 3 roles');
    });

    test('combines department and location filters with AND behavior', async ({ page }) => {
        await page.goto('/');
        await page.getByLabel('Finance', { exact: true }).check();
        await page.getByLabel('Woodinville, WA, USA', { exact: true }).check();

        await expect(page.locator('[data-testid="role-card"]:visible')).toHaveCount(1);
        await expect(
            page.getByTestId('role-card').filter({
                has: page.getByRole('heading', { name: 'Financial Analyst', exact: true }),
            }),
        ).toBeVisible();
    });

    test('resets filters and restores all roles', async ({ page }) => {
        await page.goto('/?department=Finance&location=Woodinville%2C%20WA%2C%20USA');
        await expect(page.locator('[data-testid="role-card"]:visible')).toHaveCount(1);

        await page.getByTestId('reset-filters').click();

        await expect(page.locator('[data-testid="role-card"]:visible')).toHaveCount(expectedRoleCount);
        await expect(page).toHaveURL(/\/$/);
    });

    test('shows a clear empty state for incompatible filters', async ({ page }) => {
        await page.goto('/');
        await page.getByLabel('Technology', { exact: true }).check();
        await page.getByLabel('Woodinville, WA, USA', { exact: true }).check();

        await expect(page.locator('[data-testid="role-card"]:visible')).toHaveCount(0);
        await expect(page.getByTestId('filtered-empty-state')).toBeVisible();
        await expect(page.getByTestId('empty-state-text')).toHaveText(
            'No roles match the selected filters.',
        );
    });

    test('has no automatically detectable accessibility violations', async ({ page }) => {
        await page.goto('/');
        const results = await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa'])
            .analyze();
        expect(results.violations).toEqual([]);
    });
});
