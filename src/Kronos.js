import { EventEmitter } from 'events';
import { CronJob } from 'cron';
import moment from 'moment';

class Kronos extends EventEmitter {
  constructor() {
    super();
    this.jobList = {};
  }

  subscribe(timeframeOrCronString) {
    let cronRule;

    // Check if the input is a full cron string
    if (timeframeOrCronString.split(' ').length === 5 || timeframeOrCronString.split(' ').length === 6) {
      cronRule = timeframeOrCronString;
    } else {
      // Process the simple timeframe format
      const type = timeframeOrCronString.slice(-1);
      const num = timeframeOrCronString.substring(0, timeframeOrCronString.length - type.length);
      switch (type) {
        case 's':
          cronRule = `*/${num} * * * * *`;
          break;
        case 'm':
          cronRule = `*/${num} * * * *`;
          break;
        case 'h':
          cronRule = `0 */${num} * * *`;
          break;
        case 'd':
          cronRule = num === '1' ? `0 0 * * *` : `0 0 */${num} * *`;
          break;
        default:
          throw new Error('Invalid timeframe or cron string');
      }
    }

    const onTick = () => {
      const eventName = 'TIME/' + timeframeOrCronString;
      const payload = {
        timestamp: moment.utc().startOf('second').toISOString(),
        timeframe: timeframeOrCronString
      };
      this.emit(eventName, { type: eventName, payload });
      this.emit('TIME/*', { type: eventName, payload });
    };

    const onComplete = null;
    const start = false;
    const utcOffset = moment().utcOffset();
    const job = new CronJob(cronRule, onTick, onComplete, start, null, null, null, utcOffset);

    if (!this.jobList[timeframeOrCronString]) {
      this.jobList[timeframeOrCronString] = job;
    }
    this.jobList[timeframeOrCronString].start();
    this.emit('SUBSCRIPTIONS', { type: 'SUBSCRIBED', payload: { timeframe: timeframeOrCronString } });
  }

  unsubscribeAll() {
    Object.entries(this.jobList).forEach(([, job]) => {
      job.stop();
    });
    this.jobList = {};
  }
}

export default Kronos;
