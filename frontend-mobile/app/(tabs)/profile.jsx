import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Button, DangerButton, OutlineButton } from '../../components/ui/Button';
import HistoricModal from '../../components/HistoricModal';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../hooks/useTheme';
import { getUserHistoric, deleteHistoricEntry } from '../../services/apiBack';

export default function ProfilePage() {

    const router = useRouter();
    const { colors, typography } = useTheme();

    const { user, updateUser, token, userBikes, updateBikes, historic, updateHistoric, logoutAuth } = useAuth();

    console.log("Données utilisateur dans ProfilePage :", user);
    console.log("Vélos dans ProfilePage :", userBikes);

    const [hasError, setHasError] = useState(false);

    const [firstName, setFirstName] = useState(user?.first_name || "");
    const [lastName, setLastName] = useState(user?.last_name || "");
    const [email, setEmail] = useState(user?.email || "");
    const [birthDate, setBirthdate] = useState(user?.birth_date || "");
    const [level, setLevel] = useState(user?.sport_level || "");
    const [homeAddress, setHomeAddress] = useState(user?.home_address || "");
    const [workAddress, setWorkAddress] = useState(user?.work_address || "");
    const [bikes, setBikes] = useState(userBikes || []);
    const [password, setPassword] = useState("");
    const [userHistoric, setHistoric] = useState([]);
    const [isModalOpenHistoric, setIsModalOpenHistoric] = useState(false);
    const [selectedHistoricEntry, setSelectedHistoricEntry] = useState(null);

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
        if (user){
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

    const trajets = userHistoric.filter(e => e.route);
    const totalTrajets = trajets.length;
    const totalDist = trajets.reduce((s, e) => s + (e.route.distance_km || 0), 0);
    const totalTime = trajets.reduce((s, e) => s + (e.route.duration_min || 0), 0);
    const typeCount = trajets.reduce((acc, e) => {
        const t = e.route.route_type;
        acc[t] = (acc[t] || 0) + 1;
        return acc;
    }, {});
    const typeLabels = { fast: "Rapide", safe: "Sécurisé", compromise: "Compromis" };
    const prefType = Object.entries(typeCount).sort((a, b) => b[1] - a[1])[0];

    const statsData = [
        { label: "Trajets effectués", value: totalTrajets, icon: "bicycle-outline", color: "#3d46f6" },
        { label: "Distance totale", value: `${totalDist.toFixed(1)} km`, icon: "navigate-outline", color: "#10B981" },
        { label: "Temps total", value: `${Math.floor(totalTime / 60)}h ${Math.round(totalTime % 60)}min`, icon: "time-outline", color: "#F59E0B" },
        { label: "Type préféré", value: prefType ? typeLabels[prefType[0]] : `--`, icon: "heart-outline", color: "#EC4899" },
    ];

    if (!user) {
        return (
            <View style={[styles.container, { backgroundColor: colors.bgMain, justifyContent: 'center' }]}>
                <Ionicons name="person-circle-outline" size={100} color={colors.textSecondary} />

                <Text style={[typography.h1, { color: colors.textMain, marginTop: 20, textAlign: 'center' }]}>
                    Mon Profil
                </Text>

                <Text style={[typography.body, { color: colors.textSecondary, textAlign: 'center', marginVertical: 20 }]}>
                    Connectez-vous pour accéder à vos informations personnelles, vos itinéraires favoris et vos vélos.
                </Text>

                <View style={styles.buttonsContainer}>
                    <Button
                        title="Se connecter"
                        iconName="log-in-outline"
                        onPress={() => router.push("/login")}
                    />

                    <OutlineButton
                        title="Créer un compte"
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
            contentContainerStyle={styles.scrollContent}
        >
            <View style={styles.container}>
                <View style={styles.header}>
                    <Ionicons name="person-circle" size={100} color={colors.primary} />
                    {firstName || lastName ? (
                        <Text style={[typography.h1, { color: colors.textMain, marginTop: 10 }]}>
                            {firstName} {lastName}
                        </Text>
                    ) :
                        <Text style={[typography.h1, { color: colors.textMain, marginTop: 10 }]}>
                            Mon Profil
                        </Text>
                    }
                    <Text style={[typography.body, { color: colors.textSecondary }]}>
                        {email}
                    </Text>
                </View>

                <View style={[styles.section, { backgroundColor: colors.bgSurface }]}>
                    <View style={styles.sectionTitleRow}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 10 }}>
                            <Ionicons name="location-outline" size={24} color={colors.textMain} />
                            <Text style={[styles.sectionTitle, { color: colors.textMain }]}>Mes adresses</Text>
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
                                <Text style={{ color: colors.textMain }}>Domicile :</Text>
                            </View>
                            <Text style={{ color: colors.textSecondary }}>{homeAddress}</Text>
                        </View>
                        <View style={styles.addressRow}>
                            <View style={styles.adressTitleRow}>
                                <FontAwesome name="suitcase" size={20} color={colors.textMain} />
                                <Text style={{ color: colors.textMain }}>Travail :</Text>
                            </View>
                            <Text style={{ color: colors.textSecondary }}>{workAddress}</Text>
                        </View>
                    </View>
                </View>

                <View style={[styles.section, { backgroundColor: colors.bgSurface }]}>
                    <View style={styles.sectionTitleRow}>
                        <Ionicons name="bicycle-outline" size={24} color={colors.textMain} />
                        <Text style={[styles.sectionTitle, { color: colors.textMain }]}>Mes vélos</Text>
                    </View>
                    <View style={styles.sectionContent}>
                        {bikes.length > 0 ? (
                            bikes.map((bike, index) => (
                                <View key={index} style={{ gap: 5 }}>
                                    <Text style={{ color: colors.textMain, fontWeight: '500' }}>{bike.name}</Text>
                                    <Text style={{ color: colors.textSecondary }}>{bike.type}</Text>
                                </View>
                            ))
                        ) : (
                            <Text style={{ color: colors.textSecondary }}>Vous n'avez pas encore ajouté de vélo.</Text>
                        )}
                    </View>
                </View>

                <View style={[styles.section, { backgroundColor: colors.bgSurface }]}>
                    <View style={styles.sectionTitleRow}>
                        <Ionicons name="bar-chart-outline" size={24} color={colors.textMain} />
                        <Text style={[styles.sectionTitle, { color: colors.textMain }]}>Mes statistiques</Text>
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
                        <Ionicons name="time-outline" size={24} color={colors.textMain} />
                        <Text style={[styles.sectionTitle, { color: colors.textMain }]}>Mon historique</Text>
                    </View>

                    <View style={styles.sectionContent}>
                        {trajets && trajets.length > 0 ? (
                            trajets.slice(0, 5).map((item) => (
                                <TouchableOpacity
                                    key={item.id}
                                    style={[styles.historyItem, { borderBottomColor: colors.borderLight }]}
                                    onPress={() => handleOpenHistoric(item)}
                                >
                                    <View style={styles.historyTextContainer}>
                                        <Text style={[styles.historyDate, { color: colors.textSecondary }]}>
                                            {new Date(item.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                                        </Text>

                                        <Text style={[styles.historyRoute, { color: colors.textMain }]} numberOfLines={1}>
                                            {item.route.start_address.split(',')[0]}
                                        </Text>
                                        <Text style={[styles.historyRoute, { color: colors.textMain }]} numberOfLines={1}>
                                            {item.route.end_address.split(',')[0]}
                                        </Text>
                                    </View>

                                    <View style={styles.historyRight}>
                                        <View style={{ alignItems: 'flex-end' }}>
                                            <Text style={[styles.historyValue, { color: colors.textMain }]}>
                                                {item.route.distance_km.toFixed(1)} km
                                            </Text>
                                            <Text style={[styles.historyDuration, { color: colors.textSecondary }]}>
                                                {Math.round(item.route.duration_min)} min
                                            </Text>
                                        </View>
                                        <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
                                    </View>
                                </TouchableOpacity>
                            ))
                        ) : (
                            <View style={styles.emptyContainer}>
                                <Ionicons name="bicycle" size={40} color={colors.borderStrong} />
                                <Text style={{ color: colors.textSecondary, marginTop: 10 }}>Aucun trajet pour le moment</Text>
                            </View>
                        )}
                    </View>
                </View>

                <View style={styles.buttonsContainer}>
                    <OutlineButton
                        title="Modifier mon profil"
                        iconName="create-outline"
                        onPress={() => router.push("/editprofil")}
                    />

                    <DangerButton
                        title="Se déconnecter"
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
    }
});
