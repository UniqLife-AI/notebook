import { AppBar, Avatar, Box, Button, Toolbar, Typography } from "@mui/material";
import HubIcon from '@mui/icons-material/Hub'; // Замена для логотипа

export const AppHeader = () => (
  <AppBar position="static" elevation={0} sx={{ bgcolor: 'background.default', borderBottom: '1px solid #e0e0e0', color: 'text.primary' }}>
    <Toolbar>
      <HubIcon sx={{ mr: 1.5 }} />
      <Typography variant="body1" sx={{ fontWeight: 500, flexGrow: 1 }}>Notebook</Typography>
      <Button size="small" variant="outlined" sx={{color: 'inherit', borderColor: '#e0e0e0', mr: 1}}>PRO</Button>
      <Avatar sx={{ bgcolor: '#9c27b0', width: 32, height: 32 }}>V</Avatar>
    </Toolbar>
  </AppBar>
);