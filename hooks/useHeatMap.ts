import { useState, useEffect, useCallback } from 'react';
import { createHeatMapService, getLastNDaysBoundaries, HeatMapDay, HeatMapStats } from '../services/database/heatMapService';

export const useHeatMap = (userId: string | null, days: number = 14) => {
    const [heatMapData, setHeatMapData] = useState<HeatMapDay[]>([]);
    const [stats, setStats] = useState<HeatMapStats>({
        totalDays: 0,
        activeDays: 0,
        completeDays: 0,
        perfectDays: 0,
        restDays: 0,
        currentStreak: 0,
        longestStreak: 0,
    });
    const [isLoading, setIsLoading] = useState(true);

    const fetchHeatMapData = useCallback(async () => {
        if (!userId) {
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);
            const heatMapService = createHeatMapService(userId);
            const { startDate, endDate } = getLastNDaysBoundaries(days);
            
            const [data, statsData] = await Promise.all([
                heatMapService.getHeatMapData(startDate, endDate),
                heatMapService.getHeatMapStats(startDate, endDate),
            ]);

            setHeatMapData(data);
            setStats(statsData);
        } catch (error) {
            console.error('Error fetching heat map data:', error);
        } finally {
            setIsLoading(false);
        }
    }, [userId, days]);

    useEffect(() => {
        fetchHeatMapData();
    }, [fetchHeatMapData]);

    const markRestDay = useCallback(async (date: string) => {
        if (!userId) return;
        const heatMapService = createHeatMapService(userId);
        await heatMapService.markRestDay(date);
        await fetchHeatMapData();
    }, [userId, fetchHeatMapData]);

    const unmarkRestDay = useCallback(async (date: string) => {
        if (!userId) return;
        const heatMapService = createHeatMapService(userId);
        await heatMapService.unmarkRestDay(date);
        await fetchHeatMapData();
    }, [userId, fetchHeatMapData]);

    const refreshHeatMap = useCallback(() => {
        fetchHeatMapData();
    }, [fetchHeatMapData]);

    return {
        heatMapData,
        stats,
        isLoading,
        markRestDay,
        unmarkRestDay,
        refreshHeatMap,
    };
};
