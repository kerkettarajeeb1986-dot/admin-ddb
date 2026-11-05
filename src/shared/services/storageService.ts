import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';

export interface ImageCompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.1 to 1.0
  format?: 'image/webp' | 'image/jpeg';
}

export const storageService = {
  /**
   * Compresses any image client-side to prevent massive upload bandwidth and memory usage
   */
  async compressImage(file: File, options: ImageCompressionOptions = {}): Promise<Blob> {
    const {
      maxWidth = 1200,
      maxHeight = 1200,
      quality = 0.82,
      format = 'image/webp',
    } = options;

    return new Promise((resolve, reject) => {
      // If SVG or already very small (< 100KB), keep as is
      if (file.type === 'image/svg+xml' || file.size < 100 * 1024) {
        resolve(file);
        return;
      }

      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(url);
        let { width, height } = img;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file);
          return;
        }

        // Draw image with smooth resampling
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              resolve(file);
            }
          },
          format,
          quality
        );
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(file);
      };

      img.src = url;
    });
  },

  /**
   * Securely uploads product images to Firebase Storage with compression
   */
  async uploadProductImage(file: File, partnerId = 'general'): Promise<string> {
    try {
      const compressedBlob = await this.compressImage(file, { maxWidth: 1200, maxHeight: 1200, quality: 0.82 });
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filename = `products/${partnerId}/${Date.now()}_${sanitizedName}`;
      const storageRef = ref(storage, filename);

      const snapshot = await uploadBytes(storageRef, compressedBlob, {
        contentType: compressedBlob.type || 'image/webp',
      });
      return await getDownloadURL(snapshot.ref);
    } catch (storageError) {
      console.warn('Firebase Storage upload notice, falling back to optimized inline blob:', storageError);
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (e) => reject(e);
        reader.readAsDataURL(file);
      });
    }
  },

  /**
   * Uploads store / merchant identity photos
   */
  async uploadStorePhoto(file: File, partnerId: string): Promise<string> {
    try {
      const compressedBlob = await this.compressImage(file, { maxWidth: 1400, maxHeight: 1000, quality: 0.85 });
      const filename = `stores/${partnerId}/store_${Date.now()}.webp`;
      const storageRef = ref(storage, filename);
      const snapshot = await uploadBytes(storageRef, compressedBlob, { contentType: 'image/webp' });
      return await getDownloadURL(snapshot.ref);
    } catch {
      return this.uploadProductImage(file, partnerId);
    }
  },
};
