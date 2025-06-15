import { Area, areasService } from '@/src/api';
import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';

interface UseAreasDataReturn {
  areas: Area[];
  loading: boolean;
  error: string | null;
  loadAreas: (forceRefresh?: boolean) => Promise<void>;
  refreshAreas: () => Promise<void>;
  lastLoaded: number;
}

const CACHE_DURATION = 30000; // 30 seconds

export const useAreasData = (): UseAreasDataReturn => {
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastLoaded, setLastLoaded] = useState<number>(0);

  const loadAreas = useCallback(async (forceRefresh: boolean = false) => {
    try {
      const now = Date.now();
      
      // Skip loading if data is fresh and not forced refresh
      if (!forceRefresh && areas.length > 0 && (now - lastLoaded) < CACHE_DURATION) {
        console.log("📦 Using cached areas data");
        return;
      }

      console.log("🔄 Loading areas from API");
      setLoading(true);
      setError(null);
      
      const areasData = await areasService.getAreas();

      console.log("🏢 Areas data received:", areasData.length, "areas");
      setAreas(areasData);
      setLastLoaded(now);
    } catch (err: any) {
      console.error("❌ Error loading areas:", err);
      const errorMessage = err.message || "Không thể tải danh sách khu vực";
      setError(errorMessage);
      
      // Only show alert if this is a user-initiated action (forceRefresh)
      if (forceRefresh) {
        Alert.alert("Lỗi", `${errorMessage}. Vui lòng thử lại.`, [
          { text: "OK" },
        ]);
      }
    } finally {
      setLoading(false);
    }
  }, [areas.length, lastLoaded]);

  const refreshAreas = useCallback(async () => {
    await loadAreas(true);
  }, [loadAreas]);

  // Initial load
  useEffect(() => {
    loadAreas();
  }, []);

  return {
    areas,
    loading,
    error,
    loadAreas,
    refreshAreas,
    lastLoaded,
  };
}; 