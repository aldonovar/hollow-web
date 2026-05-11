import { supabase } from '../../../lib/supabase';

/**
 * Service to manage cloud storage operations for audio files in Supabase.
 */
class CloudStorageService {
  private readonly BUCKET_NAME = 'project-audio';

  private buildAudioPath(projectId: string, fileId: string, extension: 'flac' | 'wav'): string {
    return `${projectId}/${fileId}.${extension}`;
  }

  public async uploadAudioToCloud(projectId: string, fileId: string, data: Blob): Promise<string> {
    const isWav = data.type === 'audio/wav' || data.type === 'audio/x-wav' || data.type === '';
    const extension = isWav ? 'wav' : 'flac';
    const contentType = isWav ? 'audio/wav' : 'audio/flac';
    const filePath = this.buildAudioPath(projectId, fileId, extension);
    
    const { data: uploadData, error } = await supabase.storage
      .from(this.BUCKET_NAME)
      .upload(filePath, data, {
        cacheControl: '31536000',
        upsert: true,
        contentType: contentType
      });

    if (error) {
      console.error('Cloud upload error:', error);
      throw new Error(`Failed to upload to cloud: ${error.message}`);
    }

    return uploadData.path;
  }

  public async downloadAudioFromCloud(projectId: string, fileId: string): Promise<Blob> {
    const candidates: Array<'flac' | 'wav'> = ['flac', 'wav'];
    let lastError: { message?: string } | null = null;

    for (const extension of candidates) {
      const { data, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .download(this.buildAudioPath(projectId, fileId, extension));

      if (!error && data) {
        return data;
      }

      lastError = error;
    }

    console.error('Cloud download error:', lastError);
    throw new Error(`Failed to download from cloud: ${lastError?.message || 'missing object'}`);
  }
}

export const cloudStorageService = new CloudStorageService();
