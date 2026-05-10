import { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, addDoc, getDocs, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useLanguage } from '../context/LanguageContext';

export default function HomeScreen({ navigation }) {
  const { t, language, toggleLanguage } = useLanguage();
  const user = auth.currentUser;
  const displayName = user?.email?.split('@')[0];
  const today = new Date().toISOString().split('T')[0];

  const [isClockedIn, setIsClockedIn] = useState(false);
  const [todayFichajes, setTodayFichajes] = useState([]);
  const [todayHours, setTodayHours] = useState('0h 0m');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const calculateHours = (fichajes) => {
    const entradas = fichajes.filter(f => f.type === 'entrada').sort((a, b) => a.timestamp?.toMillis() - b.timestamp?.toMillis());
    const salidas = fichajes.filter(f => f.type === 'salida').sort((a, b) => a.timestamp?.toMillis() - b.timestamp?.toMillis());
    let totalMinutes = 0;
    entradas.forEach((entrada, i) => {
      const salida = salidas[i];
      if (salida) totalMinutes += (salida.timestamp?.toMillis() - entrada.timestamp?.toMillis()) / 60000;
    });
    return `${Math.floor(totalMinutes / 60)}h ${Math.floor(totalMinutes % 60)}m`;
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      setIsClockedIn(userDoc.data()?.isClockedIn || false);

      const q = query(collection(db, 'users', user.uid, 'fichajes'), orderBy('timestamp', 'asc'));
      const snapshot = await getDocs(q);
      const all = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      const todayOnly = all.filter(f => f.date === today);

      setTodayFichajes(todayOnly);
      setTodayHours(calculateHours(todayOnly));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [user.uid, today]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleFichaje = async () => {
    setActionLoading(true);
    try {
      const type = isClockedIn ? 'salida' : 'entrada';
      await addDoc(collection(db, 'users', user.uid, 'fichajes'), {
        type,
        timestamp: serverTimestamp(),
        date: today,
        hour: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
      });
      await setDoc(doc(db, 'users', user.uid), { isClockedIn: !isClockedIn }, { merge: true });
      await loadData();
    } catch (e) {
      Alert.alert('Error', 'No se pudo registrar el fichaje');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  if (loading) return (
    <View style={styles.centered}>
      <ActivityIndicator size="large" color="#4CAF50" />
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{t('hello')}, {displayName} 👋</Text>
          <Text style={styles.subtitle}>{t('homeTitle')}</Text>
        </View>
        <TouchableOpacity onPress={toggleLanguage} style={styles.langBtn}>
          <Text style={styles.langText}>{language === 'es' ? '🇬🇧 EN' : '🇪🇸 ES'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.fichajeCard}>
        <View style={[styles.statusBadge, isClockedIn ? styles.statusIn : styles.statusOut]}>
          <Text style={styles.statusText}>
            {isClockedIn ? `🟢 ${t('working')}` : `🔴 ${t('notWorking')}`}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.clockBtn, isClockedIn ? styles.clockBtnOut : styles.clockBtnIn]}
          onPress={handleFichaje}
          disabled={actionLoading}
        >
          {actionLoading
            ? <ActivityIndicator color="#fff" size="large" />
            : <Text style={styles.clockBtnText}>{isClockedIn ? t('clockOut') : t('clockIn')}</Text>
          }
        </TouchableOpacity>

        <Text style={styles.hoursText}>
          {t('todayHours')}: <Text style={styles.hoursValue}>{todayHours}</Text>
        </Text>
      </View>

      <View style={styles.historyContainer}>
        <Text style={styles.historyTitle}>{t('todayHistory')}</Text>
        {todayFichajes.length === 0
          ? <Text style={styles.noRecords}>{t('noRecords')}</Text>
          : todayFichajes.map(item => (
              <View key={item.id} style={styles.fichajeRow}>
                <Text style={[styles.fichajeType, item.type === 'entrada' ? styles.entradaText : styles.salidaText]}>
                  {item.type === 'entrada' ? `↗ ${t('entrada')}` : `↙ ${t('salida')}`}
                </Text>
                <Text style={styles.fichajeHour}>{item.hour || '--:--'}</Text>
              </View>
            ))
        }
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>{t('logout')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#fff', padding: 24, paddingTop: 60,
    borderBottomWidth: 1, borderBottomColor: '#eee',
  },
  greeting: { fontSize: 20, fontWeight: 'bold', color: '#1a1a2e' },
  subtitle: { fontSize: 13, color: '#888', marginTop: 2 },
  langBtn: { padding: 8 },
  langText: { fontSize: 14, fontWeight: '600', color: '#555' },
  fichajeCard: {
    backgroundColor: '#fff', margin: 16, borderRadius: 16,
    padding: 24, alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  statusBadge: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, marginBottom: 24 },
  statusIn: { backgroundColor: '#e8f5e9' },
  statusOut: { backgroundColor: '#ffebee' },
  statusText: { fontWeight: '600', fontSize: 14 },
  clockBtn: {
    width: 160, height: 160, borderRadius: 80,
    justifyContent: 'center', alignItems: 'center', marginBottom: 24,
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 }, elevation: 4,
  },
  clockBtnIn: { backgroundColor: '#4CAF50' },
  clockBtnOut: { backgroundColor: '#e53935' },
  clockBtnText: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  hoursText: { fontSize: 14, color: '#888' },
  hoursValue: { fontWeight: 'bold', color: '#1a1a2e' },
  historyContainer: {
    backgroundColor: '#fff', marginHorizontal: 16,
    borderRadius: 16, padding: 16, flex: 1,
  },
  historyTitle: { fontWeight: 'bold', fontSize: 15, marginBottom: 12, color: '#1a1a2e' },
  noRecords: { color: '#aaa', textAlign: 'center', marginTop: 8 },
  fichajeRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  fichajeType: { fontWeight: '600', fontSize: 14 },
  entradaText: { color: '#4CAF50' },
  salidaText: { color: '#e53935' },
  fichajeHour: { color: '#555', fontSize: 14 },
  logoutBtn: {
    margin: 16, padding: 16, borderRadius: 10,
    borderWidth: 1, borderColor: '#ddd',
    alignItems: 'center', backgroundColor: '#fff',
  },
  logoutText: { color: '#e53935', fontWeight: '600' },
});