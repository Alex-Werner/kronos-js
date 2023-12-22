## Kronos-JS

[![NPM Version](https://img.shields.io/npm/v/kronos-js.svg?&style=flat-square)](https://www.npmjs.org/package/kronos-js)
[![Release Date](https://img.shields.io/github/release-date/alex-werner/kronos-js)](https://github.com/alex-werner/kronos-js/releases/latest)

Kronos is a simple helper package that allows you to subscribe to time events based on a standard CRON expression or a timeframe value.

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

instance.subscribe('1s');
instance.on('TIME/1s', callback);

instance.subscribe('1m');
instance.on('TIME/1m', callback);

// WIll catch all subscriptions
instance.on('SUBSCRIPTIONS', (data)=>{
    console.log('SUBSCRIPTION:', data);
});
instance.on('TIME/*', callback);
```

Event format : `TIME/${timeframe}`  
Timeframe format : `1m`, `5m`, `15m`, `30m`, `1h`, `2h`, `4h`, `6h`, `12h`, `1d`, `3d`, `1w`, `1M`
Catch-all : `TIME/*`
