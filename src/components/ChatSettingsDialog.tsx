import { Dialog, DialogTitle, DialogContent, TextField, DialogActions, Button, Slider, Typography, FormControl, InputLabel, Select, MenuItem } from "@mui/material";
import { useApiKeyStore } from "@/store/useApiKeyStore";
import { useChatSettingsStore } from "@/store/useChatSettingsStore";
import { useState } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
}

export const ChatSettingsDialog = ({ open, onClose }: Props) => {
  const { apiKey, setApiKey } = useApiKeyStore();
  const { model, setModel, temperature, setTemperature } = useChatSettingsStore();
  
  const [localApiKey, setLocalApiKey] = useState(apiKey || '');
  const [localModel, setLocalModel] = useState(model);
  const [localTemp, setLocalTemp] = useState(temperature);

  const handleSave = () => {
    setApiKey(localApiKey);
    setModel(localModel);
    setTemperature(localTemp);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Настройки чата</DialogTitle>
      <DialogContent>
        <TextField
          label="Gemini API Ключ"
          type="password"
          fullWidth
          variant="outlined"
          margin="normal"
          value={localApiKey}
          onChange={(e) => setLocalApiKey(e.target.value)}
        />
        <FormControl fullWidth margin="normal">
          <InputLabel>Модель</InputLabel>
          <Select value={localModel} label="Модель" onChange={(e) => setLocalModel(e.target.value)}>
            <MenuItem value="gemini-1.5-pro-latest">Gemini 1.5 Pro</MenuItem>
            <MenuItem value="gemini-1.5-flash-latest">Gemini 1.5 Flash</MenuItem>
          </Select>
        </FormControl>
        <Typography gutterBottom sx={{mt: 2}}>Температура: {localTemp}</Typography>
        {/* ИЗМЕНЕНИЕ: Максимум теперь 2.0 */}
        <Slider value={localTemp} onChange={(_, value) => setLocalTemp(value as number)} min={0} max={2} step={0.1} />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Отмена</Button>
        <Button onClick={handleSave} variant="contained">Сохранить</Button>
      </DialogActions>
    </Dialog>
  );
};