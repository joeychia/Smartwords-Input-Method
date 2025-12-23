import { STORAGE_KEYS } from '../constants';

/**
 * Analytics Service for SmartWords
 * Handles performance tracking, health stats, and Google Analytics integration.
 */

// Extend window for Google Analytics
declare global {
    interface Window {
        gtag?: (...args: any[]) => void;
        dataLayer?: any[];
    }
}

interface AnalyticsEvent {
    category: string;
    action: string;
    label?: string;
    value?: number;
    metadata?: Record<string, any>;
}

class AnalyticsService {
    private static instance: AnalyticsService;
    private readonly SESSION_STORAGE_KEY = 'sw_health_stats';

    private constructor() {
        this.initSessionStats();
    }

    public static getInstance(): AnalyticsService {
        if (!AnalyticsService.instance) {
            AnalyticsService.instance = new AnalyticsService();
        }
        return AnalyticsService.instance;
    }

    /**
     * Initialize or load health stats for the current session
     */
    private initSessionStats() {
        const stats = localStorage.getItem(this.SESSION_STORAGE_KEY);
        if (!stats) {
            localStorage.setItem(this.SESSION_STORAGE_KEY, JSON.stringify({
                totalRequests: 0,
                successCount: 0,
                failCount: 0,
                avgLatency: 0,
                latencies: []
            }));
        }
    }

    /**
     * Log a general event to console and Google Analytics
     */
    public logEvent(event: AnalyticsEvent) {
        console.log(`[Analytics] 📊 Event: ${event.category} | ${event.action}${event.label ? ' | ' + event.label : ''}`, event.metadata || '');

        if (window.gtag) {
            window.gtag('event', event.action, {
                event_category: event.category,
                event_label: event.label,
                value: event.value,
                ...event.metadata
            });
        }
    }

    /**
     * Log timing performance (e.g., AI latency)
     */
    public logTiming(category: string, name: string, value: number, label?: string) {
        console.log(`[Analytics] ⏱️ Timing: ${category} | ${name} | ${value}ms`);

        // Update local health stats
        if (name === 'ai_rewrite_latency') {
            this.updateHealthStats(value, true);
        }

        if (window.gtag) {
            window.gtag('event', 'timing_complete', {
                name,
                value,
                event_category: category,
                event_label: label
            });
        }
    }

    /**
     * Log errors
     */
    public logError(message: string, fatal = false, metadata?: Record<string, any>) {
        console.error(`[Analytics] 🚨 Error: ${message}`, metadata || '');

        if (message.includes('AI generation failure')) {
            this.updateHealthStats(0, false);
        }

        if (window.gtag) {
            window.gtag('event', 'exception', {
                description: message,
                fatal,
                ...metadata
            });
        }
    }

    /**
     * Update internal session health statistics
     */
    private updateHealthStats(latency: number, isSuccess: boolean) {
        try {
            const statsStr = localStorage.getItem(this.SESSION_STORAGE_KEY);
            if (!statsStr) return;

            const stats = JSON.parse(statsStr);
            stats.totalRequests += 1;

            if (isSuccess) {
                stats.successCount += 1;
                stats.latencies.push(latency);
                // Keep only last 20 latencies for rolling average
                if (stats.latencies.length > 20) stats.latencies.shift();
                stats.avgLatency = Math.round(stats.latencies.reduce((a: number, b: number) => a + b, 0) / stats.latencies.length);
            } else {
                stats.failCount += 1;
            }

            localStorage.setItem(this.SESSION_STORAGE_KEY, JSON.stringify(stats));
        } catch (e) {
            console.warn('Failed to update health stats', e);
        }
    }

    public getSessionHealth() {
        try {
            const stats = localStorage.getItem(this.SESSION_STORAGE_KEY);
            return stats ? JSON.parse(stats) : null;
        } catch {
            return null;
        }
    }
}

export const analytics = AnalyticsService.getInstance();
