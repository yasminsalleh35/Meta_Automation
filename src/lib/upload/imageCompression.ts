import imageCompression from 'browser-image-compression';

export const compressImage = async (file: File): Promise<File> => {
  // Don't compress if already small (less than 2MB)
  const maxSizeMB = 2;
  if (file.size / (1024 * 1024) < maxSizeMB) {
    console.log(`File ${file.name} is already small (${(file.size / (1024 * 1024)).toFixed(2)}MB), skipping compression`);
    return file;
  }

  const options = {
    maxSizeMB,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    fileType: file.type,
  };

  try {
    console.log(`Compressing ${file.name} from ${(file.size / (1024 * 1024)).toFixed(2)}MB...`);
    const compressedFile = await imageCompression(file, options);
    console.log(`Compressed to ${(compressedFile.size / (1024 * 1024)).toFixed(2)}MB`);
    
    // Return compressed file with original name
    return new File([compressedFile], file.name, {
      type: compressedFile.type,
      lastModified: Date.now(),
    });
  } catch (error) {
    console.error('Error compressing image, using original:', error);
    return file;
  }
};
