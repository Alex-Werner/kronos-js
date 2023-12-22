import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Kronos from './Kronos'; // Adjust the import path according to your project structure

describe('Kronos', () => {
    let kronos;

    beforeEach(() => {
        kronos = new Kronos();
    });

    afterEach(() => {
        kronos.unsubscribeAll();
    });

    it('should initialize with an empty job list', () => {
        expect(kronos.jobList).toEqual({});
    });

    it('should add a job when subscribing with a valid timeframe', () => {
        kronos.subscribe('10s');
        expect(Object.keys(kronos.jobList)).toContain('10s');
    });

    it('should throw an error for invalid timeframes', () => {
        const invalidSubscribe = () => kronos.subscribe('10x');
        expect(invalidSubscribe).toThrow('Invalid timeframe or cron string');
    });

    it('should handle full cron string subscriptions', () => {
        const cronString = '*/15 * * * * *'; // Every 15 seconds
        kronos.subscribe(cronString);
        expect(Object.keys(kronos.jobList)).toContain(cronString);
    });

    it('should stop all jobs on unsubscribeAll', () => {
        kronos.subscribe('1m');
        kronos.subscribe('2h');
        kronos.unsubscribeAll();
        expect(kronos.jobList).toEqual({});
    });
});
