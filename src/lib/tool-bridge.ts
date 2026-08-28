/**
 * Inter-tool "Send to" bridge for NutriPlant PRO free-tools.
 *
 * A lightweight pub/sub that lets one tool push computed values into another
 * tool's input fields. Built on a `CustomEvent` (same tab, instant) plus a
 * `storage` event (cross-tab), with `localStorage` as the shared queue so a
 * payload sent before the target tool mounts is still picked up when it does.
 *
 * Values are restricted to numbers and strings — no nested objects — to keep
 * the contract dead simple and serializable.
 */

export interface BridgePayload {
  /** Tool ID of the receiver (matches `ToolMeta.id`). */
  targetToolId: string;
  /** Tool ID of the sender (matches `ToolMeta.id`). */
  sourceToolId: string;
  /** Field name → value mapping the receiver knows how to interpret. */
  values: Record<string, number | string>;
  /** Epoch milliseconds when the payload was sent. */
  timestamp: number;
}

const BRIDGE_EVENT = 'nutriplant-tool-bridge';
const BRIDGE_LS_KEY = 'nutriplant_tool_bridge_v1';

/**
 * Subscribe to bridge messages targeted at `targetToolId`.
 * Returns an unsubscribe function.
 *
 * Listens on both:
 *  - `window` `CustomEvent` (same-tab, dispatched by `sendToBridge`)
 *  - `window` `storage` event (cross-tab, fired when another tab writes to LS)
 */
export function subscribeToBridge(
  targetToolId: string,
  handler: (payload: BridgePayload) => void,
): () => void {
  if (typeof window === 'undefined') return () => {};

  const onCustom = (e: Event) => {
    const detail = (e as CustomEvent<BridgePayload>).detail;
    if (detail && detail.targetToolId === targetToolId) {
      handler(detail);
    }
  };

  const onStorage = (e: StorageEvent) => {
    if (e.key !== BRIDGE_LS_KEY) return;
    if (!e.newValue) return;
    try {
      const p = JSON.parse(e.newValue) as BridgePayload;
      if (p && p.targetToolId === targetToolId) handler(p);
    } catch {
      /* corrupt payload — ignore */
    }
  };

  window.addEventListener(BRIDGE_EVENT, onCustom as EventListener);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(BRIDGE_EVENT, onCustom as EventListener);
    window.removeEventListener('storage', onStorage);
  };
}

/**
 * Send a payload to a target tool. Stamps the timestamp and broadcasts it:
 *  - writes to `localStorage` (so other tabs + late-mounting targets see it)
 *  - dispatches a `CustomEvent` on `window` (same tab, instant)
 */
export function sendToBridge(payload: Omit<BridgePayload, 'timestamp'>): void {
  if (typeof window === 'undefined') return;
  const full: BridgePayload = { ...payload, timestamp: Date.now() };
  try {
    localStorage.setItem(BRIDGE_LS_KEY, JSON.stringify(full));
  } catch {
    /* storage full or blocked — same-tab dispatch still works */
  }
  window.dispatchEvent(new CustomEvent(BRIDGE_EVENT, { detail: full }));
}

/**
 * Clear any pending bridge payload from `localStorage`. Called by the hook
 * after a payload has been delivered so that re-mounting the target tool
 * doesn't re-fire the banner.
 */
export function clearBridgePayload(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(BRIDGE_LS_KEY);
  } catch {
    /* ignore */
  }
}

/** Peek at the pending payload in `localStorage` (if any), without consuming. */
export function peekBridgePayload(): BridgePayload | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(BRIDGE_LS_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as BridgePayload;
  } catch {
    return null;
  }
}
