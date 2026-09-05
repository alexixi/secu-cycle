import * as QuickActions from 'expo-quick-actions';

import { resolveDestination } from './destinationResolver';
import { setPendingDestination } from './pendingDestination';


export const ACTION_HOME = 'destination-home';
export const ACTION_WORK = 'destination-work';

export async function syncQuickActions(user, t) {
    const items = [];

    if (user?.home_address?.trim()) {
        items.push({
            id: ACTION_HOME,
            title: t('carte.actionsRapides.rentrer'),
            subtitle: user.home_address,
            params: { adresse: user.home_address },
        });
    }

    if (user?.work_address?.trim()) {
        items.push({
            id: ACTION_WORK,
            title: t('carte.actionsRapides.travail'),
            subtitle: user.work_address,
            params: { adresse: user.work_address },
        });
    }

    try {
        await QuickActions.setItems(items);
    } catch (error) {
        console.warn('[quickactions] setItems', error);
    }
}

export async function handleQuickAction(action, options = {}) {
    const adresse = action?.params?.adresse;
    if (!adresse) return;

    const resolved = await resolveDestination(adresse, {
        bias: options.bias,
        source: 'quickaction',
    });
    setPendingDestination(resolved);
}

export async function clearQuickActions() {
    try {
        await QuickActions.setItems([]);
    } catch (error) {
        console.warn('[quickactions] clear', error);
    }
}
