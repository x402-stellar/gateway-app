export class NonceSequencer {
  private queue: Array<() => Promise<any>> = [];
  private processing = false;

  public async enqueue<T>(task: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await task();
          resolve(result);
        } catch (err) {
          reject(err);
        }
      });
      this.processNext();
    });
  }

  private async processNext() {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;
    const currentTask = this.queue.shift();

    if (currentTask) {
      try {
        await currentTask();
      } finally {
        this.processing = false;
        this.processNext();
      }
    } else {
      this.processing = false;
    }
  }

  public get pendingCount(): number {
    return this.queue.length;
  }
}
