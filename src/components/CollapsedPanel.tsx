import { Box, IconButton } from "@mui/material";
import KeyboardDoubleArrowRightIcon from '@mui/icons-material/KeyboardDoubleArrowRight';
import KeyboardDoubleArrowLeftIcon from '@mui/icons-material/KeyboardDoubleArrowLeft';
import AddIcon from '@mui/icons-material/Add';
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';
import BarChartIcon from '@mui/icons-material/BarChart';

interface Props {
  onExpand: () => void;
  side: 'left' | 'right';
}

export const CollapsedPanel = ({ onExpand, side }: Props) => (
  <Box sx={{ bgcolor: 'background.paper', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', py: 2, borderRight: side === 'left' ? '1px solid #e0e0e0' : 'none', borderLeft: side === 'right' ? '1px solid #e0e0e0' : 'none' }}>
    <IconButton onClick={onExpand}>
      {side === 'left' ? <KeyboardDoubleArrowRightIcon /> : <KeyboardDoubleArrowLeftIcon />}
    </IconButton>
    {side === 'left' && <IconButton><AddIcon /></IconButton>}
    {side === 'left' && <IconButton><ArticleOutlinedIcon /></IconButton>}
    {side === 'right' && <IconButton><BarChartIcon/></IconButton>}
  </Box>
);