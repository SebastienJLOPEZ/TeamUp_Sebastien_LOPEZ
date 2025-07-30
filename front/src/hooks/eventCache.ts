import { Event } from '../types/event';

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

interface CacheData {
    timestamp: number;
    eventList: Event[];
}

export const useEventCache = (type: string) => {
    const getCacheKey = () => `events_${type}`;

    const getStoredEvents = (): Event[] => {
        if (typeof window === 'undefined') return [];
        
        const cached = localStorage.getItem(getCacheKey());
        if (!cached) return [];

        const { timestamp, eventList } = JSON.parse(cached) as CacheData;
        
        // Check if the cache is still valid
        if (Date.now() - timestamp > CACHE_DURATION) {
            localStorage.removeItem(getCacheKey());
            return [];
        }

        return eventList;
    };

    const setStoredEvents = (eventList: Event[]) => {
        if (typeof window === 'undefined') return;
        
        const cacheData: CacheData = {
            timestamp: Date.now(),
            eventList
        };
        
        localStorage.setItem(getCacheKey(), JSON.stringify(cacheData));
    };

    return { getStoredEvents, setStoredEvents };
};