'use client';

import { useState, useReducer, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import type {
  FilterState,
  FilterAction,
  HotelSearchResult,
  Brand,
  ResultsState,
  PaginationInfo,
} from '@/lib/types/search';
import { searchHotels, getEnvironment, type EnvironmentResponse } from '@/lib/api/search';
import { useDebounce } from './useDebounce';

// ── Initial Filter State ──

const initialFilterState: FilterState = {
  vacation_rentals: false,
  hotel_classes: [],
  property_types: [],
  amenities: [],
  brands: [],
  free_cancellation: false,
  special_offers: false,
  eco_certified: false,
  applied: true,
};

// ── Filter Reducer ──

function filterReducer(state: FilterState, action: FilterAction): FilterState {
  const markDirty = { applied: false };

  switch (action.type) {
    case 'SET_PRICE_RANGE':
      return { ...state, min_price: action.min, max_price: action.max, ...markDirty };

    case 'SET_RATING':
      return {
        ...state,
        rating: action.value !== null ? action.value : undefined,
        ...markDirty,
      };

    case 'TOGGLE_HOTEL_CLASS':
      return {
        ...state,
        hotel_classes: state.hotel_classes.includes(action.value)
          ? state.hotel_classes.filter((v) => v !== action.value)
          : [...state.hotel_classes, action.value],
        ...markDirty,
      };

    case 'TOGGLE_PROPERTY_TYPE':
      return {
        ...state,
        property_types: state.property_types.includes(action.value)
          ? state.property_types.filter((v) => v !== action.value)
          : [...state.property_types, action.value],
        ...markDirty,
      };

    case 'TOGGLE_AMENITY':
      return {
        ...state,
        amenities: state.amenities.includes(action.value)
          ? state.amenities.filter((v) => v !== action.value)
          : [...state.amenities, action.value],
        ...markDirty,
      };

    case 'SET_SORT':
      return {
        ...state,
        sort_by: action.value !== null ? action.value : undefined,
        ...markDirty,
      };

    case 'TOGGLE_FREE_CANCEL':
      return { ...state, free_cancellation: !state.free_cancellation, ...markDirty };

    case 'TOGGLE_VACATION_RENTALS':
      // Switching mode resets hotel/VR-specific filters to avoid conflicts
      return {
        ...state,
        vacation_rentals: !state.vacation_rentals,
        hotel_classes: [],
        property_types: [],
        amenities: [],
        bedrooms: undefined,
        bathrooms: undefined,
        ...markDirty,
      };

    case 'SET_BEDROOMS':
      return { ...state, bedrooms: action.value, ...markDirty };

    case 'SET_BATHROOMS':
      return { ...state, bathrooms: action.value, ...markDirty };

    case 'TOGGLE_SPECIAL_OFFERS':
      return { ...state, special_offers: !state.special_offers, ...markDirty };

    case 'TOGGLE_ECO_CERTIFIED':
      return { ...state, eco_certified: !state.eco_certified, ...markDirty };

    case 'SET_BRANDS':
      return { ...state, brands: action.value, ...markDirty };

    case 'RESET_FILTERS':
      return initialFilterState;

    case 'APPLY_FILTERS':
      return { ...state, applied: true };

    default:
      return state;
  }
}

// ── Filter fingerprint for debounced auto-search ──

function filterFingerprint(fs: FilterState): string {
  return JSON.stringify({
    vr: fs.vacation_rentals,
    min: fs.min_price ?? null,
    max: fs.max_price ?? null,
    rating: fs.rating ?? null,
    classes: [...fs.hotel_classes].sort(),
    types: [...fs.property_types].sort(),
    amenities: [...fs.amenities].sort(),
    bedrooms: fs.bedrooms ?? null,
    bathrooms: fs.bathrooms ?? null,
    sort: fs.sort_by ?? null,
    fc: fs.free_cancellation,
    sp: fs.special_offers,
    eco: fs.eco_certified,
    brands: [...fs.brands].sort(),
  });
}

// ── Return type ──

export interface UseHotelSearchReturn {
  // Search bar state (URL-synced)
  query: string;
  setQuery: (q: string) => void;
  checkIn: string;
  setCheckIn: (d: string) => void;
  checkOut: string;
  setCheckOut: (d: string) => void;
  adults: number;
  setAdults: (n: number) => void;
  children: number;
  setChildren: (n: number) => void;
  childrenAges: number[];
  setChildrenAges: (ages: number[]) => void;

  // Filter state (local, not in URL)
  filters: FilterState;
  filterDispatch: (action: FilterAction) => void;
  resetFilters: () => void;
  applyFilters: () => void;
  activeFilterCount: number;

  // Results state
  results: HotelSearchResult[];
  totalCount: number;
  searchStatus: 'idle' | 'loading' | 'success' | 'error';
  resultsState: 'matching' | 'non_matching_only' | null;
  brands: Brand[];

  // Environment (city + weather from GET /v1/environment)
  environment: { city: string; temp: number; description: string; iconUrl: string } | null;

  // Error state
  error: { code: string; message: string; retryAfter?: number } | null;

  // Pagination
  hasMore: boolean;
  loadMore: () => void;
  isLoadingMore: boolean;

  // Actions
  search: () => Promise<void>;
}

// ── Hook ──

export function useHotelSearch(): UseHotelSearchReturn {
  const searchParams = useSearchParams();
  const router = useRouter();

  // ── Search bar state (hydrated from URL) ──
  const [query, setQueryState] = useState(searchParams.get('query') || '');
  const [checkIn, setCheckInState] = useState(searchParams.get('check_in') || '');
  const [checkOut, setCheckOutState] = useState(searchParams.get('check_out') || '');
  const [adults, setAdultsState] = useState(
    Number(searchParams.get('adults')) || 2
  );
  const [children, setChildrenState] = useState(
    Number(searchParams.get('children')) || 0
  );
  const [childrenAges, setChildrenAgesState] = useState<number[]>(() => {
    const raw = searchParams.get('children_ages');
    return raw
      ? raw.split(',').map(Number).filter((n) => !isNaN(n) && n >= 1 && n <= 17)
      : [];
  });

  // ── Filter state ──
  const [filters, filterDispatch] = useReducer(filterReducer, initialFilterState);

  // ── Results state ──
  const [results, setResults] = useState<HotelSearchResult[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [searchStatus, setSearchStatus] = useState<
    'idle' | 'loading' | 'success' | 'error'
  >('idle');
  const [resultsState, setResultsState] = useState<ResultsState | null>(null);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [error, setError] = useState<UseHotelSearchReturn['error']>(null);

  // ── Environment defaults (gl/hl/currency from GET /v1/environment) ──
  const [gl, setGl] = useState('');
  const [hl, setHl] = useState('');
  const [currency, setCurrency] = useState('');

  // ── Environment data exposed for UI (city + weather) ──
  const [environment, setEnvironment] = useState<{
    city: string;
    temp: number;
    description: string;
    iconUrl: string;
  } | null>(null);

  useEffect(() => {
    const CACHE_KEY = 'proactrip_env';
    const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

    // Try localStorage cache first
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed: { gl: string; hl: string; currency: string; ts: number } =
          JSON.parse(cached);
        if (Date.now() - parsed.ts < CACHE_TTL_MS) {
          setGl(parsed.gl);
          setHl(parsed.hl);
          setCurrency(parsed.currency);
          return; // cached values are fresh — skip network call
        }
      }
    } catch {
      // localStorage unavailable or corrupt — fetch fresh
    }

    // Fetch fresh environment data
    let cancelled = false;
    getEnvironment()
      .then((env: EnvironmentResponse) => {
        if (cancelled) return;
        const glVal = env.location.country_code || '';
        const hlVal = env.location.language || '';
        const currencyVal = env.location.currency || '';
        setGl(glVal);
        setHl(hlVal);
        setCurrency(currencyVal);

        // Save environment data for UI (WeatherWidget, hero subtitle)
        const city = env.location.city || '';
        if (env.weather) {
          setEnvironment({
            city,
            temp: env.weather.temp,
            description: env.weather.description,
            iconUrl: env.weather.icon_url,
          });
        } else {
          setEnvironment(city ? { city, temp: 0, description: '', iconUrl: '' } : null);
        }

        // Cache in localStorage
        try {
          localStorage.setItem(
            CACHE_KEY,
            JSON.stringify({
              gl: glVal,
              hl: hlVal,
              currency: currencyVal,
              ts: Date.now(),
            })
          );
        } catch {
          // quota exceeded — silently skip caching
        }
      })
      .catch(() => {
        // Environment fetch failed — leave defaults empty; API uses its own fallbacks
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // ── Pagination ──
  const [nextToken, setNextToken] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const visitedTokensRef = useRef<string[]>([]);

  // ── Search function ──
  const search = useCallback(
    async (pageToken?: string) => {
      // Validate
      if (!query.trim()) return;
      if (!checkIn || !checkOut) return;

      const isLoadMore = !!pageToken;

      setSearchStatus(isLoadMore ? 'success' : 'loading'); // keep success during load-more
      if (isLoadMore) {
        setIsLoadingMore(true);
      } else {
        setError(null);
        setResults([]);
      }

      try {
        const response = await searchHotels({
          query: query.trim(),
          check_in_date: checkIn,
          check_out_date: checkOut,
          adults,
          children: children > 0 ? children : undefined,
          children_ages: children > 0 && childrenAges.length > 0 ? childrenAges : undefined,
          gl: gl || undefined,
          hl: hl || undefined,
          currency: currency || undefined,
          vacation_rentals: filters.vacation_rentals,
          min_price: filters.min_price,
          max_price: filters.max_price,
          rating: filters.rating,
          property_types: filters.property_types.length > 0 ? filters.property_types : undefined,
          amenities: filters.amenities.length > 0 ? filters.amenities : undefined,
          hotel_classes: filters.hotel_classes.length > 0 ? filters.hotel_classes : undefined,
          brands: filters.brands.length > 0 ? filters.brands : undefined,
          bedrooms: filters.vacation_rentals ? filters.bedrooms : undefined,
          bathrooms: filters.vacation_rentals ? filters.bathrooms : undefined,
          sort_by: filters.sort_by,
          free_cancellation: filters.free_cancellation ? true : undefined,
          special_offers: filters.special_offers ? true : undefined,
          eco_certified: filters.eco_certified ? true : undefined,
          page_token: pageToken,
        });

        if (isLoadMore && pageToken) {
          // Deduplicate by id — API pagination may return overlapping results
          setResults((prev) => {
            const seen = new Set(prev.map((p) => p.id));
            const newOnes = response.properties.filter((p) => !seen.has(p.id));
            return [...prev, ...newOnes];
          });
          visitedTokensRef.current = [...visitedTokensRef.current, pageToken];
        } else {
          setResults(response.properties);
          setTotalCount(response.properties.length);
          visitedTokensRef.current = pageToken ? [pageToken] : [];
        }

        setResultsState(response.results_state);
        setBrands(response.brands || []);

        // Pagination
        setNextToken(response.pagination.next_token);
        setHasMore(response.pagination.has_more);
        setSearchStatus('success');

        // Mark filters as applied
        filterDispatch({ type: 'APPLY_FILTERS' });
      } catch (err: unknown) {
        setSearchStatus('error');
        const apiError = err as {
          code?: string;
          message?: string;
          retryAfter?: number;
        };
        setError({
          code: apiError.code || 'INTERNAL_ERROR',
          message:
            apiError.message || 'Ocurrió un error inesperado. Intentá de nuevo.',
          retryAfter: apiError.retryAfter,
        });
      } finally {
        if (isLoadMore) {
          setIsLoadingMore(false);
        }
      }
    },
    [query, checkIn, checkOut, adults, children, childrenAges, filters, gl, hl, currency]
  );

  // ── Load more ──
  const loadMore = useCallback(() => {
    if (!nextToken || isLoadingMore) return;
    search(nextToken);
  }, [nextToken, isLoadingMore, search]);

  // ── URL sync on search bar changes ──
  // Deliberately NOT syncing filter state to URL per design §3
  const updateURL = useCallback(() => {
    const params = new URLSearchParams();
    if (query) params.set('query', query);
    if (checkIn) params.set('check_in', checkIn);
    if (checkOut) params.set('check_out', checkOut);
    if (adults !== 2) params.set('adults', String(adults));
    if (children > 0) {
      params.set('children', String(children));
      if (childrenAges.length > 0) {
        params.set('children_ages', childrenAges.join(','));
      }
    }
    const qs = params.toString();
    router.replace(qs ? `/hotels?${qs}` : '/hotels', { scroll: false });
  }, [query, checkIn, checkOut, adults, children, childrenAges, router]);

  // ── Active filter count ──
  const activeFilterCount =
    (filters.min_price !== undefined ? 1 : 0) +
    (filters.max_price !== undefined ? 1 : 0) +
    (filters.rating !== undefined ? 1 : 0) +
    filters.hotel_classes.length +
    filters.property_types.length +
    filters.amenities.length +
    (filters.bedrooms !== undefined ? 1 : 0) +
    (filters.bathrooms !== undefined ? 1 : 0) +
    (filters.sort_by !== undefined ? 1 : 0) +
    (filters.free_cancellation ? 1 : 0) +
    (filters.special_offers ? 1 : 0) +
    (filters.eco_certified ? 1 : 0) +
    filters.brands.length;

  // ── Apply filters explicitly ──
  const applyFilters = useCallback(() => {
    filterDispatch({ type: 'APPLY_FILTERS' });
    search();
  }, [search]);

  // ── Reset filters ──
  const resetFilters = useCallback(() => {
    filterDispatch({ type: 'RESET_FILTERS' });
  }, []);

  // ── Debounced auto-search on filter changes ──
  const fingerprint = filterFingerprint(filters);
  const debouncedFingerprint = useDebounce(fingerprint, 600);
  const hasSearchedRef = useRef(false);

  useEffect(() => {
    // Don't auto-search until the user has performed an initial search
    if (!hasSearchedRef.current) return;

    // Only auto-search if we're currently in a success state (don't spam during error/loading)
    if (searchStatus === 'success' || searchStatus === 'error') {
      search();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedFingerprint]);

  // ── Wrapped search with URL sync ──
  const searchWithURL = useCallback(async () => {
    updateURL();
    hasSearchedRef.current = true;
    await search();
  }, [updateURL, search]);

  // ── Setters that also update URL on search ──
  const setQuery = useCallback((q: string) => {
    setQueryState(q);
  }, []);

  const setCheckIn = useCallback((d: string) => {
    setCheckInState(d);
  }, []);

  const setCheckOut = useCallback((d: string) => {
    setCheckOutState(d);
  }, []);

  const setAdults = useCallback((n: number) => {
    setAdultsState(n);
  }, []);

  const setChildren = useCallback((n: number) => {
    setChildrenState(n);
    // Reset ages if children decreases
    setChildrenAgesState((prev) => (n < prev.length ? prev.slice(0, n) : prev));
  }, []);

  const setChildrenAges = useCallback((ages: number[]) => {
    setChildrenAgesState(ages);
  }, []);

  return {
    // Search bar
    query,
    setQuery,
    checkIn,
    setCheckIn,
    checkOut,
    setCheckOut,
    adults,
    setAdults,
    children,
    setChildren,
    childrenAges,
    setChildrenAges,

    // Filters
    filters,
    filterDispatch,
    resetFilters,
    applyFilters,
    activeFilterCount,

    // Results
    results,
    totalCount,
    searchStatus,
    resultsState,
    brands,

    // Environment
    environment,

    // Error
    error,

    // Pagination
    hasMore,
    loadMore,
    isLoadingMore,

    // Actions
    search: searchWithURL,
  };
}
