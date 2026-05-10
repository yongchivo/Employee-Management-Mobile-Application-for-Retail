import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { doc, getDoc } from 'firebase/firestore';
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

export default function ScheduleScreen() {
  const { t } = useLanguage();
  const user = auth.currentUser;
  const [schedule, setSchedule] = useState(DEFAULT_SCHEDULE);
  const [loading, setLoading] = useState(true);

  // JS getDay(): 0=Dom, 1=Lun... → convertimos a nuestro índice (0=Lun...6=Dom)
  const todayKey = DAYS[(new Date().getDay() + 6) % 7];

  useEffect(() => {
    const load = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.data()?.schedule) setSchedule(userDoc.data().schedule);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user.uid]);

  if (loading) return (
    <View style={styles.centered}><ActivityIndicator size="large" color="#4CAF50" /></View>
  );

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
});