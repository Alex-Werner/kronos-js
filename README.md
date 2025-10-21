## Kronos-JS

[![NPM Version](https://img.shields.io/npm/v/kronos-js.svg?&style=flat-square)](https://www.npmjs.org/package/kronos-js)
[![Release Date](https://img.shields.io/github/release-date/alex-werner/kronos-js)](https://github.com/alex-werner/kronos-js/releases/latest)

Kronos is a lightweight, dependency-free time-based event scheduler.  
Subscribe to time events using simple timeframe notation or standard CRON expressions.

Typically, you can use it to trigger a function every 5 minutes, every hour, every day, etc.

### Features

- Zero dependencies - Pure JavaScript implementation
- Flexible scheduling - Simple timeframe notation (1s, 5m, 1h, 1d) or full CRON expressions
- Precise timing - Sub-second accuracy with minimal drift
- Easy to use - Intuitive API with wildcard event listeners

## Installation

```bash
npm install kronos-js
```

## Usage

```javascript
import Kronos from 'kronos-js';

const instance = new Kronos();

// Subscribe to a timeframe
kronos.subscribe('1s');

// Listen to events
kronos.on('TIME/1s', (event) => {
  console.log('Tick!', event.payload.timestamp);
});

// Listen to all events
kronos.on('TIME/*', (event) => {
  console.log('All events!', event.type, event.payload);
});
```

Event format : `TIME/${timeframe}`  
Timeframe format : `1m`, `5m`, `15m`, `30m`, `1h`, `2h`, `4h`, `6h`, `12h`, `1d`, `3d`, `1w`, `1M`
Catch-all : `TIME/*`

## API Reference

### Creating an Instance

```javascript
const kronos = new Kronos();
```

### Subscribing to Time Events

#### Using Simple Timeframe Notation

```javascript
kronos.subscribe('5s');   // Every 5 seconds
kronos.subscribe('10m');  // Every 10 minutes
kronos.subscribe('2h');   // Every 2 hours
kronos.subscribe('1d');   // Every day at midnight
```

**Supported timeframe formats:**
- `Ns` - Every N seconds (e.g., `1s`, `30s`)
- `Nm` - Every N minutes (e.g., `1m`, `15m`)
- `Nh` - Every N hours (e.g., `1h`, `6h`)
- `Nd` - Every N days (e.g., `1d`, `7d`)

#### Using CRON Expressions

```javascript
// Standard 5-part CRON (minute hour day month dayOfWeek)
kronos.subscribe('*/5 * * * *');      // Every 5 minutes
kronos.subscribe('0 9 * * 1-5');      // 9 AM on weekdays

// Extended 6-part CRON (second minute hour day month dayOfWeek)
kronos.subscribe('*/30 * * * * *');   // Every 30 seconds
kronos.subscribe('0 0 12 * * *');     // Every day at noon
```

### Listening to Events

#### Specific Timeframe Events

```javascript
kronos.on('TIME/1s', (event) => {
  console.log(event.payload.timestamp);  // ISO 8601 timestamp
  console.log(event.payload.timeframe);  // '1s'
});
```

#### Wildcard Listener (All Events)

```javascript
kronos.on('TIME/*', (event) => {
  console.log(`Event from ${event.payload.timeframe}`);
});
```

#### Subscription Events

```javascript
kronos.on('SUBSCRIPTIONS', (event) => {
  console.log(event.type);              // 'SUBSCRIBED'
  console.log(event.payload.timeframe); // e.g., '1s'
});
```

### Event Payload Structure

```javascript
{
  type: 'TIME/1s',
  payload: {
    timestamp: '2025-10-21T19:26:30.000Z',   // ISO 8601 UTC timestamp
    timeframe: '1s'                          // The subscribed timeframe
  }
}
```

### Unsubscribing

```javascript
// Stop all scheduled jobs
kronos.unsubscribeAll();
```

## Usage Examples

### Basic Timer

```javascript
import Kronos from 'kronos-js';

const kronos = new Kronos();

kronos.subscribe('1s');
kronos.on('TIME/1s', (event) => {
  console.log('One second passed:', event.payload.timestamp);
});
```

### Multiple Timeframes

```javascript
const kronos = new Kronos();

// Subscribe to multiple timeframes
kronos.subscribe('1s');
kronos.subscribe('1m');
kronos.subscribe('1h');

// Handle each separately
kronos.on('TIME/1s', () => console.log('Second'));
kronos.on('TIME/1m', () => console.log('Minute'));
kronos.on('TIME/1h', () => console.log('Hour'));

// Or handle all at once
kronos.on('TIME/*', (event) => {
  console.log(`Event from ${event.payload.timeframe}`);
});
```

### Data Synchronization

```javascript
const kronos = new Kronos();

// Sync data every 5 minutes
kronos.subscribe('5m');
kronos.on('TIME/5m', async (event) => {
  console.log('Syncing data at', event.payload.timestamp);
  await syncDatabase();
});

// Quick health check every 30 seconds
kronos.subscribe('30s');
kronos.on('TIME/30s', () => {
  checkServiceHealth();
});
```

### Complex CRON Schedules

```javascript
const kronos = new Kronos();

// Business hours only (9 AM - 5 PM, Monday-Friday)
kronos.subscribe('0 9-17 * * 1-5');
kronos.on('TIME/0 9-17 * * 1-5', () => {
  console.log('Business hours notification');
});

// Every 15 minutes during business hours
kronos.subscribe('*/15 9-17 * * 1-5');
kronos.on('TIME/*/15 9-17 * * 1-5', () => {
  checkQueueStatus();
});
```

### Event-Driven Architecture

```javascript
import Kronos from 'kronos-js';
import { EventEmitter } from 'events';

class DataProcessor extends EventEmitter {
  constructor() {
    super();
    this.kronos = new Kronos();
    this.setupSchedules();
  }

  setupSchedules() {
    // Process data every minute
    this.kronos.subscribe('1m');
    this.kronos.on('TIME/1m', () => {
      this.emit('process-data');
    });

    // Generate reports daily
    this.kronos.subscribe('1d');
    this.kronos.on('TIME/1d', () => {
      this.emit('generate-report');
    });
  }

  cleanup() {
    this.kronos.unsubscribeAll();
  }
}

const processor = new DataProcessor();
processor.on('process-data', () => console.log('Processing...'));
processor.on('generate-report', () => console.log('Generating report...'));
```

### Graceful Shutdown

```javascript
const kronos = new Kronos();

kronos.subscribe('1s');
kronos.on('TIME/1s', () => {
  console.log('Working...');
});

// Handle shutdown signals
const shutdown = () => {
  console.log('Shutting down gracefully...');
  kronos.unsubscribeAll();
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
```

## CRON Expression Reference

Kronos supports both 5-part and 6-part CRON expressions:

### 5-part format (no seconds)
```
┌───────────── minute (0 - 59)
│ ┌───────────── hour (0 - 23)
│ │ ┌───────────── day of month (1 - 31)
│ │ │ ┌───────────── month (1 - 12)
│ │ │ │ ┌───────────── day of week (0 - 6) (Sunday to Saturday)
│ │ │ │ │
* * * * *
```

### 6-part format (with seconds)
```
┌───────────── second (0 - 59)
│ ┌───────────── minute (0 - 59)
│ │ ┌───────────── hour (0 - 23)
│ │ │ ┌───────────── day of month (1 - 31)
│ │ │ │ ┌───────────── month (1 - 12)
│ │ │ │ │ ┌───────────── day of week (0 - 6)
│ │ │ │ │ │
* * * * * *
```

### Special Characters

- `*` - Any value
- `,` - Value list separator (e.g., `1,3,5`)
- `-` - Range of values (e.g., `1-5`)
- `/` - Step values (e.g., `*/5` or `1-10/2`)

### Common CRON Examples

```javascript
'* * * * *'           // Every minute
'*/5 * * * *'         // Every 5 minutes
'0 * * * *'           // Every hour
'0 0 * * *'           // Every day at midnight
'0 0 * * 0'           // Every Sunday at midnight
'0 9 * * 1-5'         // Weekdays at 9 AM
'*/30 9-17 * * 1-5'   // Every 30 min during business hours
'0 0 1 * *'           // First day of every month
'0 0 1 1 *'           // January 1st every year
```

## Performance

Kronos is designed for as accurate as possible high-precision timing with minimal overhead.  
Each execution recalculates from current time to ensure the most accurate timing possible.

## Best Practices

1. **Always unsubscribe**: Call `unsubscribeAll()` before your application exits
2. **Use wildcard listeners wisely**: `TIME/*` receives all events from all subscriptions
3. **Avoid duplicate subscriptions**: Subscribing to the same timeframe twice will reuse the same job
4. **Consider timezone**: All timestamps are in UTC (ISO 8601 format)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT © [Alex Werner](https://github.com/alex-werner)