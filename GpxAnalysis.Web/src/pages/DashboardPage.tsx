import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import { LineChart } from '@mui/x-charts/LineChart';
import { BarChart } from '@mui/x-charts/BarChart';
import { SparkLineChart } from '@mui/x-charts/SparkLineChart';

interface StatCardProps {
    title: string;
    value: string;
    trend: string;
    trendUp: boolean;
    data: number[];
}

function StatCard({ title, value, trend, trendUp, data }: StatCardProps) {
    return (
        <Card>
            <CardContent sx={{ pb: '16px !important' }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                    {title}
                </Typography>
                <Stack direction="row" sx={{ alignItems: 'baseline', gap: 1 }}>
                    <Typography variant="h4" sx={{ fontWeight: 600 }}>
                        {value}
                    </Typography>
                    <Chip
                        label={trend}
                        size="small"
                        color={trendUp ? 'success' : 'error'}
                        sx={{ fontSize: '0.75rem', height: 20 }}
                    />
                </Stack>
                <Typography variant="caption" color="text.secondary">
                    Last 30 days
                </Typography>
                <Box sx={{ mt: 1, height: 40 }}>
                    <SparkLineChart
                        data={data}
                        height={40}
                        color={trendUp ? '#00b894' : '#d63031'}
                    />
                </Box>
            </CardContent>
        </Card>
    );
}

const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
const distanceData = [22, 35, 28, 41];

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
const elevationData = [340, 510, 680, 720, 880, 950];

export default function DashboardPage() {
    return (
        <Box>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
                Overview
            </Typography>

            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <StatCard title="Activities" value="24" trend="+12%" trendUp data={[3, 4, 2, 5, 6, 4, 7]} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <StatCard title="Distance (km)" value="312" trend="+8%" trendUp data={[20, 28, 32, 36, 40, 44, 48]} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <StatCard title="Elevation (m)" value="5,420" trend="-4%" trendUp={false} data={[900, 820, 780, 760, 740, 720, 700]} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <StatCard title="Moving time (h)" value="48" trend="+5%" trendUp data={[5, 6, 7, 6, 8, 8, 9]} />
                </Grid>
            </Grid>

            <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 8 }}>
                    <Card>
                        <CardContent>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                                Weekly distance
                            </Typography>
                            <LineChart
                                xAxis={[{ scaleType: 'point', data: weeks }]}
                                series={[{ data: distanceData, area: true, color: '#0984e3', label: 'km' }]}
                                height={260}
                            />
                        </CardContent>
                    </Card>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                    <Card sx={{ height: '100%' }}>
                        <CardContent>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                                Recent uploads
                            </Typography>
                            <Stack spacing={1.5}>
                                {['morning-run.gpx', 'sunday-ride.gpx', 'lakeshore-loop.gpx'].map((name) => (
                                    <Box key={name} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography variant="body2">{name}</Typography>
                                        <Typography variant="caption" color="text.secondary">—</Typography>
                                    </Box>
                                ))}
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid size={{ xs: 12 }}>
                    <Card>
                        <CardContent>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                                Monthly elevation gain
                            </Typography>
                            <BarChart
                                xAxis={[{ scaleType: 'band', data: months }]}
                                series={[{ data: elevationData, color: '#00b894', label: 'm' }]}
                                height={260}
                            />
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
}
