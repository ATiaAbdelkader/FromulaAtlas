'use client';

import { useEffect, useState } from 'react';
import {
  subscribeToBridge,
  clearBridgePayload,
  peekBridgePayload,
  type BridgePayload,
} from './tool-bridge';

/**
 * React hook that returns the most recent bridge payload sent to the given
 * target tool, or `null` if none.
 *
 * The payload is "read once": after the hook delivers it (or finds a pending
 * one in `localStorage` from another tab), it clears `localStorage` so a
 * re-mount doesn't re-fire the consumer's effect. The consumer is expected to
 * capture the payload in its own `useEffect([payload])` and apply the values
 * to local state — see the Send-to bridge docs in `tool-bridge.ts`.
 *
 * The returned `payload` reference stays stable between renders (React keeps
 * the same state value), so a `useEffect` with `[payload]` as a dependency
 * will only fire once per payload arrival.
 */
export function useBridgePayload(targetToolId: string): BridgePayload | null {
  const [payload, setPayload] = useState<BridgePayload | null>(null);

  useEffect(() => {
    // On mount: check `localStorage` for a pending payload delivered while
    // this tool wasn't mounted (e.g. sent from another tab, or before the
    // user opened the dialog).
    const pending = peekBridgePayload();
    if (pending && pending.targetToolId === targetToolId) {
      setPayload(pending);
      clearBridgePayload();
    }

    // Subscribe to future payloads from same-tab (CustomEvent) and cross-tab
    // (storage event) senders.
    const unsub = subscribeToBridge(targetToolId, (p) => {
      setPayload(p);
      // Consume: clear so re-mounts don't replay the banner.
      clearBridgePayload();
    });

    return unsub;
  }, [targetToolId]);

  return payload;
}
