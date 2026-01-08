import React, { useRef, useEffect } from "react";
import { View, PanResponder } from "react-native";
import { useAuth } from "./AuthProvider";

const TIMEOUT = 1 * 60 * 1000; // 1 minute

export const InactivityProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isAuthenticated, logout } = useAuth();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const resetTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    if (isAuthenticated) {
      timerRef.current = setTimeout(async () => {
        console.log("Auto logout triggered due to inactivity");
        try {
          await logout();
        } catch (e) {
          console.error("Auto logout failed", e);
        }
      }, TIMEOUT);
    }
  };

  useEffect(() => {
    resetTimer();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isAuthenticated]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponderCapture: () => {
        resetTimer();
        return false; // Let the touch pass through to child components
      },
      onMoveShouldSetPanResponderCapture: () => {
        resetTimer();
        return false;
      },
      onPanResponderTerminationRequest: () => true,
      onShouldBlockNativeResponder: () => false,
    })
  ).current;

  return (
    <View style={{ flex: 1 }} {...panResponder.panHandlers}>
      {children}
    </View>
  );
};
