import { useLocation, useNavigate } from 'react-router-dom';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import DirectionsRunRoundedIcon from '@mui/icons-material/DirectionsRunRounded';
import RouteRoundedIcon from '@mui/icons-material/RouteRounded';
import InsightsRoundedIcon from '@mui/icons-material/InsightsRounded';
import CompareArrowsRoundedIcon from '@mui/icons-material/CompareArrowsRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';

const mainItems = [
    { text: 'Dashboard', icon: <DashboardRoundedIcon />, path: '/' },
    { text: 'Activities', icon: <DirectionsRunRoundedIcon />, path: '/activities' },
    { text: 'Routes', icon: <RouteRoundedIcon />, path: '/routes' },
    { text: 'Insights', icon: <InsightsRoundedIcon />, path: '/insights' },
    { text: 'Compare Files', icon: <CompareArrowsRoundedIcon />, path: '/compare' },
];

const secondaryItems = [
    { text: 'Settings', icon: <SettingsRoundedIcon />, path: '/settings' },
];

export default function MenuContent() {
    const location = useLocation();
    const navigate = useNavigate();

    const isSelected = (path: string) => {
        if (path === '/') return location.pathname === '/';
        return location.pathname.startsWith(path);
    };

    return (
        <Stack sx={{ flexGrow: 1, p: 1, justifyContent: 'space-between' }}>
            <List dense>
                {mainItems.map((item) => (
                    <ListItem key={item.text} disablePadding sx={{ display: 'block' }}>
                        <ListItemButton
                            selected={isSelected(item.path)}
                            onClick={() => navigate(item.path)}
                        >
                            <ListItemIcon>{item.icon}</ListItemIcon>
                            <ListItemText primary={item.text} />
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>
            <div>
                <Divider sx={{ my: 1 }} />
                <List dense>
                    {secondaryItems.map((item) => (
                        <ListItem key={item.text} disablePadding sx={{ display: 'block' }}>
                            <ListItemButton
                                selected={isSelected(item.path)}
                                onClick={() => navigate(item.path)}
                            >
                                <ListItemIcon>{item.icon}</ListItemIcon>
                                <ListItemText primary={item.text} />
                            </ListItemButton>
                        </ListItem>
                    ))}
                </List>
            </div>
        </Stack>
    );
}
