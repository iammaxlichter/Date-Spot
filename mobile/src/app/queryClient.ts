import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is considered fresh for 30 seconds. Re-focusing a screen within
      // that window shows cached data instantly with no network request.
      staleTime: 30_000,
      // Keep inactive queries in memory for 5 minutes (e.g. after navigating away).
      gcTime: 5 * 60_000,
      // One retry on transient network errors; avoids cascading failure loops.
      retry: 1,
    },
  },
});
