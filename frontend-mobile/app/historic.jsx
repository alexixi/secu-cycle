import { FontAwesome, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View, TouchableOpacity, Alert } from 'react-native';
import { Button, DangerButton, OutlineButton } from '../components/ui/Button';
import HistoricModal from '../components/HistoricModal';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../hooks/useTheme';
import { getUserHistoric, deleteHistoricEntry, deleteAllHistoric } from '../services/apiBack';

export default function HistoricPage() {

    const router = useRouter();
    const { colors, typography } = useTheme();

    const { user, token, historic, updateHistoric } = useAuth();

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
        updateHistoric(userHistoric.filter(e => e.id !== id));
        setIsModalOpenHistoric(false);
    };

    const handleDeleteAllHistoric = () => {
        Alert.alert(
            "Supprimer tout l'historique",
            "Cette action est irréversible. Voulez-vous continuer ?",
            [
                { text: "Annuler", style: "cancel" },
                {
                    text: "Supprimer tout",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await deleteAllHistoric(token);
                            setHistoric([]);
                            updateHistoric([]);
                        } catch (error) {
                            console.error("Erreur suppression historique:", error);
                        }
                    }
                }
            ]
        );
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

    const trajets = userHistoric.filter(e => e.route);

    return (
        <ScrollView
            style={[styles.scrollView, { backgroundColor: colors.bgMain }]}
            contentContainerStyle={styles.scrollContent}
        >
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                <Ionicons name="arrow-back" size={28} color={colors.textMain} />
            </TouchableOpacity>
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={[typography.h1, { color: colors.textMain }]}>
                        Mon historique
                    </Text>
                </View>
                <View style={styles.buttonsContainer}>
                    <DangerButton
                        title="Supprimer tout l'historique"
                        iconName="trash-outline"
                        onPress={handleDeleteAllHistoric}
                        style={{ marginTop: 10 }}
                    />
                </View>
                <View style={styles.section}>
                    {trajets && trajets.length > 0 ? (
                        trajets.map((item) => (
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
                                        {item.route.start_address}
                                    </Text>
                                    <Text style={[styles.historyRoute, { color: colors.textMain }]} numberOfLines={1}>
                                        {item.route.end_address}
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
    backButton: {
        marginTop: 60,
        marginBottom: 0,
        marginLeft: 10
    },
    container: {
        flex: 1,
        padding: 2,
        alignItems: 'center',
    },
    buttonsContainer: {
        width: '90%',
        marginTop: 20,
        gap: 20,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
        marginTop: 10,
    },
    section: {
        width: '100%',
        padding: 20,
        borderRadius: 15,
        marginBottom: 20,
        fontSize: 17,
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
});
