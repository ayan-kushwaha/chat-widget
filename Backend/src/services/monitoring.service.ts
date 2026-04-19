/**
 * Monitoring & Analytics Service
 * Tracks API performance, popular templates, and system metrics
 */

interface TemplateAnalytics {
    totalTemplates: number;
    totalInstalls: number;
    totalRatings: number;
    averageRating: number;
}

interface ApiMetric {
    endpoint: string;
    method: string;
    duration: number;
    timestamp: Date;
    status: number;
}

class MonitoringService {
    private apiMetrics: ApiMetric[] = [];
    private maxMetricsSize = 1000; // Keep last 1000 requests in memory

    /**
     * Log API request performance
     */
    logApiRequest(endpoint: string, method: string, duration: number, status: number) {
        const metric: ApiMetric = {
            endpoint,
            method,
            duration,
            status,
            timestamp: new Date()
        };

        this.apiMetrics.push(metric);

        // Keep only last N metrics to avoid memory bloat
        if (this.apiMetrics.length > this.maxMetricsSize) {
            this.apiMetrics.shift();
        }

        // Log slow queries (> 500ms)
        if (duration > 500) {
            console.warn(`⚠️  Slow API: ${method} ${endpoint} took ${duration}ms`);
        }
    }

    /**
     * Get average response time for endpoint
     */
    getAverageResponseTime(endpoint?: string): number {
        const metrics = endpoint
            ? this.apiMetrics.filter(m => m.endpoint === endpoint)
            : this.apiMetrics;

        if (metrics.length === 0) return 0;

        const totalDuration = metrics.reduce((sum, m) => sum + m.duration, 0);
        return Math.round(totalDuration / metrics.length);
    }

    /**
     * Get error rate (4xx + 5xx responses)
     */
    getErrorRate(): number {
        if (this.apiMetrics.length === 0) return 0;

        const errors = this.apiMetrics.filter(m => m.status >= 400).length;
        return Number(((errors / this.apiMetrics.length) * 100).toFixed(2));
    }

    /**
     * Get slowest endpoints
     */
    getSlowestEndpoints(limit: number = 5): { endpoint: string; avgDuration: number }[] {
        const endpointStats = new Map<string, { total: number; count: number }>();

        this.apiMetrics.forEach(m => {
            const key = `${m.method} ${m.endpoint}`;
            const existing = endpointStats.get(key) || { total: 0, count: 0 };
            endpointStats.set(key, {
                total: existing.total + m.duration,
                count: existing.count + 1
            });
        });

        return Array.from(endpointStats.entries())
            .map(([endpoint, stats]) => ({
                endpoint,
                avgDuration: Math.round(stats.total / stats.count)
            }))
            .sort((a, b) => b.avgDuration - a.avgDuration)
            .slice(0, limit);
    }

    /**
     * Get system health metrics
     */
    getHealthMetrics() {
        return {
            totalRequests: this.apiMetrics.length,
            averageResponseTime: this.getAverageResponseTime(),
            errorRate: this.getErrorRate(),
            slowestEndpoints: this.getSlowestEndpoints(5),
            uptime: process.uptime(),
            memoryUsage: {
                used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024), // MB
                total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) // MB
            }
        };
    }

    /**
     * Clear old metrics (can be called periodically)
     */
    clearOldMetrics(olderThanMinutes: number = 60) {
        const cutoffTime = new Date(Date.now() - olderThanMinutes * 60 * 1000);
        this.apiMetrics = this.apiMetrics.filter(m => m.timestamp > cutoffTime);
        console.log(`🧹 Cleared metrics older than ${olderThanMinutes} minutes`);
    }
}

// Singleton instance
export const monitoringService = new MonitoringService();

/**
 * Express middleware for automatic API monitoring
 */
export const monitoringMiddleware = (req: any, res: any, next: any) => {
    const startTime = Date.now();

    // Capture response finish
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        monitoringService.logApiRequest(
            req.path,
            req.method,
            duration,
            res.statusCode
        );
    });

    next();
};
