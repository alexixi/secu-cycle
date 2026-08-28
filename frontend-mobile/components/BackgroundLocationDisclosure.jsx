import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Trans, useTranslation } from 'react-i18next';

import { Button, OutlineButton } from './ui/Button';
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
    const { colors, typography } = useTheme();
    const { t } = useTranslation();

    return (
        <Modal visible={visible} animationType="fade" transparent onRequestClose={onDecline}>
            <View style={styles.overlay}>
                <View style={[styles.container, { backgroundColor: colors.bgSurface }]}>

                    <View style={[styles.iconCircle, { backgroundColor: colors.primaryLight }]}>
                        <Ionicons name="location" size={34} color={colors.primary} />
                    </View>

                    <Text style={[typography.h1, styles.title, { color: colors.textMain }]}>
                        {t('legal.localisation.titre')}
                    </Text>

                    <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
                        {POINTS.map(({ cle, icon }) => (
                            <View key={cle} style={styles.point}>
                                <Ionicons name={icon} size={22} color={colors.primary} />
                                <View style={styles.pointText}>
                                    <Text style={[styles.pointTitle, { color: colors.textMain }]}>
                                        {t(`legal.localisation.points.${cle}.titre`)}
                                    </Text>
                                    <Text style={[styles.pointBody, { color: colors.textSecondary }]}>
                                        {t(`legal.localisation.points.${cle}.texte`)}
                                    </Text>
                                </View>
                            </View>
                        ))}

                        <Text style={[styles.legal, { color: colors.textSecondary }]}>
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
                        </Text>
                    </ScrollView>

                    <View style={styles.actions}>
                        <Button
                            title={t('legal.localisation.autoriser')}
                            iconName="checkmark-outline"
                            onPress={onAccept}
                        />
                        <OutlineButton title={t('legal.localisation.continuerSans')} onPress={onDecline} />
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    container: {
        width: '100%',
        maxWidth: 420,
        maxHeight: '85%',
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
    },
    iconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 14,
    },
    title: { fontSize: 20, lineHeight: 26, fontWeight: 'bold', textAlign: 'center', marginBottom: 18 },
    list: { alignSelf: 'stretch' },
    listContent: { paddingBottom: 4 },
    point: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 16 },
    pointText: { flex: 1 },
    pointTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 3 },
    pointBody: { fontSize: 13, lineHeight: 19 },
    legal: { fontSize: 12, lineHeight: 17, marginTop: 2 },
    legalLink: { textDecorationLine: 'underline' },
    actions: { alignSelf: 'stretch', gap: 10, marginTop: 18 },
});
