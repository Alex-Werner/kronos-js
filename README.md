## Kronos

Kronos is a Node.js module that allows you to subscribe to time events based on a standard CRON expression.

Typically, you can use it to trigger a function every 5 minutes, every hour, every day, etc.

## Installation

```bash
npm install kronos-js
```

## Usage


```javascript
const Kronos = require('kronos-js');
const instance = new Kronos();

const callback = (event)=>{
    console.log(event);
}

instance.on('SUBSCRIPTIONS', (data)=>{
    console.log('SUBSCRIPTION:', data);
});

instance.subscribe('1s');
instance.subscribe('1m');
instance.on('TIME/1s', callback);
instance.on('TIME/1m', callback);
instance.on('TIME/*', callback);

```

Event format : `TIME/${timeframe}`  
Timeframe format : `1m`, `5m`, `15m`, `30m`, `1h`, `2h`, `4h`, `6h`, `12h`, `1d`, `3d`, `1w`, `1M`
Catch-all : `TIME/*`
