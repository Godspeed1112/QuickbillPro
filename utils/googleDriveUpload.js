export const uploadPdfToDrive = async (pdfPath, accessToken, fileName) => {
  const fileInfo = await FileSystem.getInfoAsync(pdfPath);
  if (!fileInfo.exists) {
    throw new Error('PDF file not found');
  }

  const fileData = await FileSystem.readAsStringAsync(pdfPath, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const metadata = {
    name: fileName,
    parents: ['your-folder-id'], // Optional: specify folder
  };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], {type: 'application/json'}));
  form.append('file', new Blob([fileData], {type: 'application/pdf'}));

  const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
    body: form,
  });

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.statusText}`);
  }

  return await response.json();
};