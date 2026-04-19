"use client";

import { v4 as uuidv4 } from 'uuid';

const DEVICE_ID_KEY = 'cluaiz_device_id';

export const DeviceService = {
    getDeviceId: (): string => {
        if (typeof window === 'undefined') return 'server-side';

        let deviceId = localStorage.getItem(DEVICE_ID_KEY);

        if (!deviceId) {
            deviceId = uuidv4();
            localStorage.setItem(DEVICE_ID_KEY, deviceId);
        }

        return deviceId;
    },

    resetDeviceId: () => {
        if (typeof window === 'undefined') return;
        localStorage.removeItem(DEVICE_ID_KEY);
    }
};
