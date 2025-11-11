import React, { useState } from "react";
import {
    View,
    Text,
    ScrollView,
    TextInput,
    TouchableOpacity,
    StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons"; // ou "react-native-vector-icons/Ionicons"
import { MaterialCommunityIcons } from "@expo/vector-icons"; // ou Ionicons



const WalletScreens: React.FC = () => {
    const [transferType, setTransferType] = useState<"walletToBank" | "bankToWallet">("walletToBank");
    const [walletNumber, setWalletNumber] = useState<string>("");
    const [bankAccount, setBankAccount] = useState<string>("");
    const [amount, setAmount] = useState<number>(0);

    const handleQuickAmount = (value: number) => {
        setAmount(value);
    };

    const handleSubmit = () => {
        alert(`Transfert de ${amount} XAF depuis ${walletNumber} vers ${bankAccount}`);
    };

    return (
        <ScrollView style={styles.container}>
            {/* HEADER */}
            <View style={styles.headerCard}>
                <View
                    style={{
                        backgroundColor: "#0066CC", // fond bleu
                        borderRadius: 25,           // rond si largeur = hauteur
                        width: 50,
                        height: 50,
                        justifyContent: "center",
                        alignItems: "center",
                    }}
                >
                    <Ionicons name="wallet-outline" size={28} color="#fff" /> {/* icône blanche */}
                </View>                <Text style={styles.headerTitle}>Wallet</Text>
                <Text style={styles.headerSubtitle}>Gérez vos transferts entre wallet et compte bancaire</Text>
            </View>

            {/* TRANSFER TYPE */}
            <View style={styles.transferTypeRow}>
                <TouchableOpacity
                    style={[styles.typeBtn, transferType === "walletToBank" && styles.typeBtnActive]}
                    onPress={() => setTransferType("walletToBank")}
                >
                    <Text>💳 Wallet → Banque</Text>
                    <Text style={styles.typeBtnText}>Transférer vers compte bancaire</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.typeBtn, transferType === "bankToWallet" && styles.typeBtnActive]}
                    onPress={() => setTransferType("bankToWallet")}
                >
                    <Text>🏦 Banque → Wallet</Text>
                    <Text style={styles.typeBtnText}>Recharger votre wallet</Text>
                </TouchableOpacity>
            </View>

            {/* FORM */}
            <View style={styles.formCard}>
                <Text style={styles.label}>Wallet source</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Numéro Wallet (ex: 077 xx xx xx)"
                    value={walletNumber}
                    onChangeText={setWalletNumber}
                />

                <Text style={styles.label}>Compte bancaire destinataire</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Ex: SGBCI, NSIA, Ecobank"
                    value={bankAccount}
                    onChangeText={setBankAccount}
                />

                <Text style={styles.label}>Montant</Text>
                <View style={styles.amountRow}>
                    <TextInput
                        style={[styles.input, { flex: 1 }]}
                        keyboardType="numeric"
                        value={amount.toString()}
                        onChangeText={(text) => setAmount(Number(text))}
                    />
                    <Text style={styles.currency}>XAF</Text>
                </View>

                {/* QUICK AMOUNTS */}
                <View style={styles.quickRow}>
                    {[10000, 25000, 50000, 100000].map((val) => (
                        <TouchableOpacity
                            key={val}
                            style={styles.quickBtn}
                            onPress={() => handleQuickAmount(val)}>
                            <Text style={{ color: "#00960cff", fontWeight: "bold" }}>{val / 1000}k</Text>
                        </TouchableOpacity>
                    ))}
                </View>


                <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <Ionicons name="checkmark-circle-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
                        <Text style={styles.submitText}>Effectuer le transfert</Text>
                    </View>
                </TouchableOpacity>
            </View>
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", marginTop: 10 }}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <View
                        style={{
                            width: 20,
                            height: 20,
                            borderRadius: 10,
                            backgroundColor: "#34ff45",
                            justifyContent: "center",
                            alignItems: "center",
                            marginRight: 8,
                        }}
                    >
                        <MaterialCommunityIcons name="shield-check" size={14} color="#fff" />
                    </View>
                    <Text style={styles.secure}>Vos transferts sont sécurisés et cryptés</Text>
                </View>
            </View>

        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#f7f7f7", padding: 16 },

    headerCard: {
        backgroundColor: "#fff",
        alignItems: "center",
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.12,
        shadowRadius: 6,
        elevation: 5,
    },
    headerTitle: { fontSize: 20, fontWeight: "bold" },
    headerSubtitle: { fontSize: 14, color: "#666", marginTop: 5 },

    transferTypeRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16 },
    typeBtn: {
        flex: 1,
        backgroundColor: "#f0f2f5",
        padding: 12,
        borderRadius: 12,
        marginHorizontal: 5,
        alignItems: "center",
    },
    typeBtnActive: { backgroundColor: "#0066CC" },
    typeBtnText: { fontSize: 12, color: "#555", marginTop: 4, textAlign: "center" },

    formCard: {
        backgroundColor: "#fff",
        padding: 16,
        borderRadius: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 3,
    },
    label: { fontWeight: "bold", marginBottom: 5, marginTop: 10 },
    input: {
        backgroundColor: "#f7f7f7",
        borderRadius: 12,
        padding: 12,
        marginBottom: 10,
    },

    amountRow: { flexDirection: "row", alignItems: "center" },
    currency: { marginLeft: 8, fontWeight: "bold", fontSize: 16 },

    quickRow: { flexDirection: "row", justifyContent: "space-between", marginVertical: 10 },
    quickBtn: {
        flex: 1,
        backgroundColor: "#b2ffb8ff",
        marginHorizontal: 5,
        padding: 10,
        borderRadius: 12,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#7cbe81ff", // couleur de la bordure
    },


    submitBtn: {
        backgroundColor: "#0066CC",
        padding: 16,
        borderRadius: 12,
        marginTop: 10,
        alignItems: "center",
    },
    submitText: { color: "#fff", fontWeight: "bold" },
    secure: {
        color: "#727272ff",

    },
});

export default WalletScreens;
