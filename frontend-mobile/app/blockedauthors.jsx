import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { SwipeBackScreen } from '../components/SwipeBackScreen';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../hooks/useTheme';
import { getMyBlocks, unblockUser } from '../services/apiBack';

const formatDate = (iso) => {
    if (!iso) return '';
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
};

export default function BlockedAuthorsPage() {
    const { colors } = useTheme();
    const { token } = useAuth();

    const [blocks, setBlocks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(false);

    useFocusEffect(
        useCallback(() => {
            let annule = false;
            setIsLoading(true);
            getMyBlocks(token)
                .then((data) => { if (!annule) { setBlocks(data || []); setError(false); } })
                .catch(() => { if (!annule) setError(true); })
                .finally(() => { if (!annule) setIsLoading(false); });
            return () => { annule = true; };
        }, [token]),
    );

    const handleUnblock = async (blockedId) => {
        Haptics.selectionAsync().catch(() => { });
        // Optimiste : la liste est courte et l'appel idempotent côté serveur.
        setBlocks((prev) => prev.filter((b) => b.blocked_id !== blockedId));
        try {
            await unblockUser(token, blockedId);
        } catch (e) {
            console.warn('Déblocage impossible :', e);
            setError(true);
        }
    };

    return (
        <SwipeBackScreen background={colors.bgMain}>
            {(close) => (
                <ScrollView
                    style={[styles.container, { backgroundColor: colors.bgMain }]}
                    contentContainerStyle={styles.scrollContainer}
                >
                    <ScreenHeader title="Auteurs bloqués" onBack={close} />

                    <Text style={[styles.lead, { color: colors.textSecondary }]}>
                        Vous ne voyez plus les signalements de ces personnes. Les débloquer les
                        fera réapparaître sur la carte.
                    </Text>

                    {isLoading && <ActivityIndicator size="small" color={colors.primary} style={styles.loader} />}

                    {!isLoading && error && (
                        <Text style={[styles.empty, { color: colors.error }]}>
                            La liste n&apos;a pas pu être chargée.
                        </Text>
                    )}

                    {!isLoading && !error && blocks.length === 0 && (
                        <View style={styles.emptyBox}>
                            <Ionicons name="people-outline" size={40} color={colors.textSecondary} />
                            <Text style={[styles.empty, { color: colors.textSecondary }]}>
                                Vous n&apos;avez bloqué personne.
                            </Text>
                        </View>
                    )}

                    {blocks.map((block) => (
                        <View
                            key={block.blocked_id}
                            style={[styles.row, { backgroundColor: colors.bgSurface }]}
                        >
                            <Ionicons name="person-outline" size={22} color={colors.textSecondary} />
                            <View style={styles.rowText}>
                                <Text style={[styles.rowTitle, { color: colors.textMain }]}>
                                    Auteur bloqué
                                </Text>
                                <Text style={[styles.rowHint, { color: colors.textSecondary }]}>
                                    Depuis le {formatDate(block.created_at)}
                                </Text>
                            </View>
                            <TouchableOpacity
                                onPress={() => handleUnblock(block.blocked_id)}
                                accessibilityRole="button"
                                accessibilityLabel="Débloquer cet auteur"
                            >
                                <Text style={[styles.unblock, { color: colors.primary }]}>Débloquer</Text>
                            </TouchableOpacity>
                        </View>
                    ))}
                </ScrollView>
            )}
        </SwipeBackScreen>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContainer: { padding: 20, paddingBottom: 50, flexGrow: 1 },
    lead: { fontSize: 13, lineHeight: 19, marginBottom: 20 },
    loader: { marginTop: 20 },
    emptyBox: { alignItems: 'center', gap: 12, marginTop: 40 },
    empty: { fontSize: 14, textAlign: 'center' },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 14,
        borderRadius: 12,
        marginBottom: 10,
    },
    rowText: { flex: 1 },
    rowTitle: { fontSize: 15, fontWeight: '600' },
    rowHint: { fontSize: 12, marginTop: 2 },
    unblock: { fontSize: 14, fontWeight: '600' },
});
