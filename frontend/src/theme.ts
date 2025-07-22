"use client";
import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    primary: {
      main: '#4285f4', // Синий цвет Google
    },
    background: {
      default: '#ffffff', // Белый фон для панелей
      paper: '#f7f7f8', // Светло-серый фон для боковых панелей и хедера
    },
  },
  typography: {
    fontFamily: 'Roboto, sans-serif',
    button: {
      textTransform: 'none', // Убираем заглавные буквы в кнопках
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '20px', // Скругленные кнопки
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 2px 0 rgba(60,64,67,.3), 0 1px 3px 1px rgba(60,64,67,.15)',
          borderRadius: '12px',
        },
      },
    },
  },
});