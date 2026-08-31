import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, AppState, Linking } from 'react-native';
import * as Location from 'expo-location';
import { useTranslation } from 'react-i18next';

export const GRANTED = 'granted';
export const PRIMING = 'priming';
export const BLOCKED = 'blocked';

export default function useLocationPermission() {
    const { t } = useTranslation();
    const [status, setStatus] = useState(null);
    const [canAskAgain, setCanAskAgain] = useState(true);
    const [primingVisible, setPrimingVisible] = useState(false);

    const statusRef = useRef(null);
    const canAskAgainRef = useRef(true);

    const _apply = useCallback((resultat) => {
        statusRef.current = resultat?.status ?? 'undetermined';
        canAskAgainRef.current = resultat?.canAskAgain !== false;
        setStatus(statusRef.current);
        setCanAskAgain(canAskAgainRef.current);
        return statusRef.current === 'granted';
    }, []);

    const _read = useCallback(async () => {
        try {
            return _apply(await Location.getForegroundPermissionsAsync());
        } catch {
            return false;
        }
    }, [_apply]);

    useEffect(() => {
        _read();
        const sub = AppState.addEventListener('change', (state) => {
            if (state === 'active') _read();
        });
        return () => sub.remove();
    }, [_read]);

    const requestNow = useCallback(async () => {
        try {
            return _apply(await Location.requestForegroundPermissionsAsync());
        } catch {
            return false;
        }
    }, [_apply]);

    const ensureGranted = useCallback(async () => {
        if (statusRef.current === 'granted') return GRANTED;

        if (await _read()) return GRANTED;

        if (!canAskAgainRef.current) {
            Alert.alert(
                t('legal.position.bloqueeTitre'),
                t('legal.position.bloqueeTexte'),
                [
                    { text: t('commun.annuler'), style: 'cancel' },
                    { text: t('legal.position.ouvrirReglages'), onPress: () => Linking.openSettings() },
                ],
            );
            return BLOCKED;
        }

        setPrimingVisible(true);
        return PRIMING;
    }, [_read, t]);

    const acceptPriming = useCallback(async () => {
        setPrimingVisible(false);
        return requestNow();
    }, [requestNow]);

    const declinePriming = useCallback(() => {
        setPrimingVisible(false);
    }, []);

    return {
        granted: status === 'granted',
        canAskAgain,
        primingVisible,
        ensureGranted,
        requestNow,
        acceptPriming,
        declinePriming,
    };
}
