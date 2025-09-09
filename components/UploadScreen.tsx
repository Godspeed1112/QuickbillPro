import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { supabase } from '../utils/supabaseClient'; // adjust path as needed
import { Alert } from 'react-native';

// Call this function in your onPress
const UploadScreen = async () => {
  const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });

  if (result.type === 'success') {
    const fileUri = result.uri;
    const fileName = result.name;

    try {
      const fileContent = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const { error } = await supabase.storage
        .from('quickbillpro-userfiles') // your bucket name
        .upload(`private/${fileName}`, Buffer.from(fileContent, 'base64'), {
          contentType: result.mimeType || 'application/octet-stream',
          upsert: true,
        });

      if (error) {
        console.error('Upload error:', error.message);
        Alert.alert('Upload Failed', error.message);
      } else {
        Alert.alert('Success', 'File uploaded to Supabase!');
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      Alert.alert('Error', 'Something went wrong while uploading.');
    }
  }
};

export default UploadScreen;
