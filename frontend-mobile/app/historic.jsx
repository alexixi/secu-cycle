import { FontAwesome, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View, TouchableOpacity, Alert } from 'react-native';
import { Button, DangerButton, OutlineButton } from '../components/ui/Button';
import HistoricModal from '../components/HistoricModal';
import { useAuth } from '../context/AuthContext';
import { useFormat } from '../hooks/useFormat';
import { useTheme } from '../hooks/useTheme';
import { getUserHistoric, deleteHistoricEntry, deleteAllHistoric } from '../services/apiBack';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { SwipeBackScreen } from '../components/SwipeBackScreen';
import { useTranslation } from 'react-i18next';

export default function HistoricPage() {

    const { colors } = useTheme();
    const { t } = useTranslation();
    const f = useFormat();

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
            t('compte.historique.supprimerToutTitre'),
            t('compte.historique.supprimerToutTexte'),
            [
                { text: t('commun.annuler'), style: "cancel" },
                {
                    text: t('compte.historique.supprimerTout'),
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
        <SwipeBackScreen background={colors.bgMain}>
        {(close) => (
        <ScrollView
            style={[styles.scrollView, { backgroundColor: colors.bgMain }]}
            contentContainerStyle={styles.scrollContent}
        >
            <View style={styles.headerWrap}>
                <ScreenHeader title={t('compte.historique.titreEcran')} onBack={close} />
            </View>
            <View style={styles.container}>
                <View style={styles.buttonsContainer}>
                    <DangerButton
                        title={t('compte.historique.supprimerToutTitre')}
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
                                            {t('compte.historique.kilometres', { valeur: f.nombre(item.route.distance_km, { maximumFractionDigits: 1, minimumFractionDigits: 1 }) })}
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
            </View>

            <HistoricModal
                isOpen={isModalOpenHistoric}
                onClose={() => setIsModalOpenHistoric(false)}
                entry={selectedHistoricEntry}
                onDelete={handleDeleteHistoricEntry}
                colors={colors}
            />
        </ScrollView>
        )}
        </SwipeBackScreen>
    );
}

const styles = StyleSheet.create({
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
    },
    headerWrap: {
        paddingHorizontal: 20,
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
