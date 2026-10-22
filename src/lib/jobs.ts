/**
 * Pure, side-effect-free helpers for working with job postings.
 *
 * These operate on plain `Job[]` arrays (already loaded from the content
 * collection by the calling page) so they can be unit tested without the Astro
 * content runtime or a database.
 */
import type { Job } from '../types/job';

/** Return jobs sorted by posted date, newest first (does not mutate input). */
export function sortByNewest(jobs: Job[]): Job[] {
    return [...jobs].sort(
        (a, b) => new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime(),
    );
}

/** Return unique, alphabetically sorted values for a job field. */
export function getUniqueJobValues(
    jobs: Job[],
    field: 'department' | 'location',
): string[] {
    return [...new Set(jobs.map((job) => job[field]))].sort((a, b) => a.localeCompare(b));
}

/**
 * Filter jobs by selected departments and locations.
 * Multiple values within a field are OR'd; the two fields are AND'd.
 */
export function filterJobs(
    jobs: Job[],
    departments: string[] = [],
    locations: string[] = [],
): Job[] {
    return jobs.filter(
        (job) =>
            (departments.length === 0 || departments.includes(job.department)) &&
            (locations.length === 0 || locations.includes(job.location)),
    );
}

/**
 * Format an ISO-8601 date as a human-readable posted date,
 * e.g. "January 5, 2027". Falls back to the raw value if unparseable.
 */
export function formatPostedDate(iso: string): string {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) {
        return iso;
    }
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'UTC',
    });
}
