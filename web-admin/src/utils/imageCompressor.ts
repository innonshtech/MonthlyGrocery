/**
 * Client-side fast image compressor to prevent HTTP 413 (Payload Too Large) errors
 * and optimize upload speeds for mobile/web apps.
 */
export async function compressImageForUpload(
  file: File,
  maxWidth = 900,
  maxHeight = 900,
  maxSizeBytes = 500 * 1024
): Promise<File> {
  // If SVG or already small enough, no compression needed
  if (file.type === 'image/svg+xml' || file.size <= maxSizeBytes) {
    return file;
  }

  // Only compress raster images
  if (!file.type.startsWith('image/')) {
    return file;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        const isPng = file.type === 'image/png' || file.name.toLowerCase().endsWith('.png');
        const outputMime = isPng ? 'image/png' : 'image/jpeg';
        const quality = isPng ? 0.9 : 0.85;

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }
            const cleanName = file.name.replace(/\.[^/.]+$/, '') + (isPng ? '.png' : '.jpg');
            const optimizedFile = new File([blob], cleanName, {
              type: outputMime,
              lastModified: Date.now(),
            });
            resolve(optimizedFile);
          },
          outputMime,
          quality
        );
      };
      img.onerror = () => resolve(file);
    };
    reader.onerror = () => resolve(file);
  });
}
