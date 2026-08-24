import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Button, OutlineButton } from './ui/Button';
import { LEGAL_LINKS, openLegalPage } from '../constants/legal';
import { useTheme } from '../hooks/useTheme';

const POINTS = [
    {
        icon: 'navigate-circle-outline',
        title: 'Ce que nous collectons',
        text: "Votre position GPS précise, relevée pendant toute la durée du guidage.",
    },
    {
        icon: 'moon-outline',
        title: "Y compris en arrière-plan",
        text: "Le relevé continue quand l'écran est éteint ou que l'application n'est plus au premier plan, pour poursuivre le guidage téléphone en poche.",
    },
    {
        icon: 'git-branch-outline',
        title: 'À quoi elle sert',
        text: "Uniquement à vous guider : recaler votre position sur l'itinéraire et annoncer la prochaine instruction. Elle n'est ni conservée, ni utilisée pour de la publicité, ni transmise à des tiers à cette fin.",
    },
];


export default function BackgroundLocationDisclosure({ visible, onAccept, onDecline }) {
    const { colors, typography } = useTheme();

    return (
        <Modal visible={visible} animationType="fade" transparent onRequestClose={onDecline}>
            <View style={styles.overlay}>
                <View style={[styles.container, { backgroundColor: colors.bgSurface }]}>

                    <View style={[styles.iconCircle, { backgroundColor: colors.primaryLight }]}>
                        <Ionicons name="location" size={34} color={colors.primary} />
                    </View>

                    <Text style={[typography.h1, styles.title, { color: colors.textMain }]}>
                        Localisation pendant le guidage
                    </Text>

                    <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
                        {POINTS.map(({ icon, title, text }) => (
                            <View key={title} style={styles.point}>
                                <Ionicons name={icon} size={22} color={colors.primary} />
                                <View style={styles.pointText}>
                                    <Text style={[styles.pointTitle, { color: colors.textMain }]}>{title}</Text>
                                    <Text style={[styles.pointBody, { color: colors.textSecondary }]}>{text}</Text>
                                </View>
                            </View>
                        ))}

                        <Text style={[styles.legal, { color: colors.textSecondary }]}>
                            Vous pouvez retirer cette autorisation à tout moment dans les réglages de
                            votre téléphone. Détails dans notre{" "}
                            <Text
                                style={[styles.legalLink, { color: colors.primary }]}
                                onPress={() => openLegalPage(LEGAL_LINKS.privacy)}
                            >
                                politique de confidentialité
                            </Text>
                            .
                        </Text>
                    </ScrollView>

                    <View style={styles.actions}>
                        <Button title="Autoriser" iconName="checkmark-outline" onPress={onAccept} />
                        <OutlineButton title="Continuer sans" onPress={onDecline} />
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
