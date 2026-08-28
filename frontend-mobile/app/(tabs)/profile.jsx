import { FontAwesome, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, DangerButton, OutlineButton } from '../../components/ui/Button';
import HistoricModal from '../../components/HistoricModal';
import { useAuth } from '../../context/AuthContext';
import { useFormat } from '../../hooks/useFormat';
import { useTheme } from '../../hooks/useTheme';
import { getUserHistoric, deleteHistoricEntry, getBadges } from '../../services/apiBack';
import { useTranslation } from "react-i18next";

const formatProgress = (value, criteria) =>
    criteria === 'total_distance_km' ? Number(value).toFixed(1) : Math.round(value);

export default function ProfilePage() {

    const router = useRouter();
    const { colors, typography } = useTheme();
    const { t } = useTranslation();
    const f = useFormat();
    const insets = useSafeAreaInsets();

    const { user, updateUser, token, bikes, updateBikes, historic, updateHistoric, logoutAuth } = useAuth();

    const [hasError, setHasError] = useState(false);
    const [userHistoric, setHistoric] = useState([]);
    const [isModalOpenHistoric, setIsModalOpenHistoric] = useState(false);
    const [selectedHistoricEntry, setSelectedHistoricEntry] = useState(null);
    const [badges, setBadges] = useState([]);
    const [badgesLoading, setBadgesLoading] = useState(true);

    const handleOpenHistoric = (entry) => {
        setSelectedHistoricEntry(entry);
        setIsModalOpenHistoric(true);
    };

    const handleDeleteHistoricEntry = (id) => {
        deleteHistoricEntry(token, id);
        setHistoric(userHistoric.filter(e => e.id !== id));
        setIsModalOpenHistoric(false);
    };

    useEffect(() => {
        if (user) {
            const loadData = async () => {
                try {
                    const data = await getUserHistoric(token);
                    setHistoric(data);
                } catch (error) {
                    console.error("Erreur chargement historique:", error);
                }
            };
            loadData();
        }
    }, [token]);

    useEffect(() => {
        if (!token) {
            setBadgesLoading(false);
            return;
        }
        const loadBadges = async () => {
            try {
                setBadgesLoading(true);
                setBadges(await getBadges(token));
            } catch (error) {
                console.error("Erreur chargement badges:", error);
            } finally {
                setBadgesLoading(false);
            }
        };
        loadBadges();
    }, [token]);

    const trajets = userHistoric.filter(e => e.route);
    const trajetsTermines = trajets.filter(e => e.route.completed_at);
    const totalTrajets = trajetsTermines.length;
    const totalDist = trajetsTermines.reduce((s, e) => s + (e.route.distance_km || 0), 0);
    const totalTime = trajetsTermines.reduce((s, e) => s + (e.route.duration_min || 0), 0);
    const typeCount = trajetsTermines.reduce((acc, e) => {
        const type = e.route.route_type;
        acc[type] = (acc[type] || 0) + 1;
        return acc;
    }, {});
    const prefType = Object.entries(typeCount).sort((a, b) => b[1] - a[1])[0];

    // Les libellés sont résolus ici, dans le corps du composant : construits au
    // niveau module ils resteraient dans la langue du chargement du bundle. Les
    // variantes d'itinéraire reprennent les identifiants du backend.
    const statsData = [
        { label: t('compte.profil.statistiques.trajetsTermines'), value: f.nombre(totalTrajets), icon: "bicycle-outline", color: "#3d46f6" },
        { label: t('compte.profil.statistiques.distanceTotale'), value: t('compte.historique.kilometres', { valeur: f.nombre(totalDist, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) }), icon: "navigate-outline", color: "#10B981" },
        { label: t('compte.profil.statistiques.tempsTotal'), value: t('compte.profil.tempsTotal', { heures: Math.floor(totalTime / 60), minutes: Math.round(totalTime % 60) }), icon: "time-outline", color: "#F59E0B" },
        { label: t('compte.profil.statistiques.typePrefere'), value: prefType ? t(`itineraire.variant.${prefType[0]}`) : t('compte.profil.valeurIndisponible'), icon: "heart-outline", color: "#EC4899" },
    ];

    if (!user) {
        return (
            <View style={[styles.container, { backgroundColor: colors.bgMain, justifyContent: 'center' }]}>
                <TouchableOpacity
                    style={[styles.settingsButton, { top: insets.top + 10 }]}
                    onPress={() => router.push("/settings")}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    accessibilityRole="button"
                    accessibilityLabel={t('compte.profil.parametres')}
                >
                    <Ionicons name="settings-outline" size={26} color={colors.textMain} />
                </TouchableOpacity>

                <Ionicons name="person-circle-outline" size={100} color={colors.textSecondary} />

                <Text style={[typography.h1, { color: colors.textMain, marginTop: 20, textAlign: 'center' }]}>
                    {t('compte.profil.h1')}
                </Text>

                <Text style={[typography.body, { color: colors.textSecondary, textAlign: 'center', marginVertical: 20 }]}>
                    {t('compte.profil.nonConnecte')}
                </Text>

                <View style={styles.buttonsContainer}>
                    <Button
                        title={t('auth.connexion.seConnecter')}
                        iconName="log-in-outline"
                        onPress={() => router.push("/login")}
                    />

                    <OutlineButton
                        title={t('auth.connexion.creerCompte')}
                        iconName="person-add-outline"
                        onPress={() => router.push("/signin")}
                    />
                </View>
            </View>
        );
    }

    return (
        <ScrollView
            style={[styles.scrollView, { backgroundColor: colors.bgMain }]}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 86 }]}
        >
            <View style={styles.container}>
                <TouchableOpacity
                    style={[styles.settingsButton, { top: insets.top + 10 }]}
                    onPress={() => router.push("/settings")}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    accessibilityRole="button"
                    accessibilityLabel={t('compte.profil.parametres')}
                >
                    <Ionicons name="settings-outline" size={26} color={colors.textMain} />
                </TouchableOpacity>

                <View style={styles.header}>
                    <Ionicons name="person-circle" size={100} color={colors.primary} />
                    {user.first_name || user.last_name ? (
                        <Text style={[typography.h1, { color: colors.textMain, marginTop: 10 }]}>
                            {user.first_name} {user.last_name}
                        </Text>
                    ) :
                        <Text style={[typography.h1, { color: colors.textMain, marginTop: 10 }]}>
                            {t('compte.profil.h1')}
                        </Text>
                    }
                    <Text style={[typography.body, { color: colors.textSecondary }]}>
                        {user.email}
                    </Text>
                </View>

                <View style={[styles.section, { backgroundColor: colors.bgSurface }]}>
                    <View style={styles.sectionTitleRow}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 10 }}>
                            <Ionicons name="location-outline" size={24} color={colors.textMain} />
                            <Text style={[styles.sectionTitle, { color: colors.textMain }]}>{t('compte.profil.adresses.h2')}</Text>
                        </View>
                        <TouchableOpacity
                            onPress={() => router.push("/editaddress")}
                            style={{ padding: 5 }}
                        >
                            <Ionicons name="create-outline" size={20} color={colors.textMain} />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.sectionContent}>
                        <View style={styles.addressRow}>
                            <View style={styles.adressTitleRow}>
                                <Ionicons name="home-outline" size={20} color={colors.textMain} />
                                <Text style={{ color: colors.textMain }}>{t('compte.profil.domicile')}</Text>
                            </View>
                            <Text style={{ color: colors.textSecondary }}>{user.home_address}</Text>
                        </View>
                        <View style={styles.addressRow}>
                            <View style={styles.adressTitleRow}>
                                <FontAwesome name="suitcase" size={20} color={colors.textMain} />
                                <Text style={{ color: colors.textMain }}>{t('compte.profil.travail')}</Text>
                            </View>
                            <Text style={{ color: colors.textSecondary }}>{user.work_address}</Text>
                        </View>
                    </View>
                </View>

                <View style={[styles.section, { backgroundColor: colors.bgSurface }]}>
                    <View style={styles.sectionTitleRow}>
                        <Ionicons name="bicycle-outline" size={24} color={colors.textMain} />
                        <Text style={[styles.sectionTitle, { color: colors.textMain }]}>{t('compte.profil.velos.h2')}</Text>
                        <TouchableOpacity
                            onPress={() => router.push("/editbike")}
                            style={{ padding: 5, marginLeft: 'auto' }}
                        >
                            <Ionicons name="add-outline" size={24} color={colors.textMain} />
                        </TouchableOpacity>
                    </View>

                    {bikes && bikes.length > 0 ? (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            {bikes.map((bike) => {
                                let iconName = 'bicycle';
                                const bikeType = bike.type?.toLowerCase();
                                if (bikeType === "ville") iconName = bike.is_electric ? "bicycle-electric" : "bicycle";
                                else if (bikeType === "vtt") iconName = bike.is_electric ? "bicycle-electric" : "bike";
                                else if (bikeType === "route") iconName = "bike-fast";

                                return (
                                    <TouchableOpacity
                                        key={bike.id}
                                        style={[
                                            styles.bikeCard,
                                            { backgroundColor: colors.bgMain, borderColor: colors.borderLight }
                                        ]}
                                        onPress={() => router.push({ pathname: "/editbike", params: { bikeId: bike.id, bikeName: bike.name, bikeType: bike.type, bikeElectric: bike.is_electric } })}
                                    >
                                        <MaterialCommunityIcons name={iconName} size={28} color={colors.primary} />
                                        {bike.is_electric && (
                                            <MaterialCommunityIcons
                                                name="lightning-bolt"
                                                size={14}
                                                color={colors.primary}
                                                style={{ position: 'absolute', top: 8, right: 8 }}
                                            />
                                        )}
                                        <Text style={[styles.bikeName, { color: colors.textMain }]} numberOfLines={1}>
                                            {bike.name}
                                        </Text>
                                        <Text style={[styles.bikeType, { color: colors.textSecondary }]}>
                                            {bike.type}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}

                            <TouchableOpacity
                                style={[styles.bikeCard, styles.bikeCardAdd, { borderColor: colors.borderLight }]}
                                onPress={() => router.push("/editbike")}
                            >
                                <Ionicons name="add-circle-outline" size={28} color={colors.textSecondary} />
                                <Text style={[styles.bikeType, { color: colors.textSecondary, marginTop: 8 }]}>
                                    {t('compte.profil.ajouterVeloCourt')}
                                </Text>
                            </TouchableOpacity>
                        </ScrollView>
                    ) : (
                        <TouchableOpacity
                            style={[styles.emptyBikeContainer, { borderColor: colors.borderLight }]}
                            onPress={() => router.push("/editbike")}
                        >
                            <Ionicons name="bicycle-outline" size={40} color={colors.borderStrong} />
                            <Text style={{ color: colors.textSecondary, marginTop: 10 }}>
                                {t('compte.profil.aucunVelo')}
                            </Text>
                            <Text style={{ color: colors.primary, marginTop: 5, fontWeight: '600' }}>
                                {t('compte.profil.ajouterUnVelo')}
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>

                <View style={[styles.section, { backgroundColor: colors.bgSurface }]}>
                    <View style={styles.sectionTitleRow}>
                        <Ionicons name="bar-chart-outline" size={24} color={colors.textMain} />
                        <Text style={[styles.sectionTitle, { color: colors.textMain }]}>{t('compte.profil.statistiques.h2')}</Text>
                    </View>

                    <View style={styles.statsGrid}>
                        {statsData.map((stat, index) => (
                            <View key={index} style={[styles.statCard, { borderColor: colors.borderLight }]}>
                                <Ionicons name={stat.icon} size={20} color={stat.color} />
                                <Text style={[styles.statValue, { color: colors.textMain }]}>
                                    {stat.value}
                                </Text>
                                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                                    {stat.label}
                                </Text>
                            </View>
                        ))}
                    </View>
                </View>

                <View style={[styles.section, { backgroundColor: colors.bgSurface }]}>
                    <View style={styles.sectionTitleRow}>
                        <Ionicons name="trophy-outline" size={24} color={colors.textMain} />
                        <Text style={[styles.sectionTitle, { color: colors.textMain }]}>{t('compte.profil.badges.h2')}</Text>
                    </View>

                    {badgesLoading ? (
                        <ActivityIndicator color={colors.primary} style={{ paddingVertical: 20 }} />
                    ) : badges.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="trophy-outline" size={40} color={colors.borderStrong} />
                            <Text style={{ color: colors.textSecondary, marginTop: 10 }}>{t('compte.profil.aucunBadge')}</Text>
                        </View>
                    ) : (
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.badgesRow}
                        >
                            {badges.map((badge) => {
                                const unlocked = !!badge.obtained_at;
                                return (
                                    <View
                                        key={badge.id}
                                        style={[
                                            styles.badgeCard,
                                            { borderColor: colors.borderLight, opacity: unlocked ? 1 : 0.45 },
                                        ]}
                                    >
                                        <Ionicons
                                            name={badge.icon || 'trophy'}
                                            size={20}
                                            color={unlocked ? colors.primary : colors.textSecondary}
                                        />
                                        <Text style={[styles.statValue, { color: colors.textMain }]} numberOfLines={2}>
                                            {badge.name}
                                        </Text>
                                        <Text style={[styles.statLabel, { color: unlocked ? '#10B981' : colors.textSecondary }]}>
                                            {unlocked
                                                ? t('compte.profil.badges.debloque')
                                                : `${formatProgress(badge.progress, badge.criteria)}/${badge.goal_value}`}
                                        </Text>
                                    </View>
                                );
                            })}
                        </ScrollView>
                    )}
                </View>

                <View style={[styles.section, { backgroundColor: colors.bgSurface }]}>
                    <View style={styles.sectionTitleRow}>
                        <Ionicons name="time-outline" size={24} color={colors.textMain} />
                        <Text style={[styles.sectionTitle, { color: colors.textMain }]}>{t('compte.historique.titreEcran')}</Text>
                        {trajets.length > 0 && (
                            <TouchableOpacity
                                onPress={() => router.push("/historic")}
                                style={{ padding: 5, marginLeft: 'auto' }}
                            >
                                <Ionicons name="open-outline" size={20} color={colors.textMain} />
                            </TouchableOpacity>
                        )}
                    </View>

                    <View style={styles.sectionContent}>
                        {trajets && trajets.length > 0 ? (
                            trajets.slice(0, 3).map((item) => (
                                <TouchableOpacity
                                    key={item.id}
                                    style={[styles.historyItem, { borderBottomColor: colors.borderLight }]}
                                    onPress={() => handleOpenHistoric(item)}
                                >
                                    <View style={styles.historyTextContainer}>
                                        <Text style={[styles.historyDate, { color: colors.textSecondary }]}>
                                            {f.dateCourte(item.created_at)}
                                        </Text>

                                        <Text style={[styles.historyRoute, { color: colors.textMain }]} numberOfLines={1}>
                                            {item.route.start_address}
                                        </Text>
                                        <Text style={[styles.historyRoute, { color: colors.textMain }]} numberOfLines={1}>
                                            {item.route.end_address}
                                        </Text>
                                    </View>

                                    <View style={styles.historyRight}>
                                        <View style={{ alignItems: 'flex-end' }}>
                                            <Text style={[styles.historyValue, { color: colors.textMain }]}>
                                                {t('compte.historique.kilometres', { valeur: f.nombre(item.route.distance_km, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) })}
                                            </Text>
                                            <Text style={[styles.historyDuration, { color: colors.textSecondary }]}>
                                                {t('compte.historique.minutes', { valeur: f.nombre(Math.round(item.route.duration_min)) })}
                                            </Text>
                                        </View>
                                        <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
                                    </View>
                                </TouchableOpacity>
                            ))
                        ) : (
                            <View style={styles.emptyContainer}>
                                <Ionicons name="bicycle" size={40} color={colors.borderStrong} />
                                <Text style={{ color: colors.textSecondary, marginTop: 10 }}>{t('compte.historique.aucunTrajet')}</Text>
                            </View>
                        )}
                    </View>

                    {trajets.length > 3 && (
                        <TouchableOpacity
                            style={styles.seeMoreButton}
                            onPress={() => router.push("/historic")}
                            accessibilityRole="button"
                        >
                            <Text style={[styles.seeMoreText, { color: colors.primary }]}>{t('compte.profil.voirPlus')}</Text>
                            <Ionicons name="chevron-forward" size={16} color={colors.primary} />
                        </TouchableOpacity>
                    )}
                </View>

                <TouchableOpacity
                    style={[styles.section, styles.settingsRow, { backgroundColor: colors.bgSurface }]}
                    onPress={() => router.push("/settings")}
                >
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 10 }}>
                        <Ionicons name="settings-outline" size={24} color={colors.textMain} />
                        <Text style={[styles.sectionTitle, { color: colors.textMain }]}>{t('compte.profil.parametres')}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                </TouchableOpacity>

                <View style={styles.buttonsContainer}>
                    <DangerButton
                        title={t('compte.profil.deconnexion')}
                        iconName="log-out-outline"
                        onPress={() => logoutAuth() && router.push("/")}
                        isLoading={false}
                        disabled={false}
                    />
                </View>
            </View>

            <HistoricModal
                isOpen={isModalOpenHistoric}
                onClose={() => setIsModalOpenHistoric(false)}
                entry={selectedHistoricEntry}
                onDelete={handleDeleteHistoricEntry}
                colors={colors}
            />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
    },
    container: {
        flex: 1,
        padding: 20,
        alignItems: 'center',
    },
    buttonsContainer: {
        width: '100%',
        marginTop: 20,
        gap: 20,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
        marginTop: 20,
    },
    section: {
        width: '100%',
        padding: 20,
        borderRadius: 15,
        marginBottom: 20,
        fontSize: 17,
    },
    sectionTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
        gap: 10,
    },
    settingsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    settingsButton: {
        position: 'absolute',
        right: 20,
        zIndex: 10,
        padding: 5,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    sectionContent: {
        marginTop: 10,
        gap: 20,
    },
    adressTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        marginBottom: 5,
    },
    addressRow: {
        alignItems: 'left',
        gap: 3,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginTop: 5,
    },
    statCard: {
        width: '48%',
        padding: 15,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    badgesRow: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 5,
        paddingBottom: 5,
    },
    badgeCard: {
        width: 110,
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statValue: {
        fontSize: 16,
        fontWeight: 'bold',
        marginTop: 5,
        textAlign: 'center',
    },
    statLabel: {
        fontSize: 11,
        textAlign: 'center',
        marginTop: 2,
    },
    seeMoreButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        paddingVertical: 12,
        marginTop: 8,
    },
    seeMoreText: {
        fontSize: 14,
        fontWeight: '600',
    },
    historyItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 1,
    },
    historyTextContainer: {
        flex: 1,
        paddingRight: 10,
    },
    historyDate: {
        fontSize: 11,
        textTransform: 'uppercase',
        fontWeight: '600',
        marginBottom: 2,
    },
    historyRoute: {
        fontSize: 15,
        fontWeight: '500',
    },
    historyRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    historyValue: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    historyDuration: {
        fontSize: 12,
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 30,
    },
    bikeCard: {
        width: 110,
        padding: 15,
        borderRadius: 16,
        borderWidth: 1,
        alignItems: 'center',
        marginRight: 12,
        position: 'relative',
    },
    bikeCardAdd: {
        backgroundColor: 'transparent',
        justifyContent: 'center',
    },
    bikeName: {
        fontSize: 13,
        fontWeight: '600',
        marginTop: 8,
        textAlign: 'center',
    },
    bikeType: {
        fontSize: 11,
        marginTop: 2,
        textAlign: 'center',
        textTransform: 'capitalize',
    },
    emptyBikeContainer: {
        alignItems: 'center',
        paddingVertical: 30,
        borderWidth: 1,
        borderRadius: 16,
        borderStyle: 'dashed',
    },
});
