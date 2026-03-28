import { supabase } from '@/lib/supabase';

/**
 * Compresse une image coté client en WebP 256x256
 * @param file Le fichier image d'origine
 * @returns Blob compressé
 */
export const compressAvatar = async (file: File): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 256;
        const MAX_HEIGHT = 256;
        let width = img.width;
        let height = img.height;

        // Cover / Crop logic for a square avatar
        const size = Math.min(width, height);
        const offsetX = (width - size) / 2;
        const offsetY = (height - size) / 2;

        canvas.width = MAX_WIDTH;
        canvas.height = MAX_HEIGHT;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        ctx.drawImage(img, offsetX, offsetY, size, size, 0, 0, MAX_WIDTH, MAX_HEIGHT);

        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Canvas to Blob failed'));
          },
          'image/webp',
          0.75 // Qualité de 75%
        );
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};

/**
 * Upload l'avatar compressé vers Supabase Storage
 * @param file Le fichier original séléctionné par l'utilisateur
 * @param participantId L'ID du participant (pour nommer le fichier de façon unique)
 * @returns Le path relatif du fichier uploadé (ou undefined si erreur traitée)
 */
export const uploadAvatar = async (file: File, participantId: string): Promise<string> => {
  try {
    const compressedBlob = await compressAvatar(file);
    const fileName = `avatar_${participantId}_${Date.now()}.webp`;

    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(fileName, compressedBlob, {
        cacheControl: '3600',
        upsert: false,
        contentType: 'image/webp',
      });

    if (error) {
       console.error("Erreur d'upload Storage Supabase : ", error);
       throw error;
    }

    return data.path;
  } catch (err) {
    console.error("Erreur d'upload avatar : ", err);
    throw err;
  }
};

/**
 * Supprime l'avatar existant du Storage
 * @param currentPath Path actuel dans le Storage
 */
export const deleteAvatar = async (currentPath: string): Promise<void> => {
  if (!currentPath) return;

  const { error } = await supabase.storage.from('avatars').remove([currentPath]);
  
  if (error) {
    console.error("Erreur de suppression d'avatar Storage : ", error);
  }
};

/**
 * Converti le path relatif du Storage en URL publique absolue utilisable en src d'une img
 * @param path Le path relatif (ex: avatar_123.webp)
 * @returns L'URL complète
 */
export const getAvatarPublicUrl = (path: string): string => {
  const { data } = supabase.storage.from('avatars').getPublicUrl(path);
  return data.publicUrl;
};

/**
 * Liste tous les fichiers disponibles dans le bucket 'avatars' (la Galerie)
 * @returns Tableau d'objets avec path et infos
 */
export const listAvatars = async () => {
  const { data, error } = await supabase.storage.from('avatars').list();
  if (error) {
    console.error("Erreur listing avatars : ", error);
    return [];
  }
  // Filtrer pour ne garder que les fichiers (pas de .emptyFolderPlaceholder etc.)
  return data.filter(file => file.name && file.name !== '.emptyFolderPlaceholder');
};

/**
 * Uploade un nouvel avatar générique dans la Galerie
 * @param file Le fichier PNG/JPG sélectionné
 * @returns Le path du fichier uploadé
 */
export const uploadToGallery = async (file: File): Promise<string> => {
  try {
    const compressedBlob = await compressAvatar(file);
    const randomHash = Math.random().toString(36).substring(7);
    const fileName = `gallery_${Date.now()}_${randomHash}.webp`;

    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(fileName, compressedBlob, {
        cacheControl: '3600',
        upsert: false,
        contentType: 'image/webp',
      });

    if (error) throw error;
    return data.path;
  } catch (err) {
    console.error("Erreur d'upload vers galerie : ", err);
    throw err;
  }
};
