import React from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { GestureHandlerRootView, GestureDetector } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import MapComponent from './MapComponent';
import { useDragToDismiss } from '../hooks/useDragToDismiss';
import { useFormat } from '../hooks/useFormat';
import { GrabHandle } from './ui/GrabHandle';
import * as Haptics from 'expo-haptics';

export default function HistoricModal({ isOpen, onClose, entry, onDelete, colors }) {
    const { gesture, sheetStyle, close, dismiss } = useDragToDismiss({ visible: isOpen, onClose });
    const { t } = useTranslation();
    const f = useFormat();

    if (!entry) return null;

    const { route } = entry;
    const date = f.date(entry.created_at, {
        day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    const itineraryPath = route.path || [
        { lat: route.start_coordinates.lat, lon: route.start_coordinates.lon },
        { lat: route.end_coordinates.lat, lon: route.end_coordinates.lon }
    ];

    const itineraires = [{
        id: "hist",
        path: itineraryPath
    }];

    return (
        <Modal visible={isOpen} animationType="fade" transparent={true} onRequestClose={close}>
            <GestureHandlerRootView style={{ flex: 1 }}>
                <View style={styles.overlay}>
                    <TouchableOpacity
                        style={StyleSheet.absoluteFill}
                        activeOpacity={1}
                        onPress={close}
                    />

                    <Animated.View style={[
                        styles.modalContainer,
                        { backgroundColor: colors.bgSurface },
                        sheetStyle,
                    ]}>
                        <GestureDetector gesture={gesture}>
                            <View>
                                <GrabHandle />
                                <View style={styles.header}>
                                    <Text style={[styles.title, { color: colors.textMain }]}>{t('compte.modales.historique.titre')}</Text>
                                    <TouchableOpacity onPress={close}>
                                        <Ionicons name="close" size={28} color={colors.textMain} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </GestureDetector>

                        <ScrollView contentContainerStyle={styles.content}>
                            <View style={styles.mapContainer}>
                                <MapComponent
                                    start={route.start_coordinates}
                                    end={route.end_coordinates}
                                    itineraires={itineraires}
                                    selectedItineraire="hist"
                                    isNavigating={false}
                                    miniMap={true}
                                />
                            </View>

                            <View style={styles.infoSection}>
                                <View style={styles.addressRow}>
                                    <Ionicons name="location" size={20} color={colors.error} />
                                    <Text style={[styles.addressText, { color: colors.textMain }]}>{route.start_address}</Text>
                                </View>
                                <View style={[styles.verticalLine, { backgroundColor: colors.borderStrong }]} />
                                <View style={styles.addressRow}>
                                    <Ionicons name="flag" size={20} color="#10B981" />
                                    <Text style={[styles.addressText, { color: colors.textMain }]}>{route.end_address}</Text>
                                </View>
                            </View>

                            <View style={[styles.statsRow, { borderColor: colors.borderStrong }]}>
                                <View style={styles.statItem}>
                                    <Ionicons name="navigate-outline" size={20} color={colors.primary} />
                                    <Text style={[styles.statValue, { color: colors.textMain }]}>{t('compte.historique.kilometres', { valeur: f.nombre(route.distance_km, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) })}</Text>
                                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('compte.historique.distance')}</Text>
                                </View>
                                <View style={styles.statItem}>
                                    <Ionicons name="time-outline" size={20} color="#F59E0B" />
                                    <Text style={[styles.statValue, { color: colors.textMain }]}>{t('compte.historique.minutes', { valeur: f.nombre(Math.round(route.duration_min)) })}</Text>
                                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('compte.historique.duree')}</Text>
                                </View>
                                <View style={styles.statItem}>
                                    <Ionicons name="shield-checkmark-outline" size={20} color="#059669" />
                                    {/* i18n-suffixes: safe fast compromise */}
                                    <Text style={[styles.statValue, { color: colors.textMain }]}>{t(`itineraire.variant.${route.route_type}`)}</Text>
                                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('compte.historique.type')}</Text>
                                </View>
                            </View>

                            <Text style={[styles.dateText, { color: colors.textSecondary }]}>{t('compte.historique.effectueLe', { date })}</Text>
                        </ScrollView>

                        <TouchableOpacity
                            style={[styles.deleteButton, { backgroundColor: colors.error }]}
                            onPress={() => {
                                Haptics.selectionAsync();
                                dismiss(() => onDelete(entry.id));
                            }}
                        >
                            <Ionicons name="trash-outline" size={20} color={colors.textMain} />
                            <Text style={[styles.deleteButtonText, { color: colors.textMain }]}>
                                {t('compte.historique.supprimerTrajet')}
                            </Text>
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            </GestureHandlerRootView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContainer: { borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 20, maxHeight: '90%' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    title: { fontSize: 20, fontWeight: 'bold' },
    infoSection: { marginBottom: 20 },
    addressRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    addressText: { fontSize: 14, flex: 1 },
    verticalLine: { width: 2, height: 20, marginLeft: 9, marginVertical: 2 },
    statsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 20, borderTopWidth: 1, borderBottomWidth: 1 },
    statItem: { alignItems: 'center', flex: 1 },
    statValue: { fontWeight: 'bold', fontSize: 16, marginTop: 5 },
    statLabel: { fontSize: 12, marginTop: 2 },
    dateText: { textAlign: 'center', marginTop: 20, fontSize: 12 },
    deleteButton: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 15, borderRadius: 12, marginTop: 20, gap: 10 },
    deleteButtonText: { fontWeight: 'bold' },
    mapContainer: {
        height: 250,
        width: '100%',
        borderRadius: 20,
        overflow: 'hidden',
        marginBottom: 20,
    },
});
