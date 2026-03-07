import * as React from "react";
import { supabase } from "../../../services/supabase/client";
import {
  getReviewsForSpot,
  getSpotReviewStats,
} from "../../../services/api/spotReviews";
import type { SpotReview, SpotReviewStats } from "../../../services/api/spotReviews";

export function useSpotReviews(spotId: string) {
  const [reviews, setReviews] = React.useState<SpotReview[]>([]);
  const [currentUserId, setCurrentUserId] = React.useState<string | null>(null);
  const [stats, setStats] = React.useState<SpotReviewStats | null>(null);
  const [loading, setLoading] = React.useState(true);

  const loadedForRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data.user?.id ?? null);
    });
  }, []);

  const load = React.useCallback(
    async (force = false) => {
      if (!force && loadedForRef.current === spotId) return;
      try {
        setLoading(true);
        const [all, reviewStats] = await Promise.all([
          getReviewsForSpot(spotId),
          getSpotReviewStats(spotId),
        ]);
        setReviews(all);
        setStats(reviewStats);
        loadedForRef.current = spotId;
      } catch (e) {
        console.error("[useSpotReviews] load error:", e);
      } finally {
        setLoading(false);
      }
    },
    [spotId]
  );

  React.useEffect(() => {
    void load();
  }, [load]);

  return {
    reviews,
    currentUserId,
    stats,
    loading,
    refresh: () => load(true),
  };
}
