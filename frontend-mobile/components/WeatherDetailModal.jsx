import React from 'react';
import { Modal, View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useFormat } from '../hooks/useFormat';
import { useTheme } from '../hooks/useTheme';
import { useTranslation } from 'react-i18next';
import {
    WEATHER_ALERT_COLORS, weatherIcon, formatHM, formatHMShifted,
    precipBarHeight, PRECIP_FULL_BAR_MM, MINUTELY_STEP_MIN,
} from '../services/weather';

export default function WeatherDetailModal({
    visible, zone, stale, updatedAt, minutely = [], outdated = false, rain, onClose, onOpenInfo,
}) {
    const { colors, typography } = useTheme();
    const { t } = useTranslation();
    const f = useFormat();
    const summary = zone?.summary;

    const wind = summary?.wind;
    const alerts = summary?.alerts || [];
    const equipment = summary?.equipment || [];
    const hourly = (zone?.hourly || []).slice(0, 12);

    const hasNowcast = minutely.length > 0;

    const feels = summary?.apparent_temperature;
    const showFeels = feels != null && summary?.temperature != null
        && Math.abs(feels - summary.temperature) >= 1;

    const total = minutely.reduce((sum, s) => sum + (s.precipitation || 0), 0);

    const muted = { color: colors.textSecondary };
    const heading = [typography.body, styles.heading, { color: colors.textMain }];

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
                <View
                    style={[styles.card, { backgroundColor: colors.bgMain }]}
                    onStartShouldSetResponder={() => true}
                >
                    <View style={styles.head}>
                        <Text style={[typography.h1, styles.title, { color: colors.textMain }]}>
                            {t('carte.ui.meteo.titre')}
                        </Text>
                        <TouchableOpacity
                            onPress={onOpenInfo}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            accessibilityRole="button"
                            accessibilityLabel={t('carte.ui.meteo.sourcesAria')}
                        >
                            <Ionicons name="information-circle-outline" size={22} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    {!summary ? (
                        <Text style={[typography.body, styles.text, muted]}>
                            {t('carte.ui.meteo.indisponible')}
                        </Text>
                    ) : (
                        <ScrollView
                            style={styles.scroll}
                            contentContainerStyle={styles.scrollContent}
                            showsVerticalScrollIndicator={false}
                        >
                            <View style={styles.now}>
                                <MaterialCommunityIcons
                                    name={weatherIcon(summary.condition, summary.is_day !== false)}
                                    size={38}
                                    color={colors.textMain}
                                />
                                <View style={styles.nowText}>
                                    <Text style={[typography.body, styles.nowTemp, { color: colors.textMain }]}>
                                        {summary.temperature != null ? `${Math.round(summary.temperature)} °C` : '—'}
                                    </Text>
                                    <Text style={[typography.body, styles.text, { color: colors.textMain }]}>
                                        {summary.label}
                                    </Text>
                                    {showFeels && (
                                        <Text style={[typography.body, styles.small, muted]}>
                                            {t('carte.ui.meteo.ressenti', { degres: f.nombre(Math.round(feels)) })}
                                        </Text>
                                    )}
                                </View>
                            </View>

                            <Text style={heading}>{t('carte.ui.meteo.precipitations')}</Text>
                            {rain && (
                                <Text style={[typography.body, styles.lead, { color: colors.textMain }]}>
                                    {rain.text}
                                </Text>
                            )}

                            {hasNowcast ? (
                                <>
                                    <View style={styles.chart}>
                                        {minutely.map((step) => (
                                            <View
                                                key={step.time}
                                                style={[styles.slot, { backgroundColor: colors.borderLight }]}
                                            >
                                                <View
                                                    style={[
                                                        styles.bar,
                                                        { height: `${precipBarHeight(step.precipitation) * 100}%` },
                                                    ]}
                                                />
                                            </View>
                                        ))}
                                    </View>
                                    <View style={styles.axis}>
                                        <Text style={[typography.body, styles.small, muted]}>
                                            {formatHM(minutely[0].time)}
                                        </Text>
                                        <Text style={[typography.body, styles.small, muted]}>
                                            {t('carte.ui.meteo.echelle', { mm: PRECIP_FULL_BAR_MM, minutes: MINUTELY_STEP_MIN })}
                                        </Text>
                                        <Text style={[typography.body, styles.small, muted]}>
                                            {formatHMShifted(minutely[minutely.length - 1].time, MINUTELY_STEP_MIN)}
                                        </Text>
                                    </View>

                                    <Text style={[typography.body, styles.small, muted]}>
                                        {t('carte.ui.meteo.cumulPeriode', { mm: f.nombre(total, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) })}
                                    </Text>
                                </>
                            ) : outdated ? (
                                <Text style={[typography.body, styles.text, muted]}>
                                    {t('carte.ui.meteo.nowcastExpire')}
                                </Text>
                            ) : (
                                <Text style={[typography.body, styles.text, muted]}>
                                    {t('carte.ui.meteo.nowcastHorsZone')}
                                </Text>
                            )}

                            {hourly.length > 0 && (
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.strip}>
                                    {hourly.slice(0, 6).map((h) => (
                                        <View key={h.time} style={styles.stripItem}>
                                            <Text style={[typography.body, styles.small, muted]}>
                                                {formatHM(h.time)}
                                            </Text>
                                            <Text
                                                style={[typography.body, styles.small, {
                                                    color: h.precipitation_probability >= 50
                                                        ? '#3b82f6' : colors.textSecondary,
                                                    fontWeight: h.precipitation_probability >= 50 ? '600' : '400',
                                                }]}
                                            >
                                                {h.precipitation_probability != null
                                                    ? `${h.precipitation_probability} %` : '—'}
                                            </Text>
                                        </View>
                                    ))}
                                </ScrollView>
                            )}

                            {wind?.speed != null && (
                                <>
                                    <Text style={heading}>{t('carte.ui.meteo.vent')}</Text>
                                    <View style={styles.windRow}>
                                        {wind.direction != null && (
                                            <MaterialCommunityIcons
                                                name="navigation"
                                                size={16}
                                                color={colors.textMain}
                                                style={{ transform: [{ rotate: `${wind.direction + 180}deg` }] }}
                                            />
                                        )}
                                        <Text style={[typography.body, styles.text, { color: colors.textMain, fontWeight: '600' }]}>
                                            {t('carte.ui.meteo.vitesseVent', { vitesse: f.nombre(Math.round(wind.speed)) })}
                                        </Text>
                                        {wind.cardinal && (
                                            <Text style={[typography.body, styles.text, muted]}>
                                                {t('carte.ui.meteo.ventDe', { cardinal: wind.cardinal }).trim()}
                                            </Text>
                                        )}
                                    </View>
                                    {wind.gusts != null && (
                                        <Text style={[typography.body, styles.small, muted]}>
                                            {t('carte.ui.meteo.rafales', { vitesse: f.nombre(Math.round(wind.gusts)) })}
                                        </Text>
                                    )}
                                </>
                            )}

                            <Text style={heading}>{t('carte.ui.meteo.vigilance')}</Text>
                            {alerts.length === 0 ? (
                                <Text style={[typography.body, styles.text, muted]}>{t('carte.ui.meteo.rienASignaler')}</Text>
                            ) : (
                                alerts.map((alert) => (
                                    <View key={alert.key} style={styles.alertRow}>
                                        <View style={[styles.dot, { backgroundColor: WEATHER_ALERT_COLORS[alert.level] }]} />
                                        <Text style={[typography.body, styles.text, { color: colors.textMain, flex: 1 }]}>
                                            {alert.label}
                                            {alert.at ? t('carte.ui.meteo.alerteVers', { heure: formatHM(alert.at) }) : ''}
                                            {alert.official && alert.source ? t('carte.ui.meteo.alerteSource', { source: alert.source }) : ''}
                                        </Text>
                                    </View>
                                ))
                            )}

                            {equipment.length > 0 && (
                                <>
                                    <Text style={heading}>{t('carte.ui.meteo.aPrevoir')}</Text>
                                    <View style={styles.chips}>
                                        {equipment.map((item) => (
                                            <View
                                                key={item.key}
                                                style={[styles.chip, { borderColor: colors.borderStrong }]}
                                            >
                                                <Text style={[typography.body, styles.small, { color: colors.textMain }]}>
                                                    {item.label}
                                                </Text>
                                            </View>
                                        ))}
                                    </View>
                                </>
                            )}

                            {hourly.length > 0 && (
                                <>
                                    <Text style={heading}>{t('carte.ui.meteo.prochainesHeures')}</Text>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.strip}>
                                        {hourly.map((h) => (
                                            <View key={h.time} style={styles.hourItem}>
                                                <Text style={[typography.body, styles.small, muted]}>
                                                    {formatHM(h.time)}
                                                </Text>
                                                <MaterialCommunityIcons
                                                    name={weatherIcon(h.condition, h.is_day !== false)}
                                                    size={18}
                                                    color={colors.textMain}
                                                />
                                                <Text style={[typography.body, styles.small, { color: colors.textMain }]}>
                                                    {h.temperature != null ? `${Math.round(h.temperature)}°` : '—'}
                                                </Text>
                                            </View>
                                        ))}
                                    </ScrollView>
                                </>
                            )}

                            {updatedAt && (
                                <Text style={[typography.body, styles.small, styles.updated, muted]}>
                                    {stale
                                        ? t('carte.ui.meteo.dernierReleveDispo', { heure: updatedAt })
                                        : t('carte.ui.meteo.releveDe', { heure: updatedAt })}
                                </Text>
                            )}
                        </ScrollView>
                    )}

                    <TouchableOpacity
                        style={[styles.close, { backgroundColor: colors.primary }]}
                        onPress={onClose}
                    >
                        <Text style={{ color: '#FFF', fontWeight: 'bold' }}>{t('carte.ui.fermer')}</Text>
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    card: {
        borderRadius: 20,
        padding: 20,
        width: '88%',
        maxHeight: '80%',
    },
    head: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    title: {
        fontSize: 20,
        lineHeight: 24,
        fontWeight: 'bold',
    },
    scroll: {
        flexShrink: 1,
    },
    scrollContent: {
        paddingBottom: 4,
    },
    heading: {
        fontSize: 14,
        fontWeight: '600',
        marginTop: 16,
        marginBottom: 5,
    },
    text: {
        fontSize: 13,
        lineHeight: 19,
    },
    small: {
        fontSize: 12,
        lineHeight: 17,
    },
    lead: {
        fontSize: 13,
        lineHeight: 19,
        fontWeight: '500',
        marginBottom: 4,
    },
    now: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    nowText: {
        flex: 1,
    },
    nowTemp: {
        fontSize: 26,
        lineHeight: 30,
        fontWeight: '600',
    },
    chart: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 3,
        height: 46,
        marginVertical: 6,
    },
    slot: {
        flex: 1,
        height: '100%',
        borderRadius: 3,
        justifyContent: 'flex-end',
        overflow: 'hidden',
    },
    bar: {
        width: '100%',
        minHeight: 2,
        borderRadius: 3,
        backgroundColor: '#3b82f6',
    },
    axis: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 8,
    },
    strip: {
        marginTop: 8,
    },
    stripItem: {
        alignItems: 'center',
        marginRight: 14,
    },
    hourItem: {
        alignItems: 'center',
        gap: 2,
        marginRight: 14,
    },
    windRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    alertRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        marginBottom: 4,
    },
    dot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginTop: 5,
    },
    chips: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },
    chip: {
        paddingVertical: 3,
        paddingHorizontal: 9,
        borderRadius: 999,
        borderWidth: 1,
    },
    updated: {
        marginTop: 14,
    },
    close: {
        alignSelf: 'stretch',
        alignItems: 'center',
        paddingVertical: 11,
        borderRadius: 12,
        marginTop: 14,
    },
});
