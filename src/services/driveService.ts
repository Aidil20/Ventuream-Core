import { getAccessToken } from '../lib/auth';

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
}

export const listDriveFiles = async (): Promise<DriveFile[]> => {
  const token = getAccessToken();
  if (!token) throw new Error('No access token available');

  const response = await fetch('https://www.googleapis.com/drive/v3/files?fields=files(id,name,mimeType,modifiedTime)&orderBy=folder,name', {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const errorBody = await response.json();
    console.error('Drive API Error:', errorBody);
    throw new Error(`Failed to fetch Drive files: ${response.statusText}`);
  }

  const data = await response.json();
  return data.files || [];
};

export const downloadFile = async (fileId: string): Promise<Blob> => {
  const token = getAccessToken();
  if (!token) throw new Error('No access token available');

  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to download file: ${response.statusText}`);
  }

  return await response.blob();
};
