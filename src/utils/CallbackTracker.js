class CallbackTracker {
  constructor() {
    this.calls = [];
    this.callCount = 0;
  }

  track() {
    return (...args) => {
      this.callCount++;
      this.calls.push({
        timestamp: new Date(),
        args: args,
      });
    };
  }

  waitForCalls(expectedCount, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const checkInterval = setInterval(() => {
        if (this.callCount >= expectedCount) {
          clearInterval(checkInterval);
          resolve(this.calls);
        } else if (Date.now() - startTime > timeout) {
          clearInterval(checkInterval);
          reject(
            new Error(
              `Timeout: Expected ${expectedCount} calls, got ${this.callCount}`
            )
          );
        }
      }, 10);
    });
  }

  reset() {
    this.calls = [];
    this.callCount = 0;
  }
}

export default CallbackTracker;
