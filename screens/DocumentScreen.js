import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator, Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as WebBrowser from 'expo-web-browser';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { auth, db, storage } from '../firebase';
import { useLanguage } from '../context/LanguageContext';

export default function DocumentsScreen() {
  const { t } = useLanguage();
  const user = auth.currentUser;
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const loadDocuments = async () => {
    try {
      const q = query(collection(db, 'documents'), orderBy('uploadedAt', 'desc'));
      const snapshot = await getDocs(q);
      setDocuments(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadDocuments(); }, []);

  const handleUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;

      setUploading(true);
      const file = result.assets[0];
      const response = await fetch(file.uri);
      const blob = await response.blob();

      const storageRef = ref(storage, `documents/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, blob);
      const url = await getDownloadURL(storageRef);

      await addDoc(collection(db, 'documents'), {
        name: file.name,
        url,
        uploadedAt: serverTimestamp(),
        uploadedBy: user.uid,
        size: file.size,
      });

      await loadDocuments();
    } catch (e) {
      Alert.alert('Error', 'No se pudo subir el documento');
      console.error(e);
    } finally {
      setUploading(false);
    }
  };

  const handleOpen = async (url) => {
    await WebBrowser.openBrowserAsync(url);
  };

  const formatSize = (bytes) => bytes ? `${(bytes / 1024).toFixed(0)} KB` : '';

  if (loading) return (
    <View style={styles.centered}><ActivityIndicator size="large" color="#4CAF50" /></View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('documentsTitle')}</Text>
        <TouchableOpacity style={styles.uploadBtn} onPress={handleUpload} disabled={uploading}>
          {uploading
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={styles.uploadBtnText}>+ {t('upload')}</Text>
          }
        </TouchableOpacity>
      </View>

      {documents.length === 0
        ? <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📄</Text>
            <Text style={styles.emptyText}>{t('noDocs')}</Text>
          </View>
        : <FlatList
            data={documents}
            keyExtractor={item => item.id}
            contentContainerStyle={{ padding: 16 }}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.docRow} onPress={() => handleOpen(item.url)}>
                <Text style={styles.docIcon}>📄</Text>
                <View style={styles.docInfo}>
                  <Text style={styles.docName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.docMeta}>{formatSize(item.size)}</Text>
                </View>
                <Text style={styles.openText}>{t('open')}</Text>
              </TouchableOpacity>
            )}
          />
      }
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
  title: { fontSize: 20, fontWeight: 'bold', color: '#1a1a2e' },
  uploadBtn: { backgroundColor: '#4CAF50', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  uploadBtnText: { color: '#fff', fontWeight: '600' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: '#aaa', fontSize: 15 },
  docRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 8,
  },
  docIcon: { fontSize: 28, marginRight: 12 },
  docInfo: { flex: 1 },
  docName: { fontWeight: '600', fontSize: 14, color: '#1a1a2e' },
  docMeta: { color: '#aaa', fontSize: 12, marginTop: 2 },
  openText: { color: '#4CAF50', fontWeight: '600', fontSize: 13 },
});