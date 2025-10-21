class EventCollector {
    constructor() {
      this.events = [];
    }
  
    collect() {
      return (event) => {
        this.events.push({
          ...event,
          receivedAt: new Date()
        });
      };
    }
  
    waitForEvents(count, timeout = 5000) {
      return new Promise((resolve, reject) => {
        const startTime = Date.now();
        const checkInterval = setInterval(() => {
          if (this.events.length >= count) {
            clearInterval(checkInterval);
            resolve(this.events);
          } else if (Date.now() - startTime > timeout) {
            clearInterval(checkInterval);
            reject(new Error(`Timeout: Expected ${count} events, got ${this.events.length}`));
          }
        }, 10);
      });
    }
  
    getEventsByType(type) {
      return this.events.filter(e => e.type === type);
    }
  
    reset() {
      this.events = [];
    }
  
    get count() {
      return this.events.length;
    }
  }

export default EventCollector;