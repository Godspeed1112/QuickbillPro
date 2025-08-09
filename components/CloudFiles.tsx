import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Linking, Alert } from 'react-native';
import { supabase } from '../utils/supabase';
import { useNavigation } from 'expo-router';



const CloudFiles = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFiles = async () => {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) throw new Error('User not authenticated');

      const { data, error } = await supabase.storage
        .from('user-files')
        .list(`${user.id}/`, { limit: 100 });

      if (error) throw error;

      setFiles(data || []);
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const openFile = async (fileName: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    const path = `${user.id}/${fileName}`;

    const { data, error } = await supabase.storage
      .from('user-files')
      .createSignedUrl(path, 60 * 60);

    if (error) return Alert.alert('Error', error.message);

    Linking.openURL(data.signedUrl);
  };

  const deleteFile = async (fileName: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    const path = `${user.id}/${fileName}`;

    const { error } = await supabase.storage.from('user-files').remove([path]);

    if (error) return Alert.alert('Error', error.message);

    fetchFiles(); // Refresh
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>
        Your Cloud Files
      </Text>

      {loading ? (
        <Text>Loading...</Text>
      ) : (
        <ScrollView>
          {files.map((file) => (
            <View
              key={file.name}
              style={{
                padding: 12,
                borderBottomWidth: 1,
                borderColor: '#ccc',
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <TouchableOpacity onPress={() => openFile(file.name)}>
                <Text>{file.name}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => deleteFile(file.name)}>
                <Text style={{ color: 'red' }}>Delete</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

export default CloudFiles;
