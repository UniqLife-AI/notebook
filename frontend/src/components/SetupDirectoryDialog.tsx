// File Name: src/components/SetupDirectoryDialog.tsx

import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button, Box } from "@mui/material";
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import { fileSystemService } from "@/services/FileSystemService";
import { useSettingsStore } from "@/store/useSettingsStore";

export const SetupDirectoryDialog = () => {
  const { setNeedsSetup } = useSettingsStore();

  const handleSelectDirectory = async () => {
    const handle = await fileSystemService.promptAndSetDirectory();
    if (handle) {
      // Если пользователь выбрал директорию, сообщаем, что настройка больше не нужна
      setNeedsSetup(false);
    }
  };

  return (
    <Dialog open={true} fullWidth maxWidth="sm">
      <DialogTitle>Добро пожаловать в Notebook</DialogTitle>
      <DialogContent sx={{ textAlign: 'center', p: 4 }}>
        <FolderOpenIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
        <DialogContentText>
          Для начала работы, пожалуйста, выберите папку на вашем компьютере.
        </DialogContentText>
        <DialogContentText sx={{ mt: 1, fontSize: 'small', color: 'text.secondary' }}>
          Все ваши чаты и заметки будут храниться в этой папке в виде обычных `.md` файлов, обеспечивая полный контроль и приватность данных.
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ p: '0 24px 24px' }}>
        <Button 
          onClick={handleSelectDirectory} 
          variant="contained" 
          fullWidth
          size="large"
        >
          Выбрать папку
        </Button>
      </DialogActions>
    </Dialog>
  );
};