type Callback<T = any> = (payload?: T) => void;

const listeners: Record<string, Set<Callback>> = {};

export function on<T = any>(event: string, cb: Callback<T>): () => void {
  if (!listeners[event]) listeners[event] = new Set();
  listeners[event].add(cb as Callback);
  return () => {
    listeners[event]?.delete(cb as Callback);
  };
}

export function emit<T = any>(event: string, payload?: T): void {
  const set = listeners[event];
  if (!set || set.size === 0) return;
  for (const cb of Array.from(set)) {
    try {
      cb(payload);
    } catch {}
  }
}

