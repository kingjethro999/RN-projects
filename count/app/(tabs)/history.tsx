import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

type HistoryItem = {
    id: number;
    value: number;
    date: string;
    type: 'pause' | 'reset';
    millis?: number;
};

export default function HistoryScreen() {

    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [refreshing, setRefreshing] = useState(false);

    const load = useCallback(async () => {
        try {
            const raw = await AsyncStorage.getItem('count_history');
            setHistory(raw ? JSON.parse(raw) : []);
        } catch {
            setHistory([]);
        }
    }, []);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await load();
        setRefreshing(false);
    }, [load]);

    const clear = useCallback(async () => {
        await Haptics.selectionAsync();
        try {
            await AsyncStorage.removeItem('count_history');
            setHistory([]);
        } catch { }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    // Also refresh whenever this tab/screen gains focus
    useFocusEffect(
        useCallback(() => {
            load();
        }, [load])
    );

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <View style={styles.header}>
                <Text style={styles.title}>History</Text>
                <TouchableOpacity onPress={clear} style={styles.clearBtn} accessibilityRole="button" accessibilityLabel="Clear history">
                    <Text style={styles.clearText}>Clear</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={history}
                keyExtractor={(item) => String(item.id)}
                ItemSeparatorComponent={() => <View style={styles.sep} />}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ffffff" titleColor="#ffffff" />
                }
                renderItem={({ item }) => (
                    <View style={styles.row}>
                        <Text style={styles.value}>{`${item.value}.${String(item.millis ?? 0).padStart(3, '0')}`}</Text>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.type}>{item.type.toUpperCase()}</Text>
                            <Text style={styles.date}>{new Date(item.date).toLocaleString()}</Text>
                        </View>
                    </View>
                )}
                ListEmptyComponent={<Text style={styles.empty}>No history yet</Text>}
                contentContainerStyle={history.length === 0 ? { flex: 1, justifyContent: 'center', alignItems: 'center' } : undefined}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, paddingHorizontal: 16, paddingVertical: 24, gap: 12, backgroundColor: '#000000' },
    header: { flexDirection: 'row', alignItems: 'center' },
    title: { fontSize: 22, fontWeight: '700', flex: 1, color: '#ffffff' },
    clearBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: '#ef4444' },
    clearText: { color: '#ef4444', fontWeight: '600' },
    sep: { height: 8 },
    row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
    value: { fontSize: 28, fontWeight: '800', width: 64, textAlign: 'right', color: '#ffffff' },
    type: { fontSize: 12, opacity: 0.7, color: '#ffffff' },
    date: { fontSize: 12, opacity: 0.7, color: '#ffffff' },
    empty: { opacity: 0.6, color: '#ffffff' },
});