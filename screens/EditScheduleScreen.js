import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Switch, Alert, ActivityIndicator } from 'react-native';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
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

export default function EditScheduleScreen({ navigation, route }) {
  const { employeeId, employeeName } = route.params;
  const { t } = useLanguage();
  const [schedule, setSchedule] = useState(DEFAULT_SCHEDULE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', employeeId));
        if (userDoc.data()?.schedule) setSchedule(userDoc.data().schedule);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [employeeId]);

  const updateDay = (day, field, value) => {
    setSchedule(prev => ({
      ...prev,
      [day]: { ...prev[day], [field]: value }
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'users', employeeId), { schedule }, { merge: true });
      Alert.alert('✅', t('scheduleSaved'), [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (e) {
      Alert.alert('Error', 'No se pudo guardar el horario');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <View style={styles.centered}><ActivityIndicator size="large" color="#4CAF50" /></View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← {t('back')}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{employeeName}</Text>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
          {saving
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={styles.saveBtnText}>{t('save')}</Text>
          }
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {DAYS.map(day => (
          <View key={day} style={styles.dayCard}>
            <View style={styles.dayHeader}>
              <Text style={styles.dayName}>{t(day)}</Text>
              <Switch
                value={schedule[day]?.active || false}
                onValueChange={(val) => updateDay(day, 'active', val)}
                trackColor={{ true: '#4CAF50', false: '#ddd' }}
              />
            </View>
            {schedule[day]?.active && (
              <View style={styles.timesRow}>
                <View style={styles.timeInput}>
                  <Text style={styles.timeLabel}>{t('startTime')}</Text>
                  <TextInput
                    style={styles.input}
                    value={schedule[day]?.start || ''}
                    onChangeText={(val) => updateDay(day, 'start', val)}
                    placeholder="09:00"
                    keyboardType="numbers-and-punctuation"
                    maxLength={5}
                  />
                </View>
                <Text style={styles.timeSep}>→</Text>
                <View style={styles.timeInput}>
                  <Text style={styles.timeLabel}>{t('endTime')}</Text>
                  <TextInput
                    style={styles.input}
                    value={schedule[day]?.end || ''}
                    onChangeText={(val) => updateDay(day, 'end', val)}
                    placeholder="18:00"
                    keyboardType="numbers-and-punctuation"
                    maxLength={5}
                  />
                </View>
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#fff', padding: 16, paddingTop: 60,
    borderBottomWidth: 1, borderBottomColor: '#eee',
  },
  backText: { color: '#4CAF50', fontWeight: '600', fontSize: 15 },
  title: { fontSize: 16, fontWeight: 'bold', color: '#1a1a2e', flex: 1, textAlign: 'center', marginHorizontal: 8 },
  saveBtn: { backgroundColor: '#4CAF50', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  saveBtnText: { color: '#fff', fontWeight: '600' },
  dayCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 10,
  },
  dayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dayName: { fontSize: 15, fontWeight: '600', color: '#1a1a2e' },
  timesRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  timeInput: { flex: 1 },
  timeLabel: { fontSize: 12, color: '#888', marginBottom: 4 },
  input: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 8,
    padding: 10, fontSize: 16, textAlign: 'center',
  },
  timeSep: { marginHorizontal: 12, color: '#aaa', fontSize: 18, marginTop: 16 },
});