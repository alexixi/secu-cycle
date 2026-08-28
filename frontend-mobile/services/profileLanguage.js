// Report de la préférence de langue sur le profil serveur.
//
// La langue de l'interface vit dans AsyncStorage (`languagePreference.js`) et
// suffit à tout ce qui s'affiche. Les e-mails, eux, sont rendus par l'API :
// le récapitulatif périodique part d'une boucle de fond, sans requête d'où lire
// une préférence. La colonne `users.language` est le seul endroit où cette
// boucle peut aller la chercher — d'où ce pont.
//
// Ce module est appelé par `LocaleContext`, qui est monté AU-DESSUS
// d'`AuthProvider` : il ne peut donc pas passer par `useAuth`, et lit lui-même
// le jeton et le profil en cache. Même raison d'être que le cache synchrone de
// `languagePreference.js`, à un étage de plus.

import AsyncStorage from '@react-native-async-storage/async-storage';

import { setProfileLanguage } from './apiBack';
import { currentLanguage } from './languagePreference';
import { getAccessToken } from './tokenStorage';

const USER_KEY = 'user';

/**
 * Aligne `users.language` sur la langue effective, si nécessaire.
 *
 * Sans effet si personne n'est connecté ou si le profil porte déjà la bonne
 * langue — c'est ce qui évite un appel réseau à chaque démarrage et à chaque
 * mise à jour de profil. Ne lève jamais : une préférence non reportée ne vaut
 * pas de perturber l'écran, et la prochaine occasion réessaiera.
 *
 * @returns la langue reportée, ou `null` si rien n'avait à l'être.
 */
export async function syncProfileLanguage(langue = currentLanguage()) {
    try {
        const token = await getAccessToken();
        if (!token) return null;

        const brut = await AsyncStorage.getItem(USER_KEY);
        const utilisateur = brut ? JSON.parse(brut) : null;
        if (!utilisateur || utilisateur.language === langue) return null;

        await setProfileLanguage(token, langue);
        // Le profil en cache est mis à jour ici, et non via AuthContext : sans
        // cela, le prochain démarrage relirait l'ancienne langue et reposterait.
        await AsyncStorage.setItem(
            USER_KEY, JSON.stringify({ ...utilisateur, language: langue }),
        );
        return langue;
    } catch {
        // Hors ligne, session expirée, stockage illisible : on réessaiera.
        return null;
    }
}
