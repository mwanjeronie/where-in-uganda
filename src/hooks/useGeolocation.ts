import { useState, useCallback } from 'react';
import { reverseGeocode, type ReverseGeocodeResult } from '../utils/reverseGeocode';

export type GeoState = 'idle' | 'requesting' | 'locating' | 'done' | 'error';

export interface GeolocationHookResult {
  geoState: GeoState;
  geoResult: ReverseGeocodeResult | null;
  geoError: string;
  locate: () => void;
  clearGeo: () => void;
  supported: boolean;
}

export function useGeolocation(): GeolocationHookResult {
  const supported = typeof navigator !== 'undefined' && 'geolocation' in navigator;

  const [geoState, setGeoState] = useState<GeoState>('idle');
  const [geoResult, setGeoResult] = useState<ReverseGeocodeResult | null>(null);
  const [geoError, setGeoError] = useState('');

  const locate = useCallback(() => {
    if (!supported) {
      setGeoError('Geolocation is not supported by your browser');
      setGeoState('error');
      return;
    }

    setGeoState('requesting');
    setGeoError('');
    setGeoResult(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        setGeoState('locating');
        const { latitude, longitude } = position.coords;
        try {
          const result = await reverseGeocode(latitude, longitude);
          setGeoResult(result);
          setGeoState('done');
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          if (msg === 'outside_uganda') {
            setGeoError("You don't appear to be in Uganda right now 🌍");
          } else {
            setGeoError('Could not look up your location. Try again.');
          }
          setGeoState('error');
        }
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setGeoError('Location access denied — please allow it in your browser settings.');
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setGeoError('Location unavailable. Try again outside or on a different device.');
        } else {
          setGeoError('Could not get your location. Please try again.');
        }
        setGeoState('error');
      },
      { timeout: 15000, maximumAge: 60000, enableHighAccuracy: true }
    );
  }, [supported]);

  const clearGeo = useCallback(() => {
    setGeoState('idle');
    setGeoResult(null);
    setGeoError('');
  }, []);

  return { geoState, geoResult, geoError, locate, clearGeo, supported };
}
