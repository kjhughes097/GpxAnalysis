export interface GpxPoint {
    lat: number;
    lon: number;
    ele?: number;
    time: Date;
}

export interface GpxTrack {
    name: string;
    points: GpxPoint[];
    /** Cumulative distance in meters at each point (same length as points). */
    cumulativeDistance: number[];
    /** Total distance in meters. */
    totalDistance: number;
    /** Total duration in seconds. */
    totalDuration: number;
}

const EARTH_RADIUS_M = 6_371_000;
export const METERS_PER_MILE = 1609.344;

function haversine(a: GpxPoint, b: GpxPoint): number {
    const toRad = (d: number) => (d * Math.PI) / 180;
    const dLat = toRad(b.lat - a.lat);
    const dLon = toRad(b.lon - a.lon);
    const lat1 = toRad(a.lat);
    const lat2 = toRad(b.lat);
    const h =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
    return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

export async function parseGpxFile(file: File): Promise<GpxTrack> {
    const text = await file.text();
    return parseGpxString(text, file.name);
}

export function parseGpxString(xml: string, name: string): GpxTrack {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, 'application/xml');
    const parseError = doc.querySelector('parsererror');
    if (parseError) {
        throw new Error(`Invalid GPX file: ${name}`);
    }
    const trkpts = Array.from(doc.getElementsByTagName('trkpt'));
    if (trkpts.length === 0) {
        throw new Error(`No track points found in ${name}`);
    }
    const points: GpxPoint[] = [];
    for (const pt of trkpts) {
        const lat = parseFloat(pt.getAttribute('lat') || '');
        const lon = parseFloat(pt.getAttribute('lon') || '');
        const timeEl = pt.getElementsByTagName('time')[0];
        const eleEl = pt.getElementsByTagName('ele')[0];
        if (!timeEl || !timeEl.textContent) continue;
        const time = new Date(timeEl.textContent);
        if (Number.isNaN(time.getTime())) continue;
        if (Number.isNaN(lat) || Number.isNaN(lon)) continue;
        const ele = eleEl?.textContent ? parseFloat(eleEl.textContent) : undefined;
        points.push({ lat, lon, ele, time });
    }
    if (points.length < 2) {
        throw new Error(`Track ${name} has fewer than 2 timed points`);
    }
    points.sort((a, b) => a.time.getTime() - b.time.getTime());

    const cumulativeDistance: number[] = [0];
    for (let i = 1; i < points.length; i++) {
        cumulativeDistance.push(cumulativeDistance[i - 1] + haversine(points[i - 1], points[i]));
    }
    const totalDistance = cumulativeDistance[cumulativeDistance.length - 1];
    const totalDuration =
        (points[points.length - 1].time.getTime() - points[0].time.getTime()) / 1000;

    return { name, points, cumulativeDistance, totalDistance, totalDuration };
}

/**
 * Distance covered in meters at each sample of elapsed seconds since track start.
 */
export interface DistanceSample {
    elapsedSec: number;
    distanceMeters: number;
}

export function distanceOverTime(track: GpxTrack): DistanceSample[] {
    const t0 = track.points[0].time.getTime();
    return track.points.map((p, i) => ({
        elapsedSec: (p.time.getTime() - t0) / 1000,
        distanceMeters: track.cumulativeDistance[i],
    }));
}

/**
 * Average pace (minutes per mile) across distance bins.
 * Returns one entry per completed mile bin (index 0 = mile 0-1).
 */
export interface PaceBin {
    mile: number;
    minutesPerMile: number;
}

export function rollingPacePerMile(track: GpxTrack): PaceBin[] {
    const totalMiles = Math.floor(track.totalDistance / METERS_PER_MILE);
    if (totalMiles === 0) return [];
    const bins: PaceBin[] = [];
    const t0 = track.points[0].time.getTime();

    // For each mile boundary, find interpolated time.
    const mileTimes: number[] = [0];
    let pointIdx = 1;
    for (let mile = 1; mile <= totalMiles; mile++) {
        const targetDist = mile * METERS_PER_MILE;
        while (
            pointIdx < track.points.length &&
            track.cumulativeDistance[pointIdx] < targetDist
        ) {
            pointIdx++;
        }
        if (pointIdx >= track.points.length) break;
        const d1 = track.cumulativeDistance[pointIdx - 1];
        const d2 = track.cumulativeDistance[pointIdx];
        const t1 = track.points[pointIdx - 1].time.getTime();
        const t2 = track.points[pointIdx].time.getTime();
        const frac = d2 === d1 ? 0 : (targetDist - d1) / (d2 - d1);
        const interpTime = t1 + frac * (t2 - t1);
        mileTimes.push((interpTime - t0) / 1000);
    }

    for (let i = 1; i < mileTimes.length; i++) {
        const seconds = mileTimes[i] - mileTimes[i - 1];
        bins.push({ mile: i, minutesPerMile: seconds / 60 });
    }
    return bins;
}

/**
 * Compute relative position: at each timestamp of the comparison track,
 * how far ahead (+) or behind (-) the reference track is the comparison
 * in terms of distance covered (meters).
 *
 * Sampled at the union of elapsed-second checkpoints so both tracks contribute.
 */
export interface RelativeSample {
    elapsedSec: number;
    deltaMeters: number;
}

export function relativePosition(
    reference: GpxTrack,
    comparison: GpxTrack,
    sampleCount = 200,
): RelativeSample[] {
    const maxElapsed = Math.min(
        reference.totalDuration,
        comparison.totalDuration,
    );
    if (maxElapsed <= 0) return [];
    const step = maxElapsed / sampleCount;
    const samples: RelativeSample[] = [];
    for (let i = 0; i <= sampleCount; i++) {
        const t = i * step;
        const refDist = distanceAtElapsed(reference, t);
        const cmpDist = distanceAtElapsed(comparison, t);
        samples.push({ elapsedSec: t, deltaMeters: cmpDist - refDist });
    }
    return samples;
}

function distanceAtElapsed(track: GpxTrack, elapsedSec: number): number {
    const t0 = track.points[0].time.getTime();
    const targetMs = t0 + elapsedSec * 1000;
    if (targetMs <= track.points[0].time.getTime()) return 0;
    if (targetMs >= track.points[track.points.length - 1].time.getTime()) {
        return track.totalDistance;
    }
    // Binary search
    let lo = 0;
    let hi = track.points.length - 1;
    while (hi - lo > 1) {
        const mid = (lo + hi) >> 1;
        if (track.points[mid].time.getTime() <= targetMs) lo = mid;
        else hi = mid;
    }
    const t1 = track.points[lo].time.getTime();
    const t2 = track.points[hi].time.getTime();
    const d1 = track.cumulativeDistance[lo];
    const d2 = track.cumulativeDistance[hi];
    const frac = t2 === t1 ? 0 : (targetMs - t1) / (t2 - t1);
    return d1 + frac * (d2 - d1);
}

export function formatElapsed(seconds: number): string {
    const s = Math.max(0, Math.round(seconds));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
    return `${m}:${sec.toString().padStart(2, '0')}`;
}
