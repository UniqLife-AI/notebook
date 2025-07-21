// File Name: src/components/NotificationsProvider.tsx

"use client";
import { SnackbarProvider, closeSnackbar } from 'notistack';
import { IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

export const NotificationsProvider = ({ children }: { children: React.ReactNode }) => {
    return (
        <SnackbarProvider 
            maxSnack={3}
            autoHideDuration={5000}
            anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
            }}
            action={(snackbarId) => (
                <IconButton size="small" onClick={() => closeSnackbar(snackbarId)}>
                    <CloseIcon fontSize="small" sx={{color: 'white'}} />
                </IconButton>
            )}
        >
            {children}
        </SnackbarProvider>
    );
};