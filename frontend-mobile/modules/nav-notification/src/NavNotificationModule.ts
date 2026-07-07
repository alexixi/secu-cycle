import { requireNativeModule } from 'expo-modules-core';

// Le module natif Android « NavNotification ». Sur iOS ce require n'est jamais
// atteint car index.ts garde toutes les entrées derrière Platform.OS === 'android'.
export default requireNativeModule('NavNotification');
