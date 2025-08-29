import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function CounterScreen() {
  const [count, setCount] = useState(0);
  const [running, setRunning] = useState(false);
  const [millis, setMillis] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    if (running) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setRunning(true);
  }, [running]);

  const pause = useCallback(() => {
    Haptics.selectionAsync();
    setRunning(false);
    // Save a history entry when pausing if there is a non-zero count
    if (count > 0) {
      (async () => {
        try {
          const raw = await AsyncStorage.getItem('count_history');
          const history = raw ? JSON.parse(raw) : [];
          history.unshift({ id: Date.now(), value: count, millis, date: new Date().toISOString(), type: 'pause' });
          await AsyncStorage.setItem('count_history', JSON.stringify(history.slice(0, 100)));
        } catch {}
      })();
    }
  }, [count, millis]);

  const reset = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setRunning(false);
    if (count > 0) {
      (async () => {
        try {
          const raw = await AsyncStorage.getItem('count_history');
          const history = raw ? JSON.parse(raw) : [];
          history.unshift({ id: Date.now(), value: count, millis, date: new Date().toISOString(), type: 'reset' });
          await AsyncStorage.setItem('count_history', JSON.stringify(history.slice(0, 100)));
        } catch {}
      })();
    }
    setCount(0);
    setMillis(0);
  }, [count, millis]);

  useEffect(() => {
    // Load initial count
    (async () => {
      try {
        const saved = await AsyncStorage.getItem('count_value');
        if (saved !== null) {
          const n = Number(saved);
          if (!Number.isNaN(n)) setCount(n);
        }
      } catch {}
    })();

    if (running) {
      intervalRef.current = setInterval(() => {
        setMillis((m) => {
          const next = m + 10;
          if (next >= 1000) {
            setCount((c) => c + 1);
            return 0;
          }
          return next;
        });
      }, 10);
    } else {
      clearTimer();
    }
    return clearTimer;
  }, [running, clearTimer]);

  // Persist count whenever it changes
  useEffect(() => {
    (async () => {
      try {
        await AsyncStorage.setItem('count_value', String(count));
      } catch {}
    })();
  }, [count]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Counter</Text>
      <Text style={styles.count}>{`${count}.${String(millis).padStart(3, '0')}`}</Text>

      <View style={styles.controls}>
        {!running ? (
          <IconButton onPress={start} icon="play-arrow" label="Start" color="#16a34a" />
        ) : (
          <IconButton onPress={pause} icon="pause" label="Pause" color="#f59e0b" />
        )}
        <IconButton onPress={reset} icon="replay" label="Reset" color="#ef4444" />
      </View>
    </View>
  );
}

function IconButton({ onPress, icon, label, color }: { onPress: () => void; icon: React.ComponentProps<typeof MaterialIcons>['name']; label: string; color?: string }) {
  return (
    <TouchableOpacity accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={[styles.button, { borderColor: color || '#888' }]}> 
      <MaterialIcons name={icon} size={28} color={color || '#111'} />
      <Text style={[styles.buttonText, { color: color || '#111' }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 24,
  },
  title: {
    fontSize: 20,
    opacity: 0.7,
    color: '#ffffff',
  },
  count: {
    fontSize: 72,
    fontWeight: '700',
    color: '#ffffff',
  },
  controls: {
    flexDirection: 'row',
    gap: 16,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
