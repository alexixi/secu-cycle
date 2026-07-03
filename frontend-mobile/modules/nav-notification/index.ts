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
};

const isAndroid = Platform.OS === 'android';

/** Crée le canal de notification et poste la notification initiale. */
export async function start(): Promise<void> {
  if (!isAndroid) return;
  await NavNotificationModule.start();
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
