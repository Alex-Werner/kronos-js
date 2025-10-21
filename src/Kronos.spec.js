import { describe, it, expect, beforeEach, afterEach } from '@scintilla-network/litest';
import Kronos from './Kronos.js';
import EventCollector from './utils/EventCollector.js';

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


describe('Kronos - Units', () => {
    let kronos;
  
    beforeEach(() => {
      kronos = new Kronos();
    });
  
    afterEach(() => {
      if (kronos) {
        kronos.unsubscribeAll();
      }
    });
  
    describe('Constructor', () => {
      it('should create a Kronos instance', () => {
        expect(kronos).toBeDefined();
        expect(kronos.jobList).toBeDefined();
        expect(Object.keys(kronos.jobList)).toHaveLength(0);
      });
  
      it('should extend EventEmitter', () => {
        expect(typeof kronos.on).toBe('function');
        expect(typeof kronos.emit).toBe('function');
        expect(typeof kronos.removeListener).toBe('function');
      });
    });
  
    describe('Subscribe - Simple Timeframe Format', () => {
      it('should subscribe to seconds timeframe "Ns"', () => {
        kronos.subscribe('2s');
        expect(kronos.jobList['2s']).toBeDefined();
        expect(kronos.jobList['2s'].isRunning).toBe(true);
      });
  
      it('should subscribe to minutes timeframe "Nm"', () => {
        kronos.subscribe('5m');
        expect(kronos.jobList['5m']).toBeDefined();
        expect(kronos.jobList['5m'].isRunning).toBe(true);
      });
  
      it('should subscribe to hours timeframe "Nh"', () => {
        kronos.subscribe('2h');
        expect(kronos.jobList['2h']).toBeDefined();
        expect(kronos.jobList['2h'].isRunning).toBe(true);
      });
  
      it('should subscribe to days timeframe "Nd"', () => {
        kronos.subscribe('3d');
        expect(kronos.jobList['3d']).toBeDefined();
        expect(kronos.jobList['3d'].isRunning).toBe(true);
      });
  
      it('should subscribe to single day timeframe "1d"', () => {
        kronos.subscribe('1d');
        expect(kronos.jobList['1d']).toBeDefined();
        expect(kronos.jobList['1d'].cronRule).toBe('0 0 * * *');
      });
  
      it('should throw error for invalid timeframe', () => {
        expect(() => kronos.subscribe('5x')).toThrow('Invalid timeframe or cron string');
      });
    });
  
    describe('Subscribe - Cron String Format', () => {
      it('should subscribe to 5-part cron string', () => {
        kronos.subscribe('*/5 * * * *');
        expect(kronos.jobList['*/5 * * * *']).toBeDefined();
        expect(kronos.jobList['*/5 * * * *'].isRunning).toBe(true);
      });
  
      it('should subscribe to 6-part cron string', () => {
        kronos.subscribe('*/30 * * * * *');
        expect(kronos.jobList['*/30 * * * * *']).toBeDefined();
        expect(kronos.jobList['*/30 * * * * *'].isRunning).toBe(true);
      });
  
      it('should handle complex cron expressions', () => {
        kronos.subscribe('0 0 12 * * 1-5');
        expect(kronos.jobList['0 0 12 * * 1-5']).toBeDefined();
        expect(kronos.jobList['0 0 12 * * 1-5'].isRunning).toBe(true);
      });
    });
  
    describe('Cron Rule Generation', () => {
      it('should generate correct cron rule for seconds', () => {
        kronos.subscribe('5s');
        expect(kronos.jobList['5s'].cronRule).toBe('*/5 * * * * *');
      });
  
      it('should generate correct cron rule for minutes', () => {
        kronos.subscribe('10m');
        expect(kronos.jobList['10m'].cronRule).toBe('*/10 * * * *');
      });
  
      it('should generate correct cron rule for hours', () => {
        kronos.subscribe('3h');
        expect(kronos.jobList['3h'].cronRule).toBe('0 */3 * * *');
      });
  
      it('should generate correct cron rule for multi-day', () => {
        kronos.subscribe('7d');
        expect(kronos.jobList['7d'].cronRule).toBe('0 0 */7 * *');
      });
  
      it('should generate correct cron rule for single day', () => {
        kronos.subscribe('1d');
        expect(kronos.jobList['1d'].cronRule).toBe('0 0 * * *');
      });
    });
  
    describe('Event Emission - Seconds', () => {
      it('should emit TIME/<timeframe> event on tick', async () => {
        const collector = new EventCollector();
        kronos.on('TIME/2s', collector.collect());
        
        kronos.subscribe('2s');
        
        const events = await collector.waitForEvents(2, 5000);
        
        expect(events.length).toBeGreaterThanOrEqual(2);
        expect(events[0].type).toBe('TIME/2s');
        expect(events[0].payload).toBeDefined();
        expect(events[0].payload.timeframe).toBe('2s');
        expect(events[0].payload.timestamp).toBeDefined();
      });
  
      it('should emit TIME/* wildcard event on tick', async () => {
        const collector = new EventCollector();
        kronos.on('TIME/*', collector.collect());
        
        kronos.subscribe('2s');
        
        const events = await collector.waitForEvents(2, 5000);
        
        expect(events.length).toBeGreaterThanOrEqual(2);
        expect(events[0].type).toBe('TIME/2s');
      });
  
      it('should emit both specific and wildcard events', async () => {
        const specificCollector = new EventCollector();
        const wildcardCollector = new EventCollector();
        
        kronos.on('TIME/2s', specificCollector.collect());
        kronos.on('TIME/*', wildcardCollector.collect());
        
        kronos.subscribe('2s');
        
        await Promise.all([
          specificCollector.waitForEvents(2, 5000),
          wildcardCollector.waitForEvents(2, 5000)
        ]);
        
        expect(specificCollector.count).toBeGreaterThanOrEqual(2);
        expect(wildcardCollector.count).toBeGreaterThanOrEqual(2);
        expect(specificCollector.count).toBe(wildcardCollector.count);
      });
    });
  
    describe('Event Payload', () => {
      it('should have correct payload structure', async () => {
        const collector = new EventCollector();
        kronos.on('TIME/1s', collector.collect());
        
        kronos.subscribe('1s');
        
        const events = await collector.waitForEvents(1, 3000);
        const event = events[0];
        
        expect(event).toHaveProperty('type');
        expect(event).toHaveProperty('payload');
        expect(event.payload).toHaveProperty('timestamp');
        expect(event.payload).toHaveProperty('timeframe');
        expect(event.payload.timeframe).toBe('1s');
      });
  
      it('should have ISO 8601 timestamp', async () => {
        const collector = new EventCollector();
        kronos.on('TIME/1s', collector.collect());
        
        kronos.subscribe('1s');
        
        const events = await collector.waitForEvents(1, 3000);
        const timestamp = events[0].payload.timestamp;
        
        expect(typeof timestamp).toBe('string');
        expect(() => new Date(timestamp)).not.toThrow();
        
        // Check ISO 8601 format (ends with Z for UTC)
        expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      });
  
      it('should have milliseconds set to 000', async () => {
        const collector = new EventCollector();
        kronos.on('TIME/1s', collector.collect());
        
        kronos.subscribe('1s');
        
        const events = await collector.waitForEvents(1, 3000);
        const timestamp = events[0].payload.timestamp;
        
        expect(timestamp).toMatch(/\.000Z$/);
      });
    });
  
    describe('Subscription Event', () => {
      it('should emit SUBSCRIPTIONS event when subscribing', () => {
        const collector = new EventCollector();
        kronos.on('SUBSCRIPTIONS', collector.collect());
        
        kronos.subscribe('1s');
        
        expect(collector.count).toBe(1);
        expect(collector.events[0].type).toBe('SUBSCRIBED');
        expect(collector.events[0].payload.timeframe).toBe('1s');
      });
  
      it('should emit SUBSCRIPTIONS event for each subscription', () => {
        const collector = new EventCollector();
        kronos.on('SUBSCRIPTIONS', collector.collect());
        
        kronos.subscribe('1s');
        kronos.subscribe('2m');
        kronos.subscribe('3h');
        
        expect(collector.count).toBe(3);
        expect(collector.getEventsByType('SUBSCRIBED').length).toBe(3);
      });
    });
  
    describe('Multiple Subscriptions', () => {
      it('should handle multiple timeframe subscriptions', async () => {
        const collector1s = new EventCollector();
        const collector2s = new EventCollector();
        
        kronos.on('TIME/1s', collector1s.collect());
        kronos.on('TIME/2s', collector2s.collect());
        
        kronos.subscribe('1s');
        kronos.subscribe('2s');
        
        await Promise.all([
          collector1s.waitForEvents(2, 4000),
          collector2s.waitForEvents(1, 4000)
        ]);
        
        expect(collector1s.count).toBeGreaterThanOrEqual(2);
        expect(collector2s.count).toBeGreaterThanOrEqual(1);
      });
  
      it('should maintain separate job instances', () => {
        kronos.subscribe('1s');
        kronos.subscribe('2s');
        kronos.subscribe('3s');
        
        expect(Object.keys(kronos.jobList)).toHaveLength(3);
        expect(kronos.jobList['1s']).not.toBe(kronos.jobList['2s']);
        expect(kronos.jobList['2s']).not.toBe(kronos.jobList['3s']);
      });
  
      it('should not create duplicate subscriptions', () => {
        kronos.subscribe('1s');
        const firstJob = kronos.jobList['1s'];
        
        kronos.subscribe('1s');
        const secondJob = kronos.jobList['1s'];
        
        expect(Object.keys(kronos.jobList)).toHaveLength(1);
        expect(firstJob).toBe(secondJob);
      });
    });
  
    describe('Wildcard Event Listener', () => {
      it('should receive all timeframe events on TIME/*', async () => {
        const collector = new EventCollector();
        kronos.on('TIME/*', collector.collect());
        
        kronos.subscribe('1s');
        kronos.subscribe('2s');
        
        await collector.waitForEvents(3, 5000);
        
        const types = collector.events.map(e => e.type);
        expect(types).toContain('TIME/1s');
        expect(types).toContain('TIME/2s');
      });
  
      it('should identify different timeframes in wildcard events', async () => {
        const collector = new EventCollector();
        kronos.on('TIME/*', collector.collect());
        
        kronos.subscribe('1s');
        kronos.subscribe('2s');
        
        await collector.waitForEvents(4, 6000);
        
        const timeframes = collector.events.map(e => e.payload.timeframe);
        expect(timeframes).toContain('1s');
        expect(timeframes).toContain('2s');
      });
    });
  
    describe('UnsubscribeAll', () => {
      it('should stop all jobs', () => {
        kronos.subscribe('1s');
        kronos.subscribe('2s');
        kronos.subscribe('3s');
        
        expect(kronos.jobList['1s'].isRunning).toBe(true);
        expect(kronos.jobList['2s'].isRunning).toBe(true);
        expect(kronos.jobList['3s'].isRunning).toBe(true);
        
        kronos.unsubscribeAll();
        
        expect(Object.keys(kronos.jobList)).toHaveLength(0);
      });
  
      it('should prevent further event emissions', async () => {
        const collector = new EventCollector();
        kronos.on('TIME/1s', collector.collect());
        
        kronos.subscribe('1s');
        
        await collector.waitForEvents(1, 3000);
        const countBeforeUnsubscribe = collector.count;
        
        kronos.unsubscribeAll();
        
        // Wait a bit more
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Count should not have increased significantly
        expect(collector.count).toBeLessThanOrEqual(countBeforeUnsubscribe + 1);
      });
  
      it('should clear jobList', () => {
        kronos.subscribe('1s');
        kronos.subscribe('2s');
        
        expect(Object.keys(kronos.jobList).length).toBeGreaterThan(0);
        
        kronos.unsubscribeAll();
        
        expect(Object.keys(kronos.jobList)).toHaveLength(0);
      });
  
      it('should be safe to call multiple times', () => {
        kronos.subscribe('1s');
        
        expect(() => {
          kronos.unsubscribeAll();
          kronos.unsubscribeAll();
          kronos.unsubscribeAll();
        }).not.toThrow();
        
        expect(Object.keys(kronos.jobList)).toHaveLength(0);
      });
  
      it('should be safe to call on empty jobList', () => {
        expect(() => kronos.unsubscribeAll()).not.toThrow();
        expect(Object.keys(kronos.jobList)).toHaveLength(0);
      });
    });
  
    describe('Timing Accuracy', () => {
      it('should emit events at approximately correct intervals for 1s', async () => {
        const collector = new EventCollector();
        kronos.on('TIME/1s', collector.collect());
        
        kronos.subscribe('1s');
        
        const events = await collector.waitForEvents(3, 5000);
        
        if (events.length >= 2) {
          const diff1 = events[1].receivedAt - events[0].receivedAt;
          expect(diff1).toBeGreaterThan(900);
          expect(diff1).toBeLessThan(1200);
        }
        
        if (events.length >= 3) {
          const diff2 = events[2].receivedAt - events[1].receivedAt;
          expect(diff2).toBeGreaterThan(900);
          expect(diff2).toBeLessThan(1200);
        }
      });
  
      it('should emit events at approximately correct intervals for 2s', async () => {
        const collector = new EventCollector();
        kronos.on('TIME/2s', collector.collect());
        
        kronos.subscribe('2s');
        
        const events = await collector.waitForEvents(2, 6000);
        
        if (events.length >= 2) {
          const diff = events[1].receivedAt - events[0].receivedAt;
          expect(diff).toBeGreaterThan(1800);
          expect(diff).toBeLessThan(2300);
        }
      });
    });
  
    describe('Edge Cases', () => {
      it('should handle large number values', () => {
        expect(() => kronos.subscribe('999s')).not.toThrow();
        expect(kronos.jobList['999s'].cronRule).toBe('*/999 * * * * *');
      });
  
      it('should handle single digit values', () => {
        expect(() => kronos.subscribe('1s')).not.toThrow();
        expect(kronos.jobList['1s'].cronRule).toBe('*/1 * * * * *');
      });
  
      it('should handle subscribe after unsubscribeAll', async () => {
        const collector = new EventCollector();
        kronos.on('TIME/1s', collector.collect());
        
        kronos.subscribe('1s');
        await collector.waitForEvents(1, 3000);
        
        kronos.unsubscribeAll();
        collector.reset();
        
        kronos.subscribe('1s');
        await collector.waitForEvents(1, 3000);
        
        expect(collector.count).toBeGreaterThanOrEqual(1);
      });
  
      it('should handle mixed subscription types', async () => {
        const collector = new EventCollector();
        kronos.on('TIME/*', collector.collect());
        
        kronos.subscribe('1s');
        kronos.subscribe('*/5 * * * * *');
        kronos.subscribe('2s');
        
        expect(Object.keys(kronos.jobList)).toHaveLength(3);
        
        await collector.waitForEvents(3, 6000);
        expect(collector.count).toBeGreaterThanOrEqual(3);
      });
    });
  
    describe('Memory and Resource Management', () => {
      it('should not leak event listeners', () => {
        const initialListenerCount = kronos.listenerCount('TIME/*');
        
        for (let i = 0; i < 10; i++) {
          const collector = new EventCollector();
          kronos.on('TIME/*', collector.collect());
        }
        
        expect(kronos.listenerCount('TIME/*')).toBe(initialListenerCount + 10);
        
        kronos.removeAllListeners('TIME/*');
        expect(kronos.listenerCount('TIME/*')).toBe(0);
      });
  
      it('should handle rapid subscribe/unsubscribe cycles', () => {
        for (let i = 0; i < 10; i++) {
          kronos.subscribe('1s');
          kronos.subscribe('2s');
          kronos.unsubscribeAll();
        }
        
        expect(Object.keys(kronos.jobList)).toHaveLength(0);
      });
    });
  
    describe('Integration Scenarios', () => {
      it('should work as a time-based event bus', async () => {
        const results = { '1s': 0, '2s': 0 };
        
        kronos.on('TIME/1s', () => results['1s']++);
        kronos.on('TIME/2s', () => results['2s']++);
        
        kronos.subscribe('1s');
        kronos.subscribe('2s');
        
        await new Promise(resolve => setTimeout(resolve, 3500));
        
        expect(results['1s']).toBeGreaterThanOrEqual(3);
        expect(results['2s']).toBeGreaterThanOrEqual(1);
      });
  
      it('should support event-driven architecture pattern', async () => {
        const eventLog = [];
        
        kronos.on('TIME/*', (event) => {
          eventLog.push({
            type: event.type,
            timeframe: event.payload.timeframe,
            time: new Date()
          });
        });
        
        kronos.subscribe('1s');
        
        await new Promise(resolve => setTimeout(resolve, 2500));
        
        expect(eventLog.length).toBeGreaterThanOrEqual(2);
        expect(eventLog.every(log => log.type.startsWith('TIME/'))).toBe(true);
      });
    });
  });