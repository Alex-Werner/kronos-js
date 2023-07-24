const Kronos = require('.');
const instance = new Kronos();

const callback = (event)=>{
    console.log(event);
}

instance.on('SUBSCRIPTIONS', (data)=>{
    console.log('SUBSCRIPTION:', data);
});

instance.subscribe('1s');
instance.subscribe('1m');
instance.on('TIME/*', callback);
