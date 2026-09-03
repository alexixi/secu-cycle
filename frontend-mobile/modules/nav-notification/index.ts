import { Platform } from 'react-native';

import NavNotificationModule from './src/NavNotificationModule';

export type NavGuidancePayload = {
  turnType?: string | null;
  instruction?: string | null;
  distanceLabel?: string | null;
  nextInstruction?: string | null;
  progress?: number;
  status?: string | null;
  hasArrived?: boolean;
  // Libellés composés par la notification elle-même. Le natif retombe sur ses
  // valeurs françaises par défaut s'ils sont absents.
  arrivedTitle?: string;
  rerouteTitle?: string;
  fallbackTitle?: string;
  nextPrefix?: string;
};

export type NavLabels = {
  channelName?: string;
  startingInstruction?: string;
  startingDistanceLabel?: string;
};

export type NavChipStatus = {
  /** Le téléphone tourne sous Android 16 ou plus : la chip existe. */
  supported: boolean;
  /** L'utilisateur n'a pas refusé les notifications promues pour l'application. */
  allowed: boolean;
};

const isAndroid = Platform.OS === 'android';

/** Crée le canal de notification et poste la notification initiale. */
export async function start(labels: NavLabels = {}): Promise<void> {
  if (!isAndroid) return;
  await NavNotificationModule.start(labels);
}

/** Met à jour la notification de guidage en direct. */
export async function update(payload: NavGuidancePayload): Promise<void> {
  if (!isAndroid) return;
  await NavNotificationModule.update(payload);
}

/** Retire la notification de guidage. */
export async function stop(): Promise<void> {
  if (!isAndroid) return;
  await NavNotificationModule.stop();
}

/**
 * Dit si la chip de la barre de statut peut s'afficher. Le système refuse la
 * promotion sans rien signaler : sans cet appel, une chip absente ne se
 * distingue pas d'une chip cassée.
 */
export async function getChipStatus(): Promise<NavChipStatus> {
  if (!isAndroid) return { supported: false, allowed: false };
  return await NavNotificationModule.getChipStatus();
}
