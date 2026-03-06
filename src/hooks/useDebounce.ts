'use client';

import { useEffect, useState } from 'react';

/**
 * Debounces a value by the specified delay in milliseconds.
 * Returns the debounced value, which only updates after the
 * input value has stopped changing for the given delay period.
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
