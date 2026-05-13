import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity } from 'react-native';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import { auth, db } from '../firebase';
import { useLanguage } from '../context/LanguageContext';

const DAYS = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];

const DEFAULT_SCHEDULE = {
  lunes:     { start: '09:00', end: '18:00', active: true },
  martes:    { start: '09:00', end: '18:00', active: true },
  miercoles: { start: '09:00', end: '18:00', active: true },
  jueves:    { start: '09:00', end: '18:00', active: true },
  viernes:   { start: '09:00', end: '18:00', active: true },
  sabado:    { start: '10:00', end: '14:00', active: true },
  domingo:   { start: '00:00', end: '00:00', active: false },
};

export default function ScheduleScreen({ navigation }) {
  const { t } = useLanguage();
  const user = auth.currentUser;
  const [schedule, setSchedule] = useState(DEFAULT_SCHEDULE);
  const [isAdmin, setIsAdmin] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  const todayKey = DAYS[(new Date().getDay() + 6) % 7];

  const load = async () => {
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.data();
      const admin = userData?.role === 'admin';
      setIsAdmin(admin);

      if (admin) {
        const snap = await getDocs(collection(db, 'users'));
        const list = snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(u => u.role !== 'admin');
        setEmployees(list);
      } else if (userData?.schedule) {
        setSchedule(userData.schedule);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Recarga cada vez que la pestaña recibe foco
  // (así, tras editar un horario, la lista refleja el cambio al volver)
  useFocusEffect(useCallback(() => { load(); }, [user.uid]));

  if (loading) return (
    <View style={styles.centered}><ActivityIndicator size="large" color="#4CAF50" /></View>
  );

  // ─── VISTA ADMIN: lista de empleados ───
  if (isAdmin) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('scheduleTitle')}</Text>
        </View>

        {employees.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>{t('noEmployees')}</Text>
          </View>
        ) : (
          employees.map(emp => {
            const name = emp.email?.split('@')[0] || 'Usuario';
            const hasSchedule = !!emp.schedule;
            return (
              <TouchableOpacity
                key={emp.id}
                style={styles.empCard}
                onPress={() => navigation.navigate('EditSchedule', {
                  employeeId: emp.id,
                  employeeName: name,
                })}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.empName}>{name}</Text>
                  <Text style={styles.empHint}>
                    {hasSchedule ? t('scheduleConfigured') : t('scheduleNotConfigured')}
                  </Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    );
  }

  // ─── VISTA EMPLEADO: su horario en read-only ───
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('scheduleTitle')}</Text>
      </View>

      {DAYS.map((day) => {
        const data = schedule[day] || { active: false };
        const isToday = day === todayKey;
        return (
          <View key={day} style={[styles.dayRow, isToday && styles.todayRow]}>
            <View style={styles.dayLeft}>
              {isToday && <View style={styles.todayDot} />}
              <Text style={[styles.dayName, isToday && styles.todayText]}>{t(day)}</Text>
            </View>
            <Text style={[styles.hours, !data.active && styles.restText, isToday && styles.todayText]}>
              {data.active ? `${data.start} – ${data.end}` : t('restDay')}
            </Text>
          </View>
        );
      })}
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
  empty: { padding: 40, alignItems: 'center' },
  emptyText: { color: '#aaa' },

  // Empleado
  dayRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 8,
    padding: 16, borderRadius: 12,
  },
  todayRow: { backgroundColor: '#e8f5e9', borderWidth: 1, borderColor: '#4CAF50' },
  dayLeft: { flexDirection: 'row', alignItems: 'center' },
  todayDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4CAF50', marginRight: 8 },
  dayName: { fontSize: 15, fontWeight: '500', color: '#333' },
  todayText: { color: '#2e7d32', fontWeight: 'bold' },
  hours: { fontSize: 14, color: '#555' },
  restText: { color: '#aaa', fontStyle: 'italic' },

  // Admin
  empCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 8,
    padding: 16, borderRadius: 12,
  },
  empName: { fontSize: 16, fontWeight: '600', color: '#1a1a2e' },
  empHint: { fontSize: 12, color: '#888', marginTop: 2 },
  chevron: { fontSize: 24, color: '#bbb', marginLeft: 12 },
});