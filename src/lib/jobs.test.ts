import { describe, it, expect } from 'vitest';
import {
    filterJobs,
    formatPostedDate,
    getUniqueJobValues,
    sortByNewest,
} from './jobs';
import type { Job } from '../types/job';

function makeJob(slug: string, postedDate: string): Job {
    return {
        slug,
        title: `Role ${slug}`,
        department: 'Technology',
        location: 'Remote',
        type: 'Full-time',
        remote: true,
        postedDate,
        summary: 'A role.',
    };
}

describe('sortByNewest', () => {
    it('orders jobs by posted date, newest first', () => {
        const jobs = [
            makeJob('a', '2027-01-01'),
            makeJob('b', '2027-03-15'),
            makeJob('c', '2027-02-10'),
        ];
        expect(sortByNewest(jobs).map((j) => j.slug)).toEqual(['b', 'c', 'a']);
    });

    it('does not mutate the input array', () => {
        const jobs = [makeJob('a', '2027-01-01'), makeJob('b', '2027-03-15')];
        const original = jobs.map((j) => j.slug);
        sortByNewest(jobs);
        expect(jobs.map((j) => j.slug)).toEqual(original);
    });
});

describe('formatPostedDate', () => {
    it('formats an ISO date as a readable string', () => {
        expect(formatPostedDate('2027-01-05')).toBe('January 5, 2027');
    });

    it('returns the raw value when the date is unparseable', () => {
        expect(formatPostedDate('not-a-date')).toBe('not-a-date');
    });
});

describe('getUniqueJobValues', () => {
    it('returns sorted unique departments and locations', () => {
        const jobs = [
            { ...makeJob('a', '2027-01-01'), department: 'Technology', location: 'Berlin' },
            { ...makeJob('b', '2027-01-02'), department: 'Finance', location: 'Austin' },
            { ...makeJob('c', '2027-01-03'), department: 'Finance', location: 'Berlin' },
        ];

        expect(getUniqueJobValues(jobs, 'department')).toEqual(['Finance', 'Technology']);
        expect(getUniqueJobValues(jobs, 'location')).toEqual(['Austin', 'Berlin']);
    });
});

describe('filterJobs', () => {
    const jobs = [
        { ...makeJob('technology-berlin', '2027-01-01'), department: 'Technology', location: 'Berlin' },
        { ...makeJob('technology-austin', '2027-01-02'), department: 'Technology', location: 'Austin' },
        { ...makeJob('finance-berlin', '2027-01-03'), department: 'Finance', location: 'Berlin' },
    ];

    it('filters by department and location independently', () => {
        expect(filterJobs(jobs, ['Technology']).map((job) => job.slug)).toEqual([
            'technology-berlin',
            'technology-austin',
        ]);
        expect(filterJobs(jobs, [], ['Berlin']).map((job) => job.slug)).toEqual([
            'technology-berlin',
            'finance-berlin',
        ]);
    });

    it('combines selected departments and locations with AND behavior', () => {
        expect(filterJobs(jobs, ['Technology', 'Finance'], ['Berlin'])).toEqual([
            jobs[0],
            jobs[2],
        ]);
    });

    it('returns all jobs with no filters and no jobs for unmatched values', () => {
        expect(filterJobs(jobs)).toEqual(jobs);
        expect(filterJobs(jobs, ['Unknown'])).toEqual([]);
    });
});
