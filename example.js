import Kronos from './src/Kronos.js';

const instance = new Kronos();

instance.on('SUBSCRIPTIONS', (data)=>{
    console.log('---------- SUBSCRIPTION EVENT --------------------');
    console.log(new Date().toISOString());
    console.log('SUBSCRIPTION:', data);
});

instance.subscribe('1s');
instance.subscribe('1m');

instance.on('TIME/*', (event)=>{
    console.log('---------- WILDCARD EVENT --------------------');
    console.log(new Date().toISOString());
    console.log(event);
});
