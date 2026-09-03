import { ActivityIndicator, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';

import { Button } from './ui/Button';
import { useTheme } from '../hooks/useTheme';

// Les motifs portent l'identifiant transmis à l'API ; leurs libellés vivent dans
// le catalogue sous la même clé, et sont résolus au rendu.
const REASONS = [
    { key: 'offensive', icon: 'warning-outline', avecAide: true },
    { key: 'spam', icon: 'megaphone-outline', avecAide: true },
    { key: 'wrong_place', icon: 'location-outline', avecAide: true },
    { key: 'other', icon: 'ellipsis-horizontal-outline', avecAide: false },
];

const OUTCOMES = {
    reported: { icon: 'checkmark-circle', tone: 'success' },
    blocked: { icon: 'person-remove', tone: 'neutral' },
    error: { icon: 'alert-circle', tone: 'error' },
};

export default function ReportAbuseModal({ visible, status, onClose, onReport, onBlock }) {
    const { colors, typography } = useTheme();
    const { t } = useTranslation();

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
                                {t('carte.ui.abus.issue.envoiEnCours')}
                            </Text>
                        </View>
                    )}

                    {outcome && (
                        <View style={styles.centered}>
                            <View style={[styles.outcomeCircle, { backgroundColor: colors.bgSurface }]}>
                                <Ionicons name={outcome.icon} size={40} color={toneColor} />
                            </View>
                            <Text style={[typography.h1, styles.outcomeTitle, { color: colors.textMain }]}>
                                {/* i18n-suffixes: reported blocked error */}
                                {t(`carte.ui.abus.issue.${status}.titre`)}
                            </Text>
                            <Text style={[styles.outcomeBody, { color: colors.textSecondary }]}>
                                {/* i18n-suffixes: reported blocked error */}
                                {t(`carte.ui.abus.issue.${status}.corps`)}
                            </Text>
                            <View style={styles.outcomeAction}>
                                <Button title={t('carte.ui.fermer')} onPress={onClose} />
                            </View>
                        </View>
                    )}

                    {!status && (
                        <>
                            <View style={styles.header}>
                                <Text style={[typography.h1, styles.title, { color: colors.textMain }]}>
                                    {t('carte.ui.abus.titre')}
                                </Text>
                                <TouchableOpacity onPress={onClose} accessibilityLabel={t('carte.ui.fermer')}>
                                    <Ionicons name="close" size={26} color={colors.textMain} />
                                </TouchableOpacity>
                            </View>

                            <Text style={[styles.lead, { color: colors.textSecondary }]}>
                                {t('carte.ui.abus.delai')}
                            </Text>

                            {REASONS.map(({ key, icon, avecAide }) => (
                                <TouchableOpacity
                                    key={key}
                                    style={[styles.row, { borderColor: colors.borderLight }]}
                                    onPress={() => choose(onReport, key)}
                                    accessibilityRole="button"
                                >
                                    <Ionicons name={icon} size={22} color={colors.error} />
                                    <View style={styles.rowText}>
                                        <Text style={[styles.rowLabel, { color: colors.textMain }]}>
                                            {/* i18n-suffixes: offensive spam wrong_place other */}
                                            {t(`carte.ui.abus.motif.${key}.label`)}
                                        </Text>
                                        {avecAide && (
                                            <Text style={[styles.rowHint, { color: colors.textSecondary }]}>
                                                {/* « other » n'a pas d'aide, et REASONS le marque avecAide: false. */}
                                                {/* i18n-suffixes: offensive spam wrong_place */}
                                                {t(`carte.ui.abus.motif.${key}.aide`)}
                                            </Text>
                                        )}
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
                                    <Text style={[styles.rowLabel, { color: colors.textMain }]}>{t('carte.ui.abus.bloquer')}</Text>
                                    <Text style={[styles.rowHint, { color: colors.textSecondary }]}>
                                        {t('carte.ui.abus.bloquerAide')}
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
