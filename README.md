## Kronos


## Installation

```bash
npm install kronos-js
```


## Usage

```javascript
const Kronos = require('kronos-js');
const instance = new Kronos();
const subscription = instance.subscribe('1m');
instance.on('1m', callback);
```

Event format : `TIME/${timeframe}`  
Timeframe format : `1m`, `5m`, `15m`, `30m`, `1h`, `2h`, `4h`, `6h`, `12h`, `1d`, `3d`, `1w`, `1M`
