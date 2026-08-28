import { View, Text, ScrollView, TouchableOpacity, Pressable, StyleSheet, Animated, Modal, Dimensions } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useRef, useEffect, useMemo } from 'react';
import { useFormat } from '../hooks/useFormat';
import { useTheme } from '../hooks/useTheme';
import { withAlpha } from '../constants/theme';
import { useDragToDismiss } from '../hooks/useDragToDismiss';
import { GrabHandle } from './ui/GrabHandle';
import { GestureHandlerRootView, GestureDetector } from 'react-native-gesture-handler';
import Reanimated from 'react-native-reanimated';
import { VictoryArea, VictoryChart, VictoryAxis, VictoryTooltip, VictoryVoronoiContainer } from 'victory-native';
import { weatherSummary } from '../services/weather';
import { useTranslation } from 'react-i18next';

const ROUTE_LABELS = {
    fast: { label: "Rapide", icon: "lightning-bolt", color: "#F59E0B" },
    safe: { label: "Sécurisé", icon: "shield-check", color: "#10B981" },
    compromise: { label: "Compromis", icon: "scale-balance", color: "#6366F1" },
};

function DetailModal({ itineraire, visible, onClose, colors, typography, weather }) {
    const { t } = useTranslation();
    const f = useFormat();
    const summary = weatherSummary(weather);
    const screenWidth = Dimensions.get('window').width;
    const { gesture, sheetStyle, close } = useDragToDismiss({ visible, onClose });

    const elevationData = useMemo(() => {
        if (!itineraire?.path) return [];

        const raw = itineraire.path
            .filter(p => p[2] !== undefined && p[2] !== null)
            .map((p, i) => ({ x: i, y: parseFloat(p[2]) }));

        const step = Math.max(1, Math.floor(raw.length / 100));
        return raw.filter((_, i) => i % step === 0);
    }, [itineraire?.path]);

    if (!itineraire) return null;

    const meta = ROUTE_LABELS[itineraire.id] ?? { label: itineraire.name, icon: "map-marker-path", color: colors.primary };

    const minEle = elevationData.length > 0 ? Math.min(...elevationData.map(d => d.y)) : 0;
    const maxEle = elevationData.length > 0 ? Math.max(...elevationData.map(d => d.y)) : 0;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={close}
        >
            <GestureHandlerRootView style={{ flex: 1 }}>
            <View style={styles.modalOverlay}>
                <Pressable style={StyleSheet.absoluteFill} onPress={close} />

                <Reanimated.View
                    style={[
                        styles.modalContent,
                        { backgroundColor: colors.bgSurface },
                        sheetStyle,
                    ]}
                >
                    <GestureDetector gesture={gesture}>
                    <View>
                        <GrabHandle />
                        <View style={styles.modalHeader}>
                        <View style={styles.modalTitleRow}>
                            <View style={[styles.iconBadge, { backgroundColor: meta.color + '22' }]}>
                                <MaterialCommunityIcons name={meta.icon} size={20} color={meta.color} />
                            </View>
                            <Text style={[styles.modalTitle, { color: colors.textMain }]}>
                                {meta.label}
                            </Text>
                        </View>
                        <TouchableOpacity onPress={close}>
                            <Ionicons name="close" size={26} color={colors.textSecondary} />
                        </TouchableOpacity>
                        </View>
                    </View>
                    </GestureDetector>

                    <View style={[styles.mainStatsRow, { borderColor: colors.borderLight }]}>
                        <View style={styles.mainStat}>
                            <Ionicons name="time-outline" size={22} color={colors.primary} />
                            <Text style={[styles.mainStatValue, { color: colors.textMain }]}>
                                {t('itineraire.panneau.minutes', { n: f.nombre(Math.round(itineraire.duration)) })}
                            </Text>
                            <Text style={[styles.mainStatLabel, { color: colors.textSecondary }]}>{t('itineraire.panneau.duree')}</Text>
                        </View>
                        <View style={[styles.mainStatDivider, { backgroundColor: colors.borderLight }]} />
                        <View style={styles.mainStat}>
                            <MaterialCommunityIcons name="map-marker-distance" size={22} color={colors.primary} />
                            <Text style={[styles.mainStatValue, { color: colors.textMain }]}>
                                {t('itineraire.panneau.kilometres', { n: f.nombre(itineraire.distance, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) })}
                            </Text>
                            <Text style={[styles.mainStatLabel, { color: colors.textSecondary }]}>{t('itineraire.panneau.distance')}</Text>
                        </View>
                    </View>

                    <View style={[styles.elevationRow, { backgroundColor: colors.bgMain, borderColor: colors.borderLight }]}>
                        <View style={styles.elevationItem}>
                            <Ionicons name="trending-up-outline" size={18} color="#EF4444" />
                            <Text style={[styles.elevationValue, { color: colors.textMain }]}>
                                {t('itineraire.panneau.metresPositif', { n: f.nombre(itineraire.height_difference[0]) })}
                            </Text>
                            <Text style={[styles.elevationLabel, { color: colors.textSecondary }]}>
                                {t('itineraire.panneau.denivelePositif')}
                            </Text>
                        </View>
                        <View style={[styles.mainStatDivider, { backgroundColor: colors.borderLight }]} />
                        <View style={styles.elevationItem}>
                            <Ionicons name="trending-down-outline" size={18} color="#10B981" />
                            <Text style={[styles.elevationValue, { color: colors.textMain }]}>
                                {t('itineraire.panneau.metresNegatif', { n: f.nombre(itineraire.height_difference[1]) })}
                            </Text>
                            <Text style={[styles.elevationLabel, { color: colors.textSecondary }]}>
                                {t('itineraire.panneau.deniveleNegatif')}
                            </Text>
                        </View>
                        <View style={[styles.mainStatDivider, { backgroundColor: colors.borderLight }]} />
                        <View style={styles.elevationItem}>
                            <MaterialCommunityIcons name="image-filter-hdr" size={18} color={colors.textSecondary} />
                            <Text style={[styles.elevationValue, { color: colors.textMain }]}>
                                {t('itineraire.panneau.plageAltitude', { min: f.nombre(Math.round(minEle)), max: f.nombre(Math.round(maxEle)) })}
                            </Text>
                            <Text style={[styles.elevationLabel, { color: colors.textSecondary }]}>
                                {t('itineraire.panneau.altitude')}
                            </Text>
                        </View>
                    </View>

                    {elevationData.length > 1 && (
                        <View style={styles.chartSection}>
                            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                                {t('itineraire.panneau.profilAltimetrique')}
                            </Text>
                            <VictoryChart
                                width={screenWidth - 80}
                                height={150}
                                padding={{ top: 10, bottom: 30, left: 45, right: 10 }}
                                containerComponent={
                                    <VictoryVoronoiContainer
                                        labels={({ datum }) => `${Math.round(datum.y)} m`}
                                        labelComponent={
                                            <VictoryTooltip
                                                flyoutStyle={{
                                                    fill: colors.bgSurface,
                                                    stroke: colors.primary,
                                                    strokeWidth: 1,
                                                }}
                                                style={{ fill: colors.textMain, fontSize: 11 }}
                                            />
                                        }
                                    />
                                }
                            >
                                <VictoryAxis
                                    style={{
                                        axis: { stroke: colors.borderLight },
                                        tickLabels: { fill: colors.textSecondary, fontSize: 10 },
                                        grid: { stroke: 'transparent' },
                                    }}
                                    tickFormat={() => ''}
                                />
                                <VictoryAxis
                                    dependentAxis
                                    style={{
                                        axis: { stroke: colors.borderLight },
                                        tickLabels: { fill: colors.textSecondary, fontSize: 10 },
                                        grid: { stroke: colors.borderLight, strokeDasharray: '4,4' },
                                    }}
                                    tickFormat={(valeur) => t('itineraire.panneau.metres', { n: Math.round(valeur) })}
                                    tickCount={4}
                                />
                                <VictoryArea
                                    data={elevationData}
                                    style={{
                                        data: {
                                            fill: colors.primary,
                                            fillOpacity: 0.2,
                                            stroke: colors.primary,
                                            strokeWidth: 2,
                                        }
                                    }}
                                    interpolation="monotoneX"
                                />
                            </VictoryChart>
                        </View>
                    )}


                    {itineraire.infra_stats && (
                        <View style={styles.infraSection}>
                            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                                {t('itineraire.panneau.infrastructure')}
                            </Text>
                            <View style={styles.infraGrid}>
                                <View style={[styles.infraCard, { backgroundColor: '#10B98115', borderColor: '#10B98130' }]}>
                                    <MaterialCommunityIcons name="bicycle" size={20} color="#10B981" />
                                    <Text style={[styles.infraValue, { color: '#10B981' }]}>
                                        {t('itineraire.panneau.pourcentage', { n: f.nombre(itineraire.infra_stats.pct_cyclable) })}
                                    </Text>
                                    <Text style={[styles.infraLabel, { color: colors.textSecondary }]}>
                                        {t('itineraire.panneau.pisteCyclable')}
                                    </Text>
                                </View>
                                <View style={[styles.infraCard, { backgroundColor: '#6366F115', borderColor: '#6366F130' }]}>
                                    <MaterialCommunityIcons name="speedometer-slow" size={20} color="#6366F1" />
                                    <Text style={[styles.infraValue, { color: '#6366F1' }]}>
                                        {t('itineraire.panneau.pourcentage', { n: f.nombre(itineraire.infra_stats.pct_low_speed) })}
                                    </Text>
                                    <Text style={[styles.infraLabel, { color: colors.textSecondary }]}>
                                        {t('itineraire.panneau.zoneLente')}
                                    </Text>
                                </View>
                                <View style={[styles.infraCard, { backgroundColor: '#F59E0B15', borderColor: '#F59E0B30' }]}>
                                    <Ionicons name="bulb-outline" size={20} color="#F59E0B" />
                                    <Text style={[styles.infraValue, { color: '#F59E0B' }]}>
                                        {t('itineraire.panneau.pourcentage', { n: f.nombre(itineraire.infra_stats.pct_lit) })}
                                    </Text>
                                    <Text style={[styles.infraLabel, { color: colors.textSecondary }]}>
                                        {t('itineraire.panneau.eclaire')}
                                    </Text>
                                </View>
                                {itineraire.infra_stats.accidents_count > 0 && (
                                    <View style={[styles.infraCard, { backgroundColor: '#DC262615', borderColor: '#DC262630' }]}>
                                        <MaterialCommunityIcons name="alert-octagon" size={20} color="#DC2626" />
                                        <Text style={[styles.infraValue, { color: '#DC2626' }]}>
                                            {itineraire.infra_stats.accidents_count}
                                        </Text>
                                        <Text style={[styles.infraLabel, { color: colors.textSecondary }]}>
                                            {t('itineraire.panneau.accidentsRecenses', { count: itineraire.infra_stats.accidents_count })}
                                        </Text>
                                    </View>
                                )}
                                {itineraire.infra_stats.air_aware && (
                                    <View style={[styles.infraCard, { backgroundColor: '#0D948815', borderColor: '#0D948830' }]}>
                                        <MaterialCommunityIcons name="weather-windy" size={20} color="#0D9488" />
                                        <Text style={[styles.infraValue, { color: '#0D9488' }]}>
                                            {itineraire.infra_stats.pct_low_air_exposure}%
                                        </Text>
                                        <Text style={[styles.infraLabel, { color: colors.textSecondary }]}>
                                            {t('itineraire.panneau.ecartTrafic')}
                                        </Text>
                                    </View>
                                )}
                                {summary?.headwind_notable && itineraire.pct_headwind != null && (
                                    <View style={[styles.infraCard, { backgroundColor: '#0891B215', borderColor: '#0891B230' }]}>
                                        <MaterialCommunityIcons name="weather-windy-variant" size={20} color="#0891B2" />
                                        <Text style={[styles.infraValue, { color: '#0891B2' }]}>
                                            {Math.round(itineraire.pct_headwind)}%
                                        </Text>
                                        <Text style={[styles.infraLabel, { color: colors.textSecondary }]}>
                                            {itineraire.wind_effect_min > 0
                                                ? t('itineraire.panneau.ventDeFaceMinutes', { minutes: f.nombre(Math.round(itineraire.wind_effect_min)) })
                                                : t('itineraire.panneau.ventDeFace')}
                                        </Text>
                                    </View>
                                )}
                                {summary?.ice_bridges?.count > 0 && (
                                    <View style={[styles.infraCard, { backgroundColor: '#DC262615', borderColor: '#DC262630' }]}>
                                        <MaterialCommunityIcons name="snowflake-alert" size={20} color="#DC2626" />
                                        <Text style={[styles.infraValue, { color: '#DC2626' }]}>
                                            {summary.ice_bridges.count}
                                        </Text>
                                        <Text style={[styles.infraLabel, { color: colors.textSecondary }]}>
                                            {t('itineraire.panneau.pontsVerglas', { count: summary.ice_bridges.count })}
                                        </Text>
                                    </View>
                                )}
                            </View>

                            {summary?.equipment?.length > 0 && (
                                <>
                                    <Text style={[styles.sectionLabel, { color: colors.textSecondary, marginTop: 18 }]}>
                                        {t('carte.ui.meteo.aPrevoir')}
                                    </Text>
                                    <View style={styles.equipmentRow}>
                                        {summary.equipment.map((item) => (
                                            <View
                                                key={item.key}
                                                style={[styles.equipmentChip, { backgroundColor: colors.bgSurface, borderColor: colors.borderStrong }]}
                                            >
                                                <Text style={[styles.equipmentLabel, { color: colors.textMain }]}>
                                                    {item.label}
                                                </Text>
                                                <Text style={[styles.equipmentReason, { color: colors.textSecondary }]}>
                                                    {item.reason}
                                                </Text>
                                            </View>
                                        ))}
                                    </View>
                                </>
                            )}
                        </View>
                    )}
                </Reanimated.View>
            </View>
            </GestureHandlerRootView>
        </Modal >
    );
}

export default function ItineraryPanel({ itineraires, weather, selectedItineraire, setSelectedItineraire, bottomOffset = 0, detailItineraire = null, setDetailItineraire = () => { } }) {
    const { t } = useTranslation();
    const f = useFormat();
    const { colors, typography } = useTheme();
    const slideAnim = useRef(new Animated.Value(200)).current;

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
            <Animated.View style={[styles.container, { bottom: 90 + bottomOffset, transform: [{ translateY: slideAnim }] }]}>
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
                                    { backgroundColor: withAlpha(colors.bgSurface, 0.92), borderColor: colors.borderLight },
                                    isSelected && { borderColor: meta.color, backgroundColor: withAlpha(colors.bgMain, 0.92) }
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
                                            {t('itineraire.panneau.minutes', { n: f.nombre(Math.round(it.duration)) })}
                                        </Text>
                                    </View>
                                    <View style={[styles.statDivider, { backgroundColor: colors.borderLight }]} />
                                    <View style={styles.stat}>
                                        <MaterialCommunityIcons name="map-marker-distance" size={13} color={colors.textSecondary} />
                                        <Text style={[styles.statValue, { color: colors.textMain }]}>
                                            {t('itineraire.panneau.kilometres', { n: f.nombre(it.distance, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) })}
                                        </Text>
                                    </View>
                                </View>

                                <TouchableOpacity
                                    style={[styles.infoButton, { borderColor: colors.borderLight }]}
                                    onPress={() => setDetailItineraire(it)}
                                >
                                    <Ionicons name="information-circle-outline" size={14} color={colors.textSecondary} />
                                    <Text style={[styles.infoButtonText, { color: colors.textSecondary }]}>
                                        {t('itineraire.panneau.plusDeDetails')}
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
                weather={weather}
            />
        </>
    );
}

const styles = StyleSheet.create({
    equipmentRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 8,
    },
    equipmentChip: {
        borderWidth: 1,
        borderRadius: 12,
        paddingVertical: 6,
        paddingHorizontal: 10,
    },
    equipmentLabel: {
        fontSize: 14,
        fontWeight: '600',
    },
    equipmentReason: {
        fontSize: 11,
        marginTop: 1,
    },
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
    chartSection: {
        alignItems: 'center',
        marginHorizontal: -10,
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
