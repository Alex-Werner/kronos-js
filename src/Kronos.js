// const EventEmitter = require('eventemitter2').EventEmitter2;
const EventEmitter = require('events');
const {CronJob} = require('cron');
const moment = require('moment');

class Kronos extends EventEmitter {
  constructor(){
    super();

    this.jobList = [];
  }
  subscribe(timeframe){
    let cronRule;

    const type = timeframe.slice(-1);
    const num = timeframe.substr(0, timeframe.length-type.length);
    switch (type) {
      case 's':
        cronRule = `*/${num} * * * * *`;
        break
      case 'm':
        cronRule = `*/${num} * * * *`;
        break;
      case 'h':
        cronRule = `0 */${num} * * *`;
        break;
      case 'd':
        if(num===1){
          cronRule = `0 0 * * *`;
        }else{
          cronRule = `0 0 */${num} * *`;
        }
        break;
      default:
        throw new Error('Unhandled timeframe');
    }
    const onTick =()=>{
      const eventName = 'TIME/'+timeframe;
      const payload = {
        timestamp: moment.utc().startOf('second').toISOString(),
        timeframe
      }
      this.emit(eventName, {type:eventName, payload})
      this.emit('TIME/*', {type:eventName, payload})
    };
    const onComplete = null;
    const start = false;
    const utcOffset = moment().utcOffset();
    const job = new CronJob(cronRule, onTick, onComplete, start, null, null, null, utcOffset);
    this.jobList.push(job);
    job.start();
    this.emit('SUBSCRIPTIONS', {type:'SUBSCRIBED', payload:{timeframe}});
  }
  unsubscribeAll(){
    this.jobList.forEach((job)=>{
      job.stop();
    });
    this.jobList = [];
  }
};
module.exports = Kronos;
