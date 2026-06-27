import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';

export default function ActivitiesPage() {
    return (
        <Box>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
                Activities
            </Typography>
            <Card>
                <CardContent>
                    <Typography variant="body2" color="text.secondary">
                        Activity list will appear here.
                    </Typography>
                </CardContent>
            </Card>
        </Box>
    );
}
