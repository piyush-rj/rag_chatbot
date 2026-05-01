import type { Response } from "express";
import { STREAM_EVENT_TYPE, type StreamEvent } from "shared";

export default class SseWriter {
  private closed = false;

  constructor(private res: Response) {
    res.setHeader("Content-Type", "text/event-stream"); // tells browser this is a stream
    res.setHeader("Cache-Control", "no-cache"); // dont cache it
    res.setHeader("Connection", "keep-alive"); // dont close after one response
    res.flushHeaders(); // send headers rn

    // detects if user disconnects
    res.on("close", () => {
      this.closed = true;
    });
  }

  public get isClosed() {
    return this.closed;
  }

  public send(event: StreamEvent) {
    if (this.closed) return;
    this.res.write(`data: ${JSON.stringify(event)}\n\n`);
  }

  public end() {
    if (this.closed) return;
    this.send({ type: STREAM_EVENT_TYPE.DONE });
    this.res.end();
  }
}
