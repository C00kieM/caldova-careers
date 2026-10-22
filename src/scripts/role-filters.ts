import { filterJobs } from '../lib/jobs';
import type { Job } from '../types/job';

const form = document.querySelector<HTMLFormElement>('[data-testid="role-filters"]');
const cards = [...document.querySelectorAll<HTMLElement>('[data-testid="role-card"]')];
const emptyState = document.querySelector<HTMLElement>('[data-testid="filtered-empty-state"]');
const count = document.querySelector<HTMLElement>('[data-testid="filter-count"]');
const resetButtons = document.querySelectorAll<HTMLButtonElement>(
    '[data-testid="reset-filters"], [data-testid="empty-reset-filters"]',
);

if (form && emptyState && count) {
    const filterForm = form;
    const filterEmptyState = emptyState;
    const filterCount = count;
    const jobs = JSON.parse(filterForm.dataset.jobs ?? '[]') as Job[];
    const checkboxes = [
        ...filterForm.querySelectorAll<HTMLInputElement>('input[type="checkbox"]'),
    ];

    function selectedValues(name: string): string[] {
        return checkboxes
            .filter((checkbox) => checkbox.name === name && checkbox.checked)
            .map((checkbox) => checkbox.value);
    }

    function updateUrl(departments: string[], locations: string[]): void {
        const url = new URL(window.location.href);
        url.searchParams.delete('department');
        url.searchParams.delete('location');
        departments.forEach((department) => url.searchParams.append('department', department));
        locations.forEach((location) => url.searchParams.append('location', location));
        window.history.replaceState({}, '', url);
    }

    function applyFilters(updateHistory = true): void {
        const departments = selectedValues('department');
        const locations = selectedValues('location');
        const matchingJobs = filterJobs(jobs, departments, locations);
        const matchingIds = new Set(matchingJobs.map((job) => job.slug));

        cards.forEach((card) => {
            const jobId = card.dataset.jobId;
            card.hidden = jobId === undefined || !matchingIds.has(jobId);
        });
        filterEmptyState.hidden = matchingJobs.length > 0;
        filterCount.textContent = `Showing ${matchingJobs.length} ${
            matchingJobs.length === 1 ? 'role' : 'roles'
        }`;

        if (updateHistory) {
            updateUrl(departments, locations);
        }
    }

    const initialUrl = new URL(window.location.href);
    for (const checkbox of checkboxes) {
        checkbox.checked = initialUrl.searchParams.getAll(checkbox.name).includes(checkbox.value);
        checkbox.addEventListener('change', () => applyFilters());
    }

    resetButtons.forEach((button) => {
        button.addEventListener('click', () => {
            checkboxes.forEach((checkbox) => {
                checkbox.checked = false;
            });
            applyFilters();
        });
    });

    applyFilters(false);
}
