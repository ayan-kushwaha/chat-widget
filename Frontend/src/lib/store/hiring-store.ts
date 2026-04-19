import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface OnboardingData {
    bossMandates: Record<string, string>;
    simulationResults: any | null;
    principles: any | null;
    finalConstitution: any | null;
}

interface HiringState {
    scannedAgents: Record<string, boolean>; // agentId -> isScanned
    agentLogs: Record<string, string[]>;    // agentId -> logs
    onboardingData: Record<string, OnboardingData>; // agentId -> data

    markScanned: (agentId: string) => void;
    addLogs: (agentId: string, logs: string[]) => void;
    updateOnboardingData: (agentId: string, data: Partial<OnboardingData>) => void;
    clearAgent: (agentId: string) => void;
    reset: () => void;
}

export const useHiringStore = create<HiringState>()(
    persist(
        (set) => ({
            scannedAgents: {},
            agentLogs: {},
            onboardingData: {},

            markScanned: (agentId) => set((state) => ({
                scannedAgents: { ...state.scannedAgents, [agentId]: true }
            })),

            addLogs: (agentId, newLogs) => set((state) => ({
                agentLogs: {
                    ...state.agentLogs,
                    [agentId]: [...(state.agentLogs[agentId] || []), ...newLogs]
                }
            })),

            updateOnboardingData: (agentId, data) => set((state) => ({
                onboardingData: {
                    ...state.onboardingData,
                    [agentId]: {
                        ...(state.onboardingData[agentId] || {
                            bossMandates: {},
                            simulationResults: null,
                            principles: null,
                            finalConstitution: null
                        }),
                        ...data
                    }
                }
            })),

            clearAgent: (agentId) => set((state) => {
                const { [agentId]: _, ...restScanned } = state.scannedAgents;
                const { [agentId]: __, ...restLogs } = state.agentLogs;
                const { [agentId]: ___, ...restData } = state.onboardingData;
                return {
                    scannedAgents: restScanned,
                    agentLogs: restLogs,
                    onboardingData: restData
                };
            }),

            reset: () => set({ scannedAgents: {}, agentLogs: {}, onboardingData: {} })
        }),
        {
            name: 'hiring-process-storage', // unique name
        }
    )
);
