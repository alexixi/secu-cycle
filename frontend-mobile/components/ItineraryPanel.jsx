import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Animated, Modal, Dimensions } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useRef, useEffect, useState } from 'react';
import { useTheme } from '../hooks/useTheme';

const ROUTE_LABELS = {
    fast: { label: "Rapide", icon: "lightning-bolt", color: "#F59E0B" },
    safe: { label: "Sécurisé", icon: "shield-check", color: "#10B981" },
    compromise: { label: "Compromis", icon: "scale-balance", color: "#6366F1" },
};

function DetailModal({ itineraire, visible, onClose, colors, typography }) {
    if (!itineraire) return null;

    const meta = ROUTE_LABELS[itineraire.id] ?? { label: itineraire.name, icon: "map-marker-path", color: colors.primary };

    const elevationData = itineraire.path
        ?.filter(p => p[2] !== undefined && p[2] !== null)
        .map((p, i) => ({ x: i, y: parseFloat(p[2]) })) ?? [];

    const minEle = elevationData.length > 0 ? Math.min(...elevationData.map(d => d.y)) : 0;
    const maxEle = elevationData.length > 0 ? Math.max(...elevationData.map(d => d.y)) : 0;
    const screenWidth = Dimensions.get('window').width;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <TouchableOpacity
                style={styles.modalOverlay}
                activeOpacity={1}
                onPress={onClose}
            >
                <TouchableOpacity
                    activeOpacity={1}
                    style={[styles.modalContent, { backgroundColor: colors.bgSurface }]}
                >
                    <View style={styles.modalHeader}>
                        <View style={styles.modalTitleRow}>
                            <View style={[styles.iconBadge, { backgroundColor: meta.color + '22' }]}>
                                <MaterialCommunityIcons name={meta.icon} size={20} color={meta.color} />
                            </View>
                            <Text style={[styles.modalTitle, { color: colors.textMain }]}>
                                {meta.label}
                            </Text>
                        </View>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={26} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    <View style={[styles.mainStatsRow, { borderColor: colors.borderLight }]}>
                        <View style={styles.mainStat}>
                            <Ionicons name="time-outline" size={22} color={colors.primary} />
                            <Text style={[styles.mainStatValue, { color: colors.textMain }]}>
                                {Math.round(itineraire.duration)} min
                            </Text>
                            <Text style={[styles.mainStatLabel, { color: colors.textSecondary }]}>Durée</Text>
                        </View>
                        <View style={[styles.mainStatDivider, { backgroundColor: colors.borderLight }]} />
                        <View style={styles.mainStat}>
                            <MaterialCommunityIcons name="map-marker-distance" size={22} color={colors.primary} />
                            <Text style={[styles.mainStatValue, { color: colors.textMain }]}>
                                {itineraire.distance.toFixed(2)} km
                            </Text>
                            <Text style={[styles.mainStatLabel, { color: colors.textSecondary }]}>Distance</Text>
                        </View>
                    </View>

                    <View style={[styles.elevationRow, { backgroundColor: colors.bgMain, borderColor: colors.borderLight }]}>
                        <View style={styles.elevationItem}>
                            <Ionicons name="trending-up-outline" size={18} color="#EF4444" />
                            <Text style={[styles.elevationValue, { color: colors.textMain }]}>
                                +{itineraire.height_difference[0]} m
                            </Text>
                            <Text style={[styles.elevationLabel, { color: colors.textSecondary }]}>
                                Dénivelé +
                            </Text>
                        </View>
                        <View style={[styles.mainStatDivider, { backgroundColor: colors.borderLight }]} />
                        <View style={styles.elevationItem}>
                            <Ionicons name="trending-down-outline" size={18} color="#10B981" />
                            <Text style={[styles.elevationValue, { color: colors.textMain }]}>
                                -{itineraire.height_difference[1]} m
                            </Text>
                            <Text style={[styles.elevationLabel, { color: colors.textSecondary }]}>
                                Dénivelé -
                            </Text>
                        </View>
                        <View style={[styles.mainStatDivider, { backgroundColor: colors.borderLight }]} />
                        <View style={styles.elevationItem}>
                            <MaterialCommunityIcons name="image-filter-hdr" size={18} color={colors.textSecondary} />
                            <Text style={[styles.elevationValue, { color: colors.textMain }]}>
                                {Math.round(minEle)}–{Math.round(maxEle)} m
                            </Text>
                            <Text style={[styles.elevationLabel, { color: colors.textSecondary }]}>
                                Altitude
                            </Text>
                        </View>
                    </View>

                    {itineraire.infra_stats && (
                        <View style={styles.infraSection}>
                            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                                Infrastructure
                            </Text>
                            <View style={styles.infraGrid}>
                                <View style={[styles.infraCard, { backgroundColor: '#10B98115', borderColor: '#10B98130' }]}>
                                    <MaterialCommunityIcons name="bicycle" size={20} color="#10B981" />
                                    <Text style={[styles.infraValue, { color: '#10B981' }]}>
                                        {itineraire.infra_stats.pct_cyclable}%
                                    </Text>
                                    <Text style={[styles.infraLabel, { color: colors.textSecondary }]}>
                                        Piste cyclable
                                    </Text>
                                </View>
                                <View style={[styles.infraCard, { backgroundColor: '#6366F115', borderColor: '#6366F130' }]}>
                                    <MaterialCommunityIcons name="speedometer-slow" size={20} color="#6366F1" />
                                    <Text style={[styles.infraValue, { color: '#6366F1' }]}>
                                        {itineraire.infra_stats.pct_low_speed}%
                                    </Text>
                                    <Text style={[styles.infraLabel, { color: colors.textSecondary }]}>
                                        Zone ≤30 km/h
                                    </Text>
                                </View>
                                <View style={[styles.infraCard, { backgroundColor: '#F59E0B15', borderColor: '#F59E0B30' }]}>
                                    <Ionicons name="bulb-outline" size={20} color="#F59E0B" />
                                    <Text style={[styles.infraValue, { color: '#F59E0B' }]}>
                                        {itineraire.infra_stats.pct_lit}%
                                    </Text>
                                    <Text style={[styles.infraLabel, { color: colors.textSecondary }]}>
                                        Éclairé
                                    </Text>
                                </View>
                            </View>
                        </View>
                    )}
                </TouchableOpacity>
            </TouchableOpacity>
        </Modal>
    );
}

export default function ItineraryPanel({ itineraires, selectedItineraire, setSelectedItineraire }) {
    const { colors, typography } = useTheme();
    const slideAnim = useRef(new Animated.Value(200)).current;
    const [detailItineraire, setDetailItineraire] = useState(null);

    useEffect(() => {
        if (itineraires?.length > 0) {
            Animated.spring(slideAnim, {
                toValue: 0,
                useNativeDriver: true,
                tension: 60,
                friction: 8,
            }).start();
        } else {
            Animated.timing(slideAnim, {
                toValue: 200,
                duration: 200,
                useNativeDriver: true,
            }).start();
        }
    }, [itineraires]);

    if (!itineraires?.length) return null;

    return (
        <>
            <Animated.View style={[styles.container, { transform: [{ translateY: slideAnim }] }]}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                >
                    {itineraires.map((it) => {
                        const isSelected = selectedItineraire === it.id;
                        const meta = ROUTE_LABELS[it.id] ?? { label: it.name, icon: "map-marker-path", color: colors.primary };

                        return (
                            <TouchableOpacity
                                key={it.id}
                                style={[
                                    styles.card,
                                    { backgroundColor: colors.bgSurface, borderColor: colors.borderLight },
                                    isSelected && { borderColor: meta.color, backgroundColor: colors.bgMain }
                                ]}
                                onPress={() => setSelectedItineraire(it.id)}
                                activeOpacity={0.8}
                            >
                                <View style={styles.cardHeader}>
                                    <View style={[styles.iconBadge, { backgroundColor: meta.color + '22' }]}>
                                        <MaterialCommunityIcons name={meta.icon} size={16} color={meta.color} />
                                    </View>
                                    <Text style={[styles.cardTitle, { color: isSelected ? meta.color : colors.textMain }]}>
                                        {meta.label}
                                    </Text>
                                    {isSelected && (
                                        <Ionicons name="checkmark-circle" size={16} color={meta.color} style={{ marginLeft: 'auto' }} />
                                    )}
                                </View>

                                <View style={styles.statsRow}>
                                    <View style={styles.stat}>
                                        <Ionicons name="time-outline" size={13} color={colors.textSecondary} />
                                        <Text style={[styles.statValue, { color: colors.textMain }]}>
                                            {Math.round(it.duration)} min
                                        </Text>
                                    </View>
                                    <View style={[styles.statDivider, { backgroundColor: colors.borderLight }]} />
                                    <View style={styles.stat}>
                                        <MaterialCommunityIcons name="map-marker-distance" size={13} color={colors.textSecondary} />
                                        <Text style={[styles.statValue, { color: colors.textMain }]}>
                                            {it.distance.toFixed(1)} km
                                        </Text>
                                    </View>
                                </View>

                                <TouchableOpacity
                                    style={[styles.infoButton, { borderColor: colors.borderLight }]}
                                    onPress={() => setDetailItineraire(it)}
                                >
                                    <Ionicons name="information-circle-outline" size={14} color={colors.textSecondary} />
                                    <Text style={[styles.infoButtonText, { color: colors.textSecondary }]}>
                                        Plus de détails
                                    </Text>
                                </TouchableOpacity>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </Animated.View>

            <DetailModal
                itineraire={detailItineraire}
                visible={!!detailItineraire}
                onClose={() => setDetailItineraire(null)}
                colors={colors}
                typography={typography}
            />
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 90,
        left: 0,
        right: 0,
    },
    scrollContent: {
        paddingHorizontal: 15,
        gap: 12,
    },
    card: {
        width: 180,
        padding: 14,
        borderRadius: 18,
        borderWidth: 2,
        gap: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    iconBadge: {
        padding: 5,
        borderRadius: 8,
    },
    cardTitle: {
        fontSize: 14,
        fontWeight: '700',
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    stat: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    statValue: {
        fontSize: 13,
        fontWeight: '600',
    },
    statDivider: {
        width: 1,
        height: 14,
    },
    infoButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        paddingVertical: 6,
        borderRadius: 10,
        borderWidth: 1,
    },
    infoButtonText: {
        fontSize: 12,
    },
    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: 40,
        gap: 16,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    modalTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
    },
    mainStatsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 16,
        borderTopWidth: 1,
        borderBottomWidth: 1,
    },
    mainStat: {
        alignItems: 'center',
        gap: 4,
        flex: 1,
    },
    mainStatValue: {
        fontSize: 18,
        fontWeight: '700',
    },
    mainStatLabel: {
        fontSize: 12,
    },
    mainStatDivider: {
        width: 1,
    },
    elevationRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        padding: 14,
        borderRadius: 14,
        borderWidth: 1,
    },
    elevationItem: {
        alignItems: 'center',
        gap: 4,
        flex: 1,
    },
    elevationValue: {
        fontSize: 14,
        fontWeight: '600',
    },
    elevationLabel: {
        fontSize: 11,
    },
    sectionLabel: {
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 4,
        alignSelf: 'flex-start',
    },
    infraSection: {
        gap: 10,
    },
    infraGrid: {
        flexDirection: 'row',
        gap: 10,
    },
    infraCard: {
        flex: 1,
        alignItems: 'center',
        padding: 12,
        borderRadius: 14,
        borderWidth: 1,
        gap: 4,
    },
    infraValue: {
        fontSize: 16,
        fontWeight: '700',
    },
    infraLabel: {
        fontSize: 11,
        textAlign: 'center',
    },
});
