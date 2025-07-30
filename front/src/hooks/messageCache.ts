import { Message } from '../types/message';

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes en millisecondes

interface CacheData {
    timestamp: number;
    messageList: Message[];
}

interface CacheOneData {
    timestamp: number;
    message: Message;
}

export const useMessageCache = (type: string) => {
    const getCacheKey = () => `messages_${type}`;

    const getStoredMessages = (): Message[] => {
        if (typeof window === 'undefined') return [];
        
        const cached = localStorage.getItem(getCacheKey());
        if (!cached) return [];

        const { timestamp, messageList } = JSON.parse(cached) as CacheData;
        
        // Vérifier si le cache est encore valide
        if (Date.now() - timestamp > CACHE_DURATION) {
            localStorage.removeItem(getCacheKey());
            return [];
        }

        return messageList;
    };

    const setStoredMessages = (messageList: Message[]) => {
        if (typeof window === 'undefined') return;
        
        const cacheData: CacheData = {
            timestamp: Date.now(),
            messageList
        };
        
        localStorage.setItem(getCacheKey(), JSON.stringify(cacheData));
    };
    
    const setStoredMessage = (message: Message) => {
        if (typeof window === 'undefined') return;
        
        const cacheData: CacheOneData = {
            timestamp: Date.now(),
            message
        };
        
        localStorage.setItem(getCacheKey(), JSON.stringify(cacheData));
    };

    return { getStoredMessages, setStoredMessages, setStoredMessage };
};