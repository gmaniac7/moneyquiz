export class Timer {
  constructor(callback: () => any, delay: number) {
    this.callback = callback
    this.delay = delay;
    this.start = new Date();

    this.timerId = setTimeout(this.callback, this.delay);

    this.remaining = delay;
  }

  private callback: () => any;
  private delay: number;
  private start: Date;
  private timerId: any;
  private remaining: number;

  pause() {
    clearTimeout(this.timerId);
    this.remaining -= (new Date().getTime() - this.start.getTime());
  }

  resume() {
    this.start = new Date();
    this.timerId = setTimeout(this.callback, this.remaining);
  }
}
