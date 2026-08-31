import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Button, OutlineButton } from './Button';
import { useTheme } from '../../hooks/useTheme';

/**
 * Coquille des modales de pré-demande de permission : icône, titre, liste de
 * points, mention légale optionnelle, deux actions.
 *
 * Volontairement muette : elle reçoit des chaînes DÉJÀ traduites, jamais des
 * clés. Les `t()` et leurs commentaires `i18n-suffixes` restent donc chez
 * l'appelant, là où le vérificateur de traductions sait les lire.
 */
export default function PrimingModal({
    visible,
    iconName,
    title,
    points,
    footer,
    acceptLabel,
    declineLabel,
    onAccept,
    onDecline,
}) {
    const { colors, typography } = useTheme();

    return (
        <Modal visible={visible} animationType="fade" transparent onRequestClose={onDecline}>
            <View style={styles.overlay}>
                <View style={[styles.container, { backgroundColor: colors.bgSurface }]}>

                    <View style={[styles.iconCircle, { backgroundColor: colors.primaryLight }]}>
                        <Ionicons name={iconName} size={34} color={colors.primary} />
                    </View>

                    <Text style={[typography.h1, styles.title, { color: colors.textMain }]}>
                        {title}
                    </Text>

                    <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
                        {points.map(({ cle, icon, titre, texte }) => (
                            <View key={cle} style={styles.point}>
                                <Ionicons name={icon} size={22} color={colors.primary} />
                                <View style={styles.pointText}>
                                    <Text style={[styles.pointTitle, { color: colors.textMain }]}>
                                        {titre}
                                    </Text>
                                    <Text style={[styles.pointBody, { color: colors.textSecondary }]}>
                                        {texte}
                                    </Text>
                                </View>
                            </View>
                        ))}

                        {footer ? (
                            <Text style={[styles.legal, { color: colors.textSecondary }]}>{footer}</Text>
                        ) : null}
                    </ScrollView>

                    <View style={styles.actions}>
                        <Button title={acceptLabel} iconName="checkmark-outline" onPress={onAccept} />
                        <OutlineButton title={declineLabel} onPress={onDecline} />
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
    actions: { alignSelf: 'stretch', gap: 10, marginTop: 18 },
});
