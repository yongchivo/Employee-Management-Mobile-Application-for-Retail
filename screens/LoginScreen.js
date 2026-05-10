import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { useLanguage } from '../context/LanguageContext';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

export default function LoginScreen({ navigation }) {
  const { t, language, toggleLanguage } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', t('errorFields'));
      return;
    }
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      await setDoc(doc(db, 'users', cred.user.uid), {
        email: cred.user.email,
      }, {merge: true});
    } catch (error) {
      Alert.alert('Error', t('errorLogin'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.langBtn} onPress={toggleLanguage}>
        <Text style={styles.langText}>{language === 'es' ? '🇬🇧 EN' : '🇪🇸 ES'}</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Fichaje App</Text>
      <TextInput
        style={styles.input}
        placeholder={t('email')}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder={t('password')}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? t('signingIn') : t('login')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#fff' },
  langBtn: { position: 'absolute', top: 60, right: 24, padding: 8 },
  langText: { fontSize: 14, fontWeight: '600', color: '#555' },
  title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 40, color: '#1a1a2e' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 14, marginBottom: 16, fontSize: 16 },
  button: { backgroundColor: '#4CAF50', padding: 16, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});