// File Name: src/hooks/useNotifier.ts

import { useSnackbar } from 'notistack';

export const useNotifier = () => {
    const { enqueueSnackbar } = useSnackbar();

    const notifyError = (message: string) => {
        enqueueSnackbar(message, { variant: 'error' });
    };

    const notifySuccess = (message: string) => {
        enqueueSnackbar(message, { variant: 'success' });
    };
    
    const notifyInfo = (message: string) => {
        enqueueSnackbar(message, { variant: 'info' });
    };

    return { notifyError, notifySuccess, notifyInfo };
};