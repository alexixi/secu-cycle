import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapComponent from './MapComponent';

const ROUTE_TYPE_LABELS = {
    fast: "Rapide",
    safe: "Sécurisé",
    compromise: "Compromis",
};

export default function HistoricModal({ isOpen, onClose, entry, onDelete, colors }) {
    if (!entry) return null;

    const { route } = entry;
    const date = new Date(entry.created_at).toLocaleDateString('fr-FR', {
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
        <Modal visible={isOpen} animationType="slide" transparent={true}>
            <View style={styles.overlay}>
                <View style={[styles.modalContainer, { backgroundColor: colors.bgSurface }]}>
                    <View style={styles.header}>
                        <Text style={[styles.title, { color: colors.textMain }]}>Détails du trajet</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={28} color={colors.textMain} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView contentContainerStyle={styles.content}>
                        <View style={styles.mapContainer}>
                            <MapComponent
                                start={route.start_coordinates}
                                end={route.end_coordinates}
                                itineraires={itineraires}
                                selectedItineraire="hist"
                                isNavigating={false}
                                customPadding={{ top: 40, right: 40, bottom: 40, left: 40 }}
                            />
                        </View>

                        <View style={styles.infoSection}>
                            <View style={styles.addressRow}>
                                <Ionicons name="location" size={20} color="#EF4444" />
                                <Text style={[styles.addressText, { color: colors.textMain }]}>{route.start_address}</Text>
                            </View>
                            <View style={styles.verticalLine} />
                            <View style={styles.addressRow}>
                                <Ionicons name="flag" size={20} color="#10B981" />
                                <Text style={[styles.addressText, { color: colors.textMain }]}>{route.end_address}</Text>
                            </View>
                        </View>

                        <View style={styles.statsRow}>
                            <View style={styles.statItem}>
                                <Ionicons name="navigate-outline" size={20} color={colors.primary} />
                                <Text style={styles.statValue}>{route.distance_km.toFixed(2)} km</Text>
                                <Text style={styles.statLabel}>Distance</Text>
                            </View>
                            <View style={styles.statItem}>
                                <Ionicons name="time-outline" size={20} color="#F59E0B" />
                                <Text style={styles.statValue}>{Math.round(route.duration_min)} min</Text>
                                <Text style={styles.statLabel}>Durée</Text>
                            </View>
                            <View style={styles.statItem}>
                                <Ionicons name="shield-checkmark-outline" size={20} color="#059669" />
                                <Text style={styles.statValue}>{ROUTE_TYPE_LABELS[route.route_type]}</Text>
                                <Text style={styles.statLabel}>Type</Text>
                            </View>
                        </View>

                        <Text style={[styles.dateText, { color: colors.textSecondary }]}>Effectué le {date}</Text>
                    </ScrollView>

                    <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => onDelete(entry.id)}
                    >
                        <Ionicons name="trash-outline" size={20} color="#FFF" />
                        <Text style={styles.deleteButtonText}>Supprimer le trajet</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContainer: { borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 20, maxHeight: '90%' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    title: { fontSize: 20, fontWeight: 'bold' },
    mapPlaceholder: { height: 180, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginBottom: 20, borderStyle: 'dashed', borderWidth: 1 },
    infoSection: { marginBottom: 20 },
    addressRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    addressText: { fontSize: 14, flex: 1 },
    verticalLine: { width: 2, height: 20, backgroundColor: '#DDD', marginLeft: 9, marginVertical: 2 },
    statsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 20, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#EEE' },
    statItem: { alignItems: 'center', flex: 1 },
    statValue: { fontWeight: 'bold', fontSize: 16, marginTop: 5 },
    statLabel: { fontSize: 12, color: '#666' },
    dateText: { textAlign: 'center', marginTop: 20, fontSize: 12 },
    deleteButton: { backgroundColor: '#EF4444', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 15, borderRadius: 12, marginTop: 20, gap: 10 },
    deleteButtonText: { color: '#FFF', fontWeight: 'bold' },
    mapContainer: {
        height: 250, // CRITIQUE : Donne une hauteur fixe
        width: '100%',
        borderRadius: 20,
        overflow: 'hidden', // Pour que la carte respecte les bords arrondis
        marginBottom: 20,
        backgroundColor: '#f0f0f0', // Fond gris pendant le chargement
    },
});