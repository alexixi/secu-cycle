import React, { useEffect, useRef } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapComponent from './MapComponent';

const ROUTE_TYPE_LABELS = {
    fast: "Rapide",
    safe: "Sécurisé",
    compromise: "Compromis",
};

export default function HistoricModal({ isOpen, onClose, entry, onDelete, colors }) {
    const screenHeight = Dimensions.get('window').height;
    const slideAnim = useRef(new Animated.Value(screenHeight)).current;

    useEffect(() => {
        if (isOpen) {
            Animated.spring(slideAnim, {
                toValue: 0,
                useNativeDriver: true,
                tension: 50,
                friction: 7
            }).start();
        }
    }, [isOpen]);

    const handleClose = () => {
        Animated.timing(slideAnim, {
            toValue: screenHeight,
            duration: 300,
            useNativeDriver: true,
        }).start(() => {
            onClose();
        });
    };

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
        <Modal visible={isOpen} animationType="fade" transparent={true} onRequestClose={handleClose}>
            <View style={styles.overlay}>
                <TouchableOpacity
                    style={StyleSheet.absoluteFill}
                    activeOpacity={1}
                    onPress={handleClose}
                />

                <Animated.View style={[
                    styles.modalContainer,
                    {
                        backgroundColor: colors.bgSurface,
                        transform: [{ translateY: slideAnim }]
                    }
                ]}>
                    <View style={styles.header}>
                        <Text style={[styles.title, { color: colors.textMain }]}>Détails du trajet</Text>
                        <TouchableOpacity onPress={handleClose}>
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
                                <Text style={[styles.statValue, { color: colors.textMain }]}>{route.distance_km.toFixed(2)} km</Text>
                                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Distance</Text>
                            </View>
                            <View style={styles.statItem}>
                                <Ionicons name="time-outline" size={20} color="#F59E0B" />
                                <Text style={[styles.statValue, { color: colors.textMain }]}>{Math.round(route.duration_min)} min</Text>
                                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Durée</Text>
                            </View>
                            <View style={styles.statItem}>
                                <Ionicons name="shield-checkmark-outline" size={20} color="#059669" />
                                <Text style={[styles.statValue, { color: colors.textMain }]}>{ROUTE_TYPE_LABELS[route.route_type]}</Text>
                                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Type</Text>
                            </View>
                        </View>

                        <Text style={[styles.dateText, { color: colors.textSecondary }]}>Effectué le {date}</Text>
                    </ScrollView>

                    <TouchableOpacity
                        style={[styles.deleteButton, { backgroundColor: colors.error }]}
                        onPress={() => {
                            Animated.timing(slideAnim, {
                                toValue: screenHeight,
                                duration: 200,
                                useNativeDriver: true,
                            }).start(() => {
                                onDelete(entry.id);
                            });
                        }}
                    >
                        <Ionicons name="trash-outline" size={20} color={colors.textMain} />
                        <Text style={[styles.deleteButtonText, { color: colors.textMain }]}>
                            Supprimer le trajet
                        </Text>
                    </TouchableOpacity>
                </Animated.View>
            </View>
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
