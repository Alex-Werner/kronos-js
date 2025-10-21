import { describe, it, expect, afterEach, setTestTimeout } from '@scintilla-network/litest';
import CronJob from './CronJob.js';
import CallbackTracker from './utils/CallbackTracker.js';

setTestTimeout(20000);

describe('SimpleCronJob', () => {
  let jobs = [];

  afterEach(() => {
    // Clean up all jobs after each test
    jobs.forEach(job => job.stop());
    jobs = [];
  });

  describe('Constructor', () => {
    it('should create a job without starting it', () => {
      const job = new CronJob('* * * * * *', () => {});
      jobs.push(job);
      
      expect(job.isRunning).toBe(false);
      expect(job.cronRule).toBe('* * * * * *');
    });

    it('should start job when start parameter is true', () => {
      const job = new CronJob('* * * * * *', () => {}, null, true);
      jobs.push(job);
      
      expect(job.isRunning).toBe(true);
    });
  });

  describe('Start and Stop', () => {
    it('should start a job', () => {
      const job = new CronJob('* * * * * *', () => {});
      jobs.push(job);
      
      job.start();
      expect(job.isRunning).toBe(true);
    });

    it('should stop a job', () => {
      const job = new CronJob('* * * * * *', () => {}, null, true);
      jobs.push(job);
      
      job.stop();
      expect(job.isRunning).toBe(false);
    });

    it('should not start twice', () => {
      const job = new CronJob('* * * * * *', () => {});
      jobs.push(job);
      
      job.start();
      job.start();
      expect(job.isRunning).toBe(true);
    });

    it('should call onComplete when stopped', () => {
      const tracker = new CallbackTracker();
      const job = new CronJob('* * * * * *', () => {}, tracker.track(), true);
      jobs.push(job);
      
      job.stop();
      expect(tracker.callCount).toBe(1);
    });
  });

  describe('Cron Pattern Matching - Every Second', () => {
    it('should execute every second with "* * * * * *"', async () => {
      const tracker = new CallbackTracker();
      const job = new CronJob('* * * * * *', tracker.track(), null, true);
      jobs.push(job);
      
      await tracker.waitForCalls(3, 4000);
      
      expect(tracker.callCount).toBeGreaterThanOrEqual(3);
      
      // Check that calls are roughly 1 second apart
      if (tracker.calls.length >= 2) {
        const diff = tracker.calls[1].timestamp - tracker.calls[0].timestamp;
        expect(diff).toBeGreaterThan(900);
        expect(diff).toBeLessThan(1200);
      }
    });

    it('should execute every 5 seconds with "*/5 * * * * *"', async () => {
      const tracker = new CallbackTracker();
      const job = new CronJob('*/5 * * * * *', tracker.track(), null, true);
      jobs.push(job);
      
      await tracker.waitForCalls(2, 12000);
      
      expect(tracker.callCount).toBeGreaterThanOrEqual(2);
      
      // Check that calls are roughly 5 seconds apart
      if (tracker.calls.length >= 2) {
        const diff = tracker.calls[1].timestamp - tracker.calls[0].timestamp;
        expect(diff).toBeGreaterThan(4500);
        expect(diff).toBeLessThan(5500);
      }
    });
  });

  describe('Cron Pattern Matching - 5-part format (no seconds)', () => {
    it('should handle 5-part cron format "* * * * *"', () => {
      const tracker = new CallbackTracker();
      const job = new CronJob('* * * * *', tracker.track());
      jobs.push(job);
      
      expect(job.cronRule).toBe('* * * * *');
      expect(job.isRunning).toBe(false);
    });

    it('should execute with "*/2 * * * *" pattern', async () => {
      const tracker = new CallbackTracker();
      const job = new CronJob('*/2 * * * *', tracker.track(), null, true);
      jobs.push(job);
      
      // This should execute at minute 0, 2, 4, etc.
      // For testing, we just verify it starts
      expect(job.isRunning).toBe(true);
    });
  });

  describe('Field Matching Logic', () => {
    it('should match wildcard "*"', () => {
      const job = new CronJob('* * * * * *', () => {});
      jobs.push(job);
      
      expect(job._matchField(0, '*', 0, 59)).toBe(true);
      expect(job._matchField(30, '*', 0, 59)).toBe(true);
      expect(job._matchField(59, '*', 0, 59)).toBe(true);
    });

    it('should match exact values', () => {
      const job = new CronJob('* * * * * *', () => {});
      jobs.push(job);
      
      expect(job._matchField(15, '15', 0, 59)).toBe(true);
      expect(job._matchField(15, '30', 0, 59)).toBe(false);
    });

    it('should match step values "*/n"', () => {
      const job = new CronJob('* * * * * *', () => {});
      jobs.push(job);
      
      expect(job._matchField(0, '*/5', 0, 59)).toBe(true);
      expect(job._matchField(5, '*/5', 0, 59)).toBe(true);
      expect(job._matchField(10, '*/5', 0, 59)).toBe(true);
      expect(job._matchField(3, '*/5', 0, 59)).toBe(false);
    });

    it('should match ranges "n-m"', () => {
      const job = new CronJob('* * * * * *', () => {});
      jobs.push(job);
      
      expect(job._matchField(5, '5-10', 0, 59)).toBe(true);
      expect(job._matchField(7, '5-10', 0, 59)).toBe(true);
      expect(job._matchField(10, '5-10', 0, 59)).toBe(true);
      expect(job._matchField(4, '5-10', 0, 59)).toBe(false);
      expect(job._matchField(11, '5-10', 0, 59)).toBe(false);
    });

    it('should match ranges with steps "n-m/s"', () => {
      const job = new CronJob('* * * * * *', () => {});
      jobs.push(job);
      
      expect(job._matchField(10, '10-20/2', 0, 59)).toBe(true);
      expect(job._matchField(12, '10-20/2', 0, 59)).toBe(true);
      expect(job._matchField(20, '10-20/2', 0, 59)).toBe(true);
      expect(job._matchField(11, '10-20/2', 0, 59)).toBe(false);
      expect(job._matchField(21, '10-20/2', 0, 59)).toBe(false);
    });

    it('should match lists "n,m,o"', () => {
      const job = new CronJob('* * * * * *', () => {});
      jobs.push(job);
      
      expect(job._matchField(5, '5,10,15', 0, 59)).toBe(true);
      expect(job._matchField(10, '5,10,15', 0, 59)).toBe(true);
      expect(job._matchField(15, '5,10,15', 0, 59)).toBe(true);
      expect(job._matchField(7, '5,10,15', 0, 59)).toBe(false);
    });
  });

  describe('Next Date Calculation', () => {
    it('should calculate next date for "* * * * * *"', () => {
      const job = new CronJob('* * * * * *', () => {});
      jobs.push(job);
      
      const now = new Date();
      const next = job._getNextDate(now);
      
      expect(next).toBeInstanceOf(Date);
      expect(next.getTime()).toBeGreaterThan(now.getTime());
      
      // Should be within 2 seconds
      const diff = next.getTime() - now.getTime();
      expect(diff).toBeLessThan(2000);
    });

    it('should calculate next date for "0 * * * * *" (every minute at :00)', () => {
      const job = new CronJob('0 * * * * *', () => {});
      jobs.push(job);
      
      const now = new Date('2024-01-01T12:30:45.000Z');
      const next = job._getNextDate(now);
      
      expect(next.getSeconds()).toBe(0);
      expect(next.getMinutes()).toBe(31);
    });

    it('should calculate next date for "*/5 * * * * *" (every 5 seconds)', () => {
      const job = new CronJob('*/5 * * * * *', () => {});
      jobs.push(job);
      
      const now = new Date('2024-01-01T12:30:07.000Z');
      const next = job._getNextDate(now);
      
      expect(next.getSeconds()).toBe(10);
    }, 10000);

    it('should calculate next date for "0 0 * * *" (daily at midnight)', () => {
      const job = new CronJob('0 0 * * *', () => {});
      jobs.push(job);
      
      const now = new Date('2024-01-01T12:30:00.000Z');
      const next = job._getNextDate(now);
      
      expect(next.getHours()).toBe(0);
      expect(next.getMinutes()).toBe(0);
      expect(next.getDate()).toBe(2); // Next day
    });
  }, 20000);

  describe('Integration with Kronos patterns', () => {
    it('should work with seconds pattern "*/${num} * * * * *"', async () => {
      const tracker = new CallbackTracker();
      const job = new CronJob('*/2 * * * * *', tracker.track(), null, true);
      jobs.push(job);
      
      await tracker.waitForCalls(2, 5000);
      expect(tracker.callCount).toBeGreaterThanOrEqual(2);
    });

    it('should work with minutes pattern "*/${num} * * * *"', () => {
      const tracker = new CallbackTracker();
      const job = new CronJob('*/5 * * * *', tracker.track());
      jobs.push(job);
      
      expect(job.cronRule).toBe('*/5 * * * *');
    });

    it('should work with hours pattern "0 */${num} * * *"', () => {
      const tracker = new CallbackTracker();
      const job = new CronJob('0 */2 * * *', tracker.track());
      jobs.push(job);
      
      expect(job.cronRule).toBe('0 */2 * * *');
    });

    it('should work with daily pattern "0 0 * * *"', () => {
      const tracker = new CallbackTracker();
      const job = new CronJob('0 0 * * *', tracker.track());
      jobs.push(job);
      
      expect(job.cronRule).toBe('0 0 * * *');
    });

    it('should work with multi-day pattern "0 0 */${num} * *"', () => {
      const tracker = new CallbackTracker();
      const job = new CronJob('0 0 */3 * *', tracker.track());
      jobs.push(job);
      
      expect(job.cronRule).toBe('0 0 */3 * *');
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid start/stop cycles', () => {
      const job = new CronJob('* * * * * *', () => {});
      jobs.push(job);
      
      job.start();
      job.stop();
      job.start();
      job.stop();
      
      expect(job.isRunning).toBe(false);
    });

    it('should not crash with complex cron expressions', () => {
      const tracker = new CallbackTracker();
      const job = new CronJob('0,15,30,45 * * * * *', tracker.track());
      jobs.push(job);
      
      expect(() => job.start()).not.toThrow();
    });

    it('should handle day of week patterns', () => {
      const tracker = new CallbackTracker();
      // Every Monday at midnight
      const job = new CronJob('0 0 * * 1', tracker.track());
      jobs.push(job);
      
      expect(job.cronRule).toBe('0 0 * * 1');
    });
  });

  describe('Memory Management', () => {
    it('should clear timeout when stopped', () => {
      const job = new CronJob('* * * * * *', () => {}, null, true);
      jobs.push(job);
      
      expect(job.timeout).not.toBeNull();
      job.stop();
      expect(job.timeout).toBeNull();
    });

    it('should handle multiple jobs simultaneously', async () => {
      const tracker1 = new CallbackTracker();
      const tracker2 = new CallbackTracker();
      const tracker3 = new CallbackTracker();
      
      const job1 = new CronJob('* * * * * *', tracker1.track(), null, true);
      const job2 = new CronJob('* * * * * *', tracker2.track(), null, true);
      const job3 = new CronJob('* * * * * *', tracker3.track(), null, true);
      
      jobs.push(job1, job2, job3);
      
      await Promise.all([
        tracker1.waitForCalls(2, 3000),
        tracker2.waitForCalls(2, 3000),
        tracker3.waitForCalls(2, 3000)
      ]);
      
      expect(tracker1.callCount).toBeGreaterThanOrEqual(2);
      expect(tracker2.callCount).toBeGreaterThanOrEqual(2);
      expect(tracker3.callCount).toBeGreaterThanOrEqual(2);
    });
  });
});