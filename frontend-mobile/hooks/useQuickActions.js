import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import * as QuickActions from 'expo-quick-actions';

import { useAuth } from '../context/AuthContext';
import {
    clearQuickActions,
    handleQuickAction,
    syncQuickActions,
} from '../services/quickActions';

export function useQuickActions(options = {}) {
    const { bias } = options;
    const { user, token } = useAuth();
    const { t, i18n } = useTranslation();

    const biasRef = useRef(bias);
    biasRef.current = bias;

    useEffect(() => {
        if (!token) {
            clearQuickActions();
            return;
        }
        syncQuickActions(user, t);
    }, [token, user?.home_address, user?.work_address, i18n.language, t, user]);

    useEffect(() => {
        const initial = QuickActions.initial;
        if (initial) handleQuickAction(initial, { bias: biasRef.current });
    }, []);

    useEffect(() => {
        const sub = QuickActions.addListener((action) => {
            handleQuickAction(action, { bias: biasRef.current });
        });
        return () => sub?.remove?.();
    }, []);
}
