import { useState, useEffect, useCallback } from 'react';
import { dataStore } from '../store/dataStore';

export function useStore() {
  const [, setTick] = useState(0);

  useEffect(() => {
    const unsub = dataStore.subscribe(() => setTick(t => t + 1));
    return () => { unsub(); };
  }, []);

  return dataStore;
}

export function useForceUpdate() {
  const [, setTick] = useState(0);
  return useCallback(() => setTick(t => t + 1), []);
}
