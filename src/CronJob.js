class CronJob {
    constructor(cronRule, onTick, onComplete = null, start = false) {
        this.cronRule = cronRule;
        this.onTick = onTick;
        this.onComplete = onComplete;
        this.isRunning = false;
        this.timeout = null;
    
        if (start) {
          this.start();
        }
      }
    
      start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this._scheduleNext();
      }
    
      stop() {
        this.isRunning = false;
        if (this.timeout) {
          clearTimeout(this.timeout);
          this.timeout = null;
        }
        if (this.onComplete) {
          this.onComplete();
        }
      }
    
      _scheduleNext() {
        if (!this.isRunning) return;
    
        const now = Date.now();
        const next = this._getNextDate(new Date(now));
        const delay = Math.max(0, next.getTime() - now);
    
        this.timeout = setTimeout(() => {
          if (!this.isRunning) return;
          
          // Execute the callback
          if (this.onTick) {
            this.onTick();
          }
          
          // Immediately schedule the next execution to minimize drift
          this._scheduleNext();
        }, delay);
      }
    
      _getNextDate(from) {
        const parts = this.cronRule.trim().split(/\s+/);
        let [second, minute, hour, dayOfMonth, month, dayOfWeek] = parts;
    
        // Handle 5-part cron (no seconds)
        if (parts.length === 5) {
          dayOfWeek = month;
          month = dayOfMonth;
          dayOfMonth = hour;
          hour = minute;
          minute = second;
          second = '0';
        }
    
        const current = new Date(from.getTime());
        
        // Start from the CURRENT second if we're at millisecond 0
        // Otherwise start from the NEXT second
        if (current.getMilliseconds() === 0) {
          // We're exactly on a second boundary, check if current time matches
          if (
            this._matchField(current.getSeconds(), second, 0, 59) &&
            this._matchField(current.getMinutes(), minute, 0, 59) &&
            this._matchField(current.getHours(), hour, 0, 23) &&
            this._matchField(current.getDate(), dayOfMonth, 1, 31) &&
            this._matchField(current.getMonth() + 1, month, 1, 12) &&
            this._matchField(current.getDay(), dayOfWeek, 0, 6)
          ) {
            return current;
          }
        }
        
        // Start searching from next second
        current.setMilliseconds(0);
        current.setSeconds(current.getSeconds() + 1);
    
        // Safety limit: don't search more than 4 years
        const maxIterations = 4 * 365 * 24 * 60 * 60;
        let iterations = 0;
    
        while (iterations < maxIterations) {
          if (
            this._matchField(current.getSeconds(), second, 0, 59) &&
            this._matchField(current.getMinutes(), minute, 0, 59) &&
            this._matchField(current.getHours(), hour, 0, 23) &&
            this._matchField(current.getDate(), dayOfMonth, 1, 31) &&
            this._matchField(current.getMonth() + 1, month, 1, 12) &&
            this._matchField(current.getDay(), dayOfWeek, 0, 6)
          ) {
            return current;
          }
    
          current.setSeconds(current.getSeconds() + 1);
          iterations++;
        }
    
        throw new Error('Could not find next execution time');
      }
    
      _matchField(value, pattern, min, max) {
        // Wildcard
        if (pattern === '*') return true;
    
        // List (e.g., "1,2,3")
        if (pattern.includes(',')) {
          return pattern.split(',').some(p => this._matchField(value, p.trim(), min, max));
        }
    
        // Range with step (e.g., "*/5" or "1-10/2")
        if (pattern.includes('/')) {
          const [range, step] = pattern.split('/');
          const stepNum = parseInt(step, 10);
    
          if (range === '*') {
            return value % stepNum === 0;
          }
    
          if (range.includes('-')) {
            const [start, end] = range.split('-').map(n => parseInt(n, 10));
            if (value < start || value > end) return false;
            return (value - start) % stepNum === 0;
          }
        }
    
        // Range (e.g., "1-5")
        if (pattern.includes('-')) {
          const [start, end] = pattern.split('-').map(n => parseInt(n, 10));
          return value >= start && value <= end;
        }
    
        // Exact match
        return value === parseInt(pattern, 10);
      }
  }
  
  export { CronJob };
  export default CronJob;