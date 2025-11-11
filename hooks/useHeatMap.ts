import { useState, useEffect, useCallback } from 'react';
import { useUserServices } from './useUserServices';
import { getLastNDaysBoundaries, HeatMapDay, HeatMapStats } from '../services/database/heatMapService';

export const useHeatMap = (days: number = 14) => {
    const { heatMapService } = useUserServices();
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
        try {
            setIsLoading(true);
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
    }, [heatMapService, days]);

    useEffect(() => {
        fetchHeatMapData();
    }, [fetchHeatMapData]);

    const markRestDay = useCallback(async (date: string) => {
        await heatMapService.markRestDay(date);
        await fetchHeatMapData();
    }, [heatMapService, fetchHeatMapData]);

    const unmarkRestDay = useCallback(async (date: string) => {
        await heatMapService.unmarkRestDay(date);
        await fetchHeatMapData();
    }, [heatMapService, fetchHeatMapData]);

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
