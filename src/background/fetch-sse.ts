import { createParser } from "eventsource-parser";
import { streamAsyncIterable } from "./stream-async-iterable.js";

export async function fetchSSE(
  resource: string,
  options: RequestInit & { onMessage: (message: string) => void }
) {
  const { onMessage, ...fetchOptions } = options;
  const resp = await fetch(resource, fetchOptions);
  if (!resp.ok) {
    const detail = (await resp.json().catch(() => ({}))).detail;
    throw new Error(detail || `${resp.status} ${resp.statusText}`);
  }
  const parser = createParser((event) => {
    if (event.type === "event") {
      onMessage(event.data);
    }
  });
  for await (const chunk of streamAsyncIterable(resp.body!)) {
    const str = new TextDecoder().decode(chunk);
    parser.feed(str);
  }
}
