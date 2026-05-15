'use client';

import { useState, useEffect } from 'react';

/**
 * Debounces a value by a given delay in milliseconds.
 *
 * Returns the previous value until `delay` ms have passed without
 * the value changing. Useful for delaying API calls on filter changes.
 *
 * @example
 * const debouncedQuery = useDebounce(query, 300);
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
