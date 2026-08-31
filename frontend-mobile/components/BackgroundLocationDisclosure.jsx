import { StyleSheet, Text } from 'react-native';
import { Trans, useTranslation } from 'react-i18next';

import PrimingModal from './ui/PrimingModal';
import { LEGAL_LINKS, openLegalPage } from '../constants/legal';
import { useTheme } from '../hooks/useTheme';

// Identifiants seuls : c'est un texte de consentement, il doit être rendu dans
// la langue de l'utilisateur au moment où il le lit, pas dans celle du
// chargement du bundle.
const POINTS = [
    { cle: 'collecte', icon: 'navigate-circle-outline' },
    { cle: 'arrierePlan', icon: 'moon-outline' },
    { cle: 'usage', icon: 'git-branch-outline' },
];


export default function BackgroundLocationDisclosure({ visible, onAccept, onDecline }) {
    const { colors } = useTheme();
    const { t } = useTranslation();

    const points = POINTS.map(({ cle, icon }) => ({
        cle,
        icon,
        /* i18n-suffixes: collecte arrierePlan usage */
        titre: t(`legal.localisation.points.${cle}.titre`),
        /* i18n-suffixes: collecte arrierePlan usage */
        texte: t(`legal.localisation.points.${cle}.texte`),
    }));

    return (
        <PrimingModal
            visible={visible}
            iconName="location"
            title={t('legal.localisation.titre')}
            points={points}
            footer={
                <Trans
                    i18nKey="legal.localisation.retrait"
                    components={{
                        lien: (
                            <Text
                                style={[styles.legalLink, { color: colors.primary }]}
                                onPress={() => openLegalPage(LEGAL_LINKS.privacy)}
                            />
                        ),
                    }}
                />
            }
            acceptLabel={t('legal.localisation.autoriser')}
            declineLabel={t('legal.localisation.continuerSans')}
            onAccept={onAccept}
            onDecline={onDecline}
        />
    );
}

const styles = StyleSheet.create({
    legalLink: { textDecorationLine: 'underline' },
});
