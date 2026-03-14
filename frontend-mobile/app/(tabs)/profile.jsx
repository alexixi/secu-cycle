import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, DangerButton, OutlineButton } from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../hooks/useTheme';

export default function ProfilePage() {

    const router = useRouter();
    const { colors, typography } = useTheme();

    const { user, token, userBikes, logoutAuth, updateBikes } = useAuth();
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
                        <Ionicons name="location-outline" size={24} color={colors.textMain} />
                        <Text style={[styles.sectionTitle, { color: colors.textMain }]}>Mes adresses</Text>
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

                <View style={styles.buttonsContainer}>
                    <DangerButton
                        title="Se déconnecter"
                        iconName="log-out-outline"
                        onPress={() => logoutAuth() && router.push("/")}
                        isLoading={false}
                        disabled={false}
                    />
                </View>
            </View>
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
});
