import React, { useRef, useEffect, useState } from "react";
import { View, PanResponder, AppState, AppStateStatus } from "react-native";
import { useAuth } from "./AuthProvider";

const TIMEOUT = 1 * 60 * 1000; // 1 minute

export const InactivityProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isAuthenticated, logout } = useAuth();
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const appState = useRef(AppState.currentState);
  const [backgroundTime, setBackgroundTime] = useState<number | null>(null);

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

  // Handle App State Changes (Background/Foreground)
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        // App has come to the foreground
        if (backgroundTime && isAuthenticated) {
          const now = Date.now();
          const elapsed = now - backgroundTime;
          console.log(`App resumed. In background for ${elapsed}ms`);

          if (elapsed > TIMEOUT) {
            console.log("Background timeout exceeded -> Logout");
            try {
              await logout();
            } catch (e) {
              console.error("Background logout failed", e);
            }
          } else {
            // Still within session, reset timer for active usage
            resetTimer();
          }
        }
        setBackgroundTime(null);
      } else if (nextAppState.match(/inactive|background/)) {
        // App is going to background
        if (isAuthenticated) {
          setBackgroundTime(Date.now());
          // Optionally clear the active timer to prevent it firing while in background
          // (though setTimeout usually pauses in background on mobile, depend on OS)
          if (timerRef.current) clearTimeout(timerRef.current);
        }
      }

      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );

    return () => {
      subscription.remove();
    };
  }, [isAuthenticated, backgroundTime]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponderCapture: () => {
        resetTimer();
        return false; // Let the touch pass through to child components
      },
      // Optimization: Removed onMoveShouldSetPanResponderCapture to prevent excessive timer resets during scrolling.
      // onStart is sufficient to detect user presence.
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
