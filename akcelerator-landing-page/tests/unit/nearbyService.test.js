import { describe, it, expect } from 'vitest';
import { getNearbyPlaces, getNearbyCommunityItems } from '$lib/server/nearbyService.js';

describe('Nearby Service Unit Tests (Static GeoJSON & In-Memory Nearest Search)', () => {
  it('responds in < 50ms without external network calls', async () => {
    const t0 = performance.now();
    const result = await getNearbyPlaces({
      lat: 50.0755,
      lon: 14.4378,
      radiusM: 5000,
      kinds: ['ngo', 'community', 'food', 'animals']
    });
    const duration = performance.now() - t0;

    expect(duration).toBeLessThan(50);
    expect(Array.isArray(result.places)).toBe(true);
    expect(result.places.length).toBeGreaterThan(0);
    expect(Array.isArray(result.items)).toBe(true);
    expect(result.fallback).toBe(false);
  });

  it('anywhere in Czechia (including remote rural Šumava) returns at least 2 places sorted by distance', async () => {
    // Remote central Šumava coordinates with small 1km radius
    const ruralLat = 49.025;
    const ruralLon = 13.625;
    const result = await getNearbyPlaces({
      lat: ruralLat,
      lon: ruralLon,
      radiusM: 1000,
      kinds: ['ngo', 'community', 'food', 'animals']
    });

    expect(Array.isArray(result.places)).toBe(true);
    expect(result.places.length).toBeGreaterThanOrEqual(2);
    expect(result.expandedToNearest).toBe(true);
    expect(result.places[0].distanceKm).toBeLessThanOrEqual(result.places[1].distanceKm);

    // Also check community items
    const commResult = await getNearbyCommunityItems({
      lat: ruralLat,
      lon: ruralLon,
      radiusM: 1000
    });
    expect(Array.isArray(commResult.items)).toBe(true);
    expect(commResult.items.length).toBeGreaterThanOrEqual(2);
    expect(commResult.items[0].distanceKm).toBeLessThanOrEqual(commResult.items[1].distanceKm);
  });

  it('district towns Tábor and Kladno return verified places within radius', async () => {
    const taborResult = await getNearbyPlaces({
      lat: 49.4144,
      lon: 14.6578,
      radiusM: 8000,
      kinds: ['ngo', 'community', 'food', 'animals']
    });
    expect(taborResult.places.some((p) => p.name.includes('Tábor'))).toBe(true);

    const kladnoResult = await getNearbyPlaces({
      lat: 50.1473,
      lon: 14.1028,
      radiusM: 8000,
      kinds: ['ngo', 'community', 'food', 'animals']
    });
    expect(kladnoResult.places.some((p) => p.name.includes('Kladno'))).toBe(true);
  });

  it('places with shared prefix are preserved and sorted nearest-first', async () => {
    const prahaResult = await getNearbyPlaces({
      lat: 50.0755,
      lon: 14.4378,
      radiusM: 8000,
      kinds: ['community']
    });
    const ids = prahaResult.places.map((p) => p.id);
    expect(ids).toContain('curated:praha-knihobudka-jzp');
    expect(ids).toContain('curated:praha-knihobudka-dejvice');

    const jzp = prahaResult.places.find((p) => p.id === 'curated:praha-knihobudka-jzp');
    const dejvice = prahaResult.places.find((p) => p.id === 'curated:praha-knihobudka-dejvice');
    expect(jzp.distanceKm).toBeLessThanOrEqual(dejvice.distanceKm);
  });
});
