// Hook for safely detecting when the Zustand persist store has hydrated.
import { useSyncExternalStore } from 'react';
import { useUserStore } from './user-store';

const emptySubscribe = () => () => {};

export function useHydrated(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => useUserStore.persist.hasHydrated(),
    () => false
  );
}
