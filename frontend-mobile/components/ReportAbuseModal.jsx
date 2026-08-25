import { ActivityIndicator, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { Button } from './ui/Button';
import { useTheme } from '../hooks/useTheme';

const REASONS = [
    { key: 'offensive', icon: 'warning-outline', label: 'Contenu offensant', hint: 'Insultes, haine, propos déplacés' },
    { key: 'spam', icon: 'megaphone-outline', label: 'Spam ou publicité', hint: 'Message sans rapport avec la sécurité à vélo' },
    { key: 'wrong_place', icon: 'location-outline', label: 'Signalement fantaisiste', hint: 'Danger inventé ou placé n’importe où' },
    { key: 'other', icon: 'ellipsis-horizontal-outline', label: 'Autre motif', hint: null },
];

const OUTCOMES = {
    reported: {
        icon: 'checkmark-circle',
        tone: 'success',
        title: 'Merci',
        body: "Votre signalement a été transmis. Nous l'examinons sous 24 heures.",
    },
    blocked: {
        icon: 'person-remove',
        tone: 'neutral',
        title: 'Auteur bloqué',
        body: "Vous ne verrez plus ses signalements. Vous pouvez revenir sur ce blocage dans les réglages.",
    },
    error: {
        icon: 'alert-circle',
        tone: 'error',
        title: 'Envoi impossible',
        body: "Votre signalement n'a pas pu être transmis. Vérifiez votre connexion et réessayez.",
    },
};

export default function ReportAbuseModal({ visible, status, onClose, onReport, onBlock }) {
    const { colors, typography } = useTheme();

    const choose = (action, arg) => {
        Haptics.selectionAsync().catch(() => { });
        action(arg);
    };

    const outcome = OUTCOMES[status] || null;
    const toneColor = {
        success: colors.primary,
        error: colors.error,
        neutral: colors.textSecondary,
    }[outcome?.tone] || colors.primary;

    const dismissable = status !== 'sending';

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={dismissable ? onClose : undefined}
        >
            <TouchableOpacity
                style={styles.overlay}
                activeOpacity={1}
                onPress={dismissable ? onClose : undefined}
            >
                <View
                    onStartShouldSetResponder={() => true}
                    style={[styles.container, { backgroundColor: colors.bgMain }]}
                >
                    {status === 'sending' && (
                        <View style={styles.centered}>
                            <ActivityIndicator size="large" color={colors.primary} />
                            <Text style={[styles.outcomeBody, { color: colors.textSecondary }]}>
                                Envoi en cours…
                            </Text>
                        </View>
                    )}

                    {outcome && (
                        <View style={styles.centered}>
                            <View style={[styles.outcomeCircle, { backgroundColor: colors.bgSurface }]}>
                                <Ionicons name={outcome.icon} size={40} color={toneColor} />
                            </View>
                            <Text style={[typography.h1, styles.outcomeTitle, { color: colors.textMain }]}>
                                {outcome.title}
                            </Text>
                            <Text style={[styles.outcomeBody, { color: colors.textSecondary }]}>
                                {outcome.body}
                            </Text>
                            <View style={styles.outcomeAction}>
                                <Button title="Fermer" onPress={onClose} />
                            </View>
                        </View>
                    )}

                    {!status && (
                        <>
                            <View style={styles.header}>
                                <Text style={[typography.h1, styles.title, { color: colors.textMain }]}>
                                    Signaler ce contenu
                                </Text>
                                <TouchableOpacity onPress={onClose} accessibilityLabel="Fermer">
                                    <Ionicons name="close" size={26} color={colors.textMain} />
                                </TouchableOpacity>
                            </View>

                            <Text style={[styles.lead, { color: colors.textSecondary }]}>
                                Nous examinons chaque signalement sous 24 heures. Au-delà de deux
                                signalements, le contenu disparaît de la carte en attendant notre décision.
                            </Text>

                            {REASONS.map(({ key, icon, label, hint }) => (
                                <TouchableOpacity
                                    key={key}
                                    style={[styles.row, { borderColor: colors.borderLight }]}
                                    onPress={() => choose(onReport, key)}
                                    accessibilityRole="button"
                                >
                                    <Ionicons name={icon} size={22} color={colors.error} />
                                    <View style={styles.rowText}>
                                        <Text style={[styles.rowLabel, { color: colors.textMain }]}>{label}</Text>
                                        {hint && <Text style={[styles.rowHint, { color: colors.textSecondary }]}>{hint}</Text>}
                                    </View>
                                    <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
                                </TouchableOpacity>
                            ))}

                            <TouchableOpacity
                                style={[styles.blockRow, { backgroundColor: colors.bgSurface }]}
                                onPress={() => choose(onBlock)}
                                accessibilityRole="button"
                            >
                                <Ionicons name="person-remove-outline" size={22} color={colors.textMain} />
                                <View style={styles.rowText}>
                                    <Text style={[styles.rowLabel, { color: colors.textMain }]}>Bloquer cet auteur</Text>
                                    <Text style={[styles.rowHint, { color: colors.textSecondary }]}>
                                        Vous ne verrez plus aucun de ses signalements. Réversible dans les réglages.
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            </TouchableOpacity>
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
    container: { width: '100%', maxWidth: 420, borderRadius: 18, padding: 20 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
    title: { fontSize: 19, lineHeight: 24, fontWeight: 'bold', flex: 1 },
    lead: { fontSize: 13, lineHeight: 18, marginBottom: 16 },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    rowText: { flex: 1 },
    rowLabel: { fontSize: 15, fontWeight: '600' },
    rowHint: { fontSize: 12, lineHeight: 16, marginTop: 2 },
    blockRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 12,
        borderRadius: 12,
        marginTop: 16,
    },
    centered: { alignItems: 'center', paddingVertical: 14 },
    outcomeCircle: {
        width: 72,
        height: 72,
        borderRadius: 36,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 14,
    },
    outcomeTitle: { fontSize: 19, lineHeight: 24, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' },
    outcomeBody: { fontSize: 14, lineHeight: 20, textAlign: 'center', marginTop: 8 },
    outcomeAction: { alignSelf: 'stretch', marginTop: 22 },
});
