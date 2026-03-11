import * as tus from 'tus-js-client';
import { supabase } from '@/integrations/supabase/client';

export interface UploadOptions {
  file: File;
  bucket: string;
  path: string;
  onProgress: (bytesUploaded: number, bytesTotal: number) => void;
  onSuccess: (url: string) => void;
  onError: (error: Error) => void;
}

export interface UploadControls {
  pause: () => void;
  resume: () => void;
  cancel: () => void;
}

export const resumableUpload = ({ 
  file, 
  bucket, 
  path, 
  onProgress, 
  onSuccess, 
  onError 
}: UploadOptions): UploadControls => {
  const supabaseUrl = 'https://ibwhqkgvrkkqxiksbiqr.supabase.co';
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlid2hxa2d2cmtrcXhpa3NiaXFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNTAwNzAsImV4cCI6MjA2MzkyNjA3MH0.N7QChffwKW_r1KzAMiWqSmQwXKp7CHosVcaP-HQVNuM';

  // Get session token
  const getAccessToken = async (): Promise<string> => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || '';
  };

  let upload: tus.Upload;
  let isPaused = false;

  const startUpload = async () => {
    const accessToken = await getAccessToken();

    console.group('📤 Upload iniciado');
    console.log('Arquivo:', file.name);
    console.log('Tamanho:', (file.size / (1024*1024)).toFixed(2), 'MB');
    console.log('Chunks estimados:', Math.ceil(file.size / (20 * 1024 * 1024)));
    console.groupEnd();

    upload = new tus.Upload(file, {
      endpoint: `${supabaseUrl}/storage/v1/upload/resumable`,
      retryDelays: [0, 1000, 3000, 5000], // Retry mais agressivo
      chunkSize: 20 * 1024 * 1024, // 20MB chunks (otimizado)
      removeFingerprintOnSuccess: true, // Evita cache issues
      metadata: {
        bucketName: bucket,
        objectName: path,
        contentType: file.type,
        cacheControl: '3600',
      },
      headers: {
        authorization: `Bearer ${accessToken}`,
        apikey: supabaseKey,
      },
      onError: (error) => {
        console.error('❌ Erro no upload:', {
          message: error.message,
          file: file.name,
          size: (file.size / (1024 * 1024)).toFixed(2) + 'MB',
          uploadedAt: new Date().toISOString()
        });
        onError(error);
      },
      onProgress: (bytesUploaded, bytesTotal) => {
        onProgress(bytesUploaded, bytesTotal);
      },
      onSuccess: () => {
        const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
        onSuccess(publicUrl);
      },
    });

    upload.start();
  };

  startUpload();

  return {
    pause: () => {
      if (upload && !isPaused) {
        upload.abort();
        isPaused = true;
      }
    },
    resume: () => {
      if (isPaused) {
        startUpload();
        isPaused = false;
      }
    },
    cancel: () => {
      if (upload) {
        upload.abort(true);
      }
    },
  };
};
