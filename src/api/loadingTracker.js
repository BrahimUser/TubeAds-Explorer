let pendingCount = 0;
const listeners = new Set();

function notify() {
  listeners.forEach((listener) => {
    listener(pendingCount);
  });
}

export function getPendingRequestCount() {
  return pendingCount;
}

export function subscribeLoading(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function startLoading() {
  pendingCount += 1;
  notify();
}

export function endLoading() {
  if (pendingCount > 0) {
    pendingCount -= 1;
  }
  notify();
}
