import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useLanguage } from '../context/LanguageContext';

export default function AdminScreen({navigation}) {
  const { t, language } = useLanguage();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const today = new Date().toISOString().split('T')[0];

  const calculateHours = (fichajes) => {
    const entradas = fichajes.filter(f => f.type === 'entrada').sort((a, b) => a.timestamp?.toMillis() - b.timestamp?.toMillis());
    const salidas  = fichajes.filter(f => f.type === 'salida').sort((a, b) => a.timestamp?.toMillis() - b.timestamp?.toMillis());
    let totalMinutes = 0;
    entradas.forEach((entrada, i) => {
      const salida = salidas[i];
      if (salida) totalMinutes += (salida.timestamp?.toMillis() - entrada.timestamp?.toMillis()) / 60000;
    });
    return `${Math.floor(totalMinutes / 60)}h ${Math.floor(totalMinutes % 60)}m`;
  };

  const loadEmployees = async () => {
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const data = await Promise.all(
        usersSnapshot.docs.map(async (userDoc) => {
          const info = userDoc.data();
          const fichajesQ = query(
            collection(db, 'users', userDoc.id, 'fichajes'),
            orderBy('timestamp', 'asc')
          );
          const fichajesSnap = await getDocs(fichajesQ);
          const allFichajes = fichajesSnap.docs.map(d => d.data());
          const todayFichajes = allFichajes.filter(f => f.date === today);
          return {
            id: userDoc.id,
            name: info.email?.split('@')[0] || 'Usuario',
            email: info.email || '',
            isClockedIn: info.isClockedIn || false,
            role: info.role || 'employee',
            todayFichajes,
            hours: calculateHours(todayFichajes),
          };
        })
      );
      setEmployees(data.filter(e => e.role !== 'admin'));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadEmployees(); }, []);

  if (loading) return (
    <View style={styles.centered}><ActivityIndicator size="large" color="#4CAF50" /></View>
  );

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); loadEmployees(); }}
          tintColor="#4CAF50"
        />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>{t('adminTitle')}</Text>
        <Text style={styles.date}>
        {new Date().toLocaleDateString(language === 'es' ? 'es-ES' : 'en-GB', {weekday: 'long', day: 'numeric', month: 'long' 
})}
        </Text>
      </View>

      {employees.length === 0
        ? <View style={styles.empty}><Text style={styles.emptyText}>{t('noEmployees')}</Text></View>
        : employees.map(emp => (
            <View key={emp.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.empName}>{emp.name}</Text>
                <View style={[styles.badge, emp.isClockedIn ? styles.badgeIn : styles.badgeOut]}>
                  <Text style={styles.badgeText}>
                    {emp.isClockedIn ? `🟢 ${t('working')}` : `🔴 ${t('notWorking')}`}
                  </Text>
                </View>
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.hoursText}>
                  {t('todayHours')}: <Text style={styles.hoursValue}>{emp.hours}</Text>
                </Text>
                {emp.todayFichajes.length > 0
                  ? emp.todayFichajes.map((f, i) => (
                      <Text key={i} style={[styles.fichajeItem, f.type === 'entrada' ? styles.entradaText : styles.salidaText]}>
                        {f.type === 'entrada' ? '↗' : '↙'} {f.hour}
                      </Text>
                    ))
                        : <Text style={styles.noRecords}>{t('noRecords')}</Text>
                }
                    <TouchableOpacity
                        style={styles.editBtn}
                        onPress={() => navigation.navigate('EditSchedule', {
                        employeeId: emp.id,
                        employeeName: emp.name
                        })}
                    >
                        <Text style={styles.editBtnText}>✏️ {t('editSchedule')}</Text>
                    </TouchableOpacity>
                </View>
            </View>
          ))
      }
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    backgroundColor: '#fff', padding: 24, paddingTop: 60,
    borderBottomWidth: 1, borderBottomColor: '#eee', marginBottom: 8,
  },
  title: { fontSize: 20, fontWeight: 'bold', color: '#1a1a2e' },
  date: { fontSize: 13, color: '#888', marginTop: 4, textTransform: 'capitalize' },
  empty: { padding: 40, alignItems: 'center' },
  emptyText: { color: '#aaa' },
  card: {
    backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 12,
    borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  empName: { fontSize: 16, fontWeight: 'bold', color: '#1a1a2e' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeIn: { backgroundColor: '#e8f5e9' },
  badgeOut: { backgroundColor: '#ffebee' },
  badgeText: { fontSize: 12, fontWeight: '600' },
  cardBody: { borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 10 },
  hoursText: { fontSize: 13, color: '#888', marginBottom: 6 },
  hoursValue: { fontWeight: 'bold', color: '#1a1a2e' },
  fichajeItem: { fontSize: 13, fontWeight: '500', marginTop: 2 },
  entradaText: { color: '#4CAF50' },
  salidaText: { color: '#e53935' },
  noRecords: { color: '#bbb', fontSize: 13, fontStyle: 'italic' },
  editBtn: {
    marginTop: 10, padding: 10, borderRadius: 8,
    borderWidth: 1, borderColor: '#4CAF50', alignItems: 'center',
  },
  editBtnText: { color: '#4CAF50', fontWeight: '600', fontSize: 13 },
});