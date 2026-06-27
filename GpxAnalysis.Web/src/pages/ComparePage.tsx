import { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import UploadFileRoundedIcon from '@mui/icons-material/UploadFileRounded';
import { LineChart } from '@mui/x-charts/LineChart';
import { BarChart } from '@mui/x-charts/BarChart';
import {
    parseGpxFile,
    distanceOverTime,
    rollingPacePerMile,
    relativePosition,
    formatElapsed,
    METERS_PER_MILE,
    type GpxTrack,
} from '../utils/gpx';

const REFERENCE_COLOR = '#0984e3';
const COMPARISON_COLOR = '#e17055';

interface UploadSlotProps {
    label: string;
    track: GpxTrack | null;
    color: string;
    onSelect: (file: File) => void;
}

function UploadSlot({ label, track, color, onSelect }: UploadSlotProps) {
    const inputId = `gpx-upload-${label.replace(/\s+/g, '-').toLowerCase()}`;
    return (
        <Card variant="outlined">
            <CardContent>
                <Stack direction="row" spacing={1} sx={{ mb: 1, alignItems: 'center' }}>
                    <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: color }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        {label}
                    </Typography>
                </Stack>
                <input
                    id={inputId}
                    type="file"
                    accept=".gpx,application/gpx+xml,application/xml,text/xml"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) onSelect(f);
                        e.target.value = '';
                    }}
                />
                <label htmlFor={inputId}>
                    <Button
                        component="span"
                        variant="outlined"
                        startIcon={<UploadFileRoundedIcon />}
                        size="small"
                    >
                        {track ? 'Replace file' : 'Choose GPX file'}
                    </Button>
                </label>
                {track && (
                    <Stack direction="row" spacing={1} sx={{ mt: 1.5, flexWrap: 'wrap', gap: 0.5 }}>
                        <Chip label={track.name} size="small" />
                        <Chip
                            label={`${(track.totalDistance / METERS_PER_MILE).toFixed(2)} mi`}
                            size="small"
                            variant="outlined"
                        />
                        <Chip
                            label={formatElapsed(track.totalDuration)}
                            size="small"
                            variant="outlined"
                        />
                    </Stack>
                )}
            </CardContent>
        </Card>
    );
}

export default function ComparePage() {
    const [reference, setReference] = useState<GpxTrack | null>(null);
    const [comparison, setComparison] = useState<GpxTrack | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleSelect = async (
        file: File,
        setter: (t: GpxTrack | null) => void,
    ) => {
        setError(null);
        try {
            const track = await parseGpxFile(file);
            setter(track);
        } catch (e) {
            setter(null);
            setError(e instanceof Error ? e.message : 'Failed to parse GPX file');
        }
    };

    const distanceSeries = useMemo(() => {
        const refSamples = reference ? distanceOverTime(reference) : [];
        const cmpSamples = comparison ? distanceOverTime(comparison) : [];
        const maxLen = Math.max(refSamples.length, cmpSamples.length);
        // Build a shared elapsed-seconds axis using the longer track's resolution.
        const longer = refSamples.length >= cmpSamples.length ? refSamples : cmpSamples;
        const elapsedAxis = longer.map((s) => s.elapsedSec);

        // For each axis tick, interpolate distance for both tracks.
        const interp = (samples: typeof refSamples, t: number): number | null => {
            if (samples.length === 0) return null;
            if (t <= samples[0].elapsedSec) return samples[0].distanceMeters;
            if (t >= samples[samples.length - 1].elapsedSec) return null;
            let lo = 0;
            let hi = samples.length - 1;
            while (hi - lo > 1) {
                const mid = (lo + hi) >> 1;
                if (samples[mid].elapsedSec <= t) lo = mid;
                else hi = mid;
            }
            const a = samples[lo];
            const b = samples[hi];
            const frac = (t - a.elapsedSec) / (b.elapsedSec - a.elapsedSec || 1);
            return a.distanceMeters + frac * (b.distanceMeters - a.distanceMeters);
        };

        return {
            x: elapsedAxis,
            refMiles: elapsedAxis.map((t) => {
                const v = interp(refSamples, t);
                return v === null ? null : v / METERS_PER_MILE;
            }),
            cmpMiles: elapsedAxis.map((t) => {
                const v = interp(cmpSamples, t);
                return v === null ? null : v / METERS_PER_MILE;
            }),
            hasData: maxLen > 0,
        };
    }, [reference, comparison]);

    const paceSeries = useMemo(() => {
        const refBins = reference ? rollingPacePerMile(reference) : [];
        const cmpBins = comparison ? rollingPacePerMile(comparison) : [];
        const maxMile = Math.max(refBins.length, cmpBins.length);
        const labels = Array.from({ length: maxMile }, (_, i) => `Mile ${i + 1}`);
        const pad = (bins: typeof refBins) =>
            Array.from({ length: maxMile }, (_, i) =>
                bins[i] ? bins[i].minutesPerMile : null,
            );
        return {
            labels,
            ref: pad(refBins),
            cmp: pad(cmpBins),
            hasData: maxMile > 0,
        };
    }, [reference, comparison]);

    const relativeSeries = useMemo(() => {
        if (!reference || !comparison) return null;
        const samples = relativePosition(reference, comparison);
        return {
            x: samples.map((s) => s.elapsedSec),
            delta: samples.map((s) => s.deltaMeters / METERS_PER_MILE),
        };
    }, [reference, comparison]);

    const timeFormatter = (v: number) => formatElapsed(v);

    return (
        <Box>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
                Compare Files
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Upload two GPX files to compare distance, pacing, and relative position.
            </Typography>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid size={{ xs: 12, md: 6 }}>
                    <UploadSlot
                        label="Reference GPX"
                        track={reference}
                        color={REFERENCE_COLOR}
                        onSelect={(f) => handleSelect(f, setReference)}
                    />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <UploadSlot
                        label="Comparison GPX"
                        track={comparison}
                        color={COMPARISON_COLOR}
                        onSelect={(f) => handleSelect(f, setComparison)}
                    />
                </Grid>
            </Grid>

            <Grid container spacing={2}>
                <Grid size={{ xs: 12 }}>
                    <Card>
                        <CardContent>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                                Distance over time
                            </Typography>
                            {distanceSeries.hasData ? (
                                <LineChart
                                    xAxis={[
                                        {
                                            data: distanceSeries.x,
                                            label: 'Elapsed time',
                                            valueFormatter: timeFormatter,
                                        },
                                    ]}
                                    yAxis={[{ label: 'Distance (mi)' }]}
                                    series={[
                                        {
                                            data: distanceSeries.refMiles,
                                            label: 'Reference',
                                            color: REFERENCE_COLOR,
                                            showMark: false,
                                            connectNulls: false,
                                        },
                                        {
                                            data: distanceSeries.cmpMiles,
                                            label: 'Comparison',
                                            color: COMPARISON_COLOR,
                                            showMark: false,
                                            connectNulls: false,
                                        },
                                    ]}
                                    height={300}
                                />
                            ) : (
                                <Typography variant="body2" color="text.secondary">
                                    Upload at least one GPX file to view distance over time.
                                </Typography>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                <Grid size={{ xs: 12 }}>
                    <Card>
                        <CardContent>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                                Rolling pace (min / mile)
                            </Typography>
                            {paceSeries.hasData ? (
                                <BarChart
                                    xAxis={[
                                        {
                                            scaleType: 'band',
                                            data: paceSeries.labels,
                                            label: 'Distance',
                                        },
                                    ]}
                                    yAxis={[{ label: 'Pace (min/mi)' }]}
                                    series={[
                                        {
                                            data: paceSeries.ref,
                                            label: 'Reference',
                                            color: REFERENCE_COLOR,
                                        },
                                        {
                                            data: paceSeries.cmp,
                                            label: 'Comparison',
                                            color: COMPARISON_COLOR,
                                        },
                                    ]}
                                    height={300}
                                />
                            ) : (
                                <Typography variant="body2" color="text.secondary">
                                    Pace bins appear once a track covers at least one mile.
                                </Typography>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                <Grid size={{ xs: 12 }}>
                    <Card>
                        <CardContent>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                                Relative position (comparison vs. reference)
                            </Typography>
                            {relativeSeries ? (
                                <>
                                    <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                                        Positive = comparison is ahead. Negative = comparison is behind.
                                    </Typography>
                                    <LineChart
                                        xAxis={[
                                            {
                                                data: relativeSeries.x,
                                                label: 'Elapsed time',
                                                valueFormatter: timeFormatter,
                                            },
                                        ]}
                                        yAxis={[{ label: 'Delta (mi)' }]}
                                        series={[
                                            {
                                                data: relativeSeries.delta,
                                                label: 'Comparison − Reference',
                                                color: COMPARISON_COLOR,
                                                area: true,
                                                showMark: false,
                                            },
                                        ]}
                                        height={300}
                                    />
                                </>
                            ) : (
                                <Typography variant="body2" color="text.secondary">
                                    Upload both files to see the relative position chart.
                                </Typography>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
}
