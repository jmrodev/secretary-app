import { createContext, use } from 'react';

export const DoctorContext = createContext(null);

export const useDoctors = () => {
    const context = use(DoctorContext);
    if (!context) {
        const message = '[DoctorContext] useDoctors must be used within a DoctorProvider. If this happened during HMR, do a full page reload.';
        if (import.meta.env.DEV) {
            console.error(message);
        }
        throw new Error(message);
    }
    return context;
};
