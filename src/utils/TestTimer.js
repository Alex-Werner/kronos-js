class TestTimer {
  constructor() {
    this.callbacks = [];
    this.currentTime = Date.now();
  }

  advance(ms) {
    this.currentTime += ms;
  }

  wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export default TestTimer;
