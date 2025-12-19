import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import NetInfo, { NetInfoState } from "@react-native-community/netinfo";
import { View, StyleSheet, Modal, Platform } from "react-native";
import { EmptyState } from "../../shared/components/EmptyState";
import { useTheme } from "../../shared/styles/ThemeProvider";

interface NetworkContextType {
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
}

const NetworkContext = createContext<NetworkContextType>({
  isConnected: true,
  isInternetReachable: true,
});

export const useNetwork = () => useContext(NetworkContext);

interface NetworkProviderProps {
  children: ReactNode;
}

export const NetworkProvider: React.FC<NetworkProviderProps> = ({
  children,
}) => {
  const [networkState, setNetworkState] = useState<NetInfoState | null>(null);
  const { colors } = useTheme();

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setNetworkState(state);
    });

    // Initial check
    NetInfo.fetch().then((state) => {
      setNetworkState(state);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const isConnected = networkState?.isConnected ?? true;
  // Sur iOS/Android, isInternetReachable peut être null au début, on assume true pour éviter un flash
  const isReachable = networkState?.isInternetReachable ?? true;

  // On considère offline si connecté est faux
  // Note: Parfois on est connecté au Wifi mais pas d'internet (isInternetReachable = false)
  // Pour l'UX, on bloque surtout si on est sûr qu'il n'y a pas de connexion
  const isOffline = networkState && (!isConnected || isReachable === false);

  return (
    <NetworkContext.Provider
      value={{
        isConnected: networkState?.isConnected ?? null,
        isInternetReachable: networkState?.isInternetReachable ?? null,
      }}
    >
      {children}

      {/* Écran bloquant si hors ligne */}
      {isOffline && (
        <View style={[styles.offlineContainer, { backgroundColor: colors.background }]}>
          <EmptyState
            type="offline"
            onRetry={() => NetInfo.fetch()}
            actionLabel="Réessayer"
          />
        </View>
      )}
    </NetworkContext.Provider>
  );
};

const styles = StyleSheet.create({
  offlineContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 99999,
    justifyContent: "center",
    alignItems: "center",
  },
});
