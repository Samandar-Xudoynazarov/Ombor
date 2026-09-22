'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from './api';

// Oddiy ma'lumot yuklash hook'i: const { data, loading, error, reload } = useApi('/products', { search })
export function useApi(path, params, { skip = false } = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(!skip);
  const [error, setError] = useState(null);
  const key = path + JSON.stringify(params || {});
  const reqId = useRef(0);

  const load = useCallback(async () => {
    if (skip || !path) return;
    const id = ++reqId.current;
    setLoading(true);
    setError(null);
    try {
      const d = await api.get(path, params);
      if (id === reqId.current) setData(d);
    } catch (e) {
      if (id === reqId.current) setError(e);
    } finally {
      if (id === reqId.current) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, skip]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, setData, loading, error, reload: load };
}

export function useDebounced(value, ms = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}
