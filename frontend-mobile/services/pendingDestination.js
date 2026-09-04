let pending = null;
const listeners = new Set();

export function setPendingDestination(resolved) {
    pending = resolved;
    listeners.forEach((fn) => {
        try {
            fn(resolved);
        } catch (e) {
            console.warn('[pendingDestination] listener', e);
        }
    });
}

export function consumePendingDestination() {
    const value = pending;
    pending = null;
    return value;
}

export function peekPendingDestination() {
    return pending;
}

export function clearPendingDestination() {
    pending = null;
}

export function subscribePendingDestination(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
}
