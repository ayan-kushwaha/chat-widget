import { useState, useEffect } from 'react';
import { plansAPI } from '@/api/plans.api';

export function usePlans() {
    const [plans, setPlans] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchPlans = async () => {
            try {
                const res = await plansAPI.getAll();
                setPlans(res.data || []);
            } catch (error) {
                console.error("Failed to fetch plans", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchPlans();
    }, []);

    return { plans, isLoading };
}
