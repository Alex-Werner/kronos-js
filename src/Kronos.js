const EventEmitter = require('eventemitter2').EventEmitter2;
const {CronJob} = require('cron');
const moment = require('moment');

class Kronos extends EventEmitter {
  constructor(){
    super({
      wildcard: true,
      delimiter:'/',
    });

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
      const payload = {
        timestamp: moment.utc().startOf('second').toISOString(),
        timeframe
      }
      this.emit('TIME/'+timeframe, {type:'TIME/'+timeframe, payload})
    };
    const onComplete = null;
    const start = false;
    const utcOffset = moment().utcOffset();
    const job = new CronJob(cronRule, onTick, onComplete, start, null, null, null, utcOffset);
    this.jobList.push(job);
    job.start();
    console.log('Subscribed ', timeframe);
  }
  unsubscribeAll(){
    this.jobList.forEach((job)=>{
      job.stop();
    });
    this.jobList = [];
  }
};
module.exports = Kronos;
