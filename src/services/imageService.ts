// Image management service for chat attachments
export interface ImageMapping {
  [imageId: string]: {
    filename: string;
    originalName: string;
    uploadedAt: string;
    size: number;
  };
}

class ImageService {
  private mappingFile = '/chat-images/image-mapping.json';
  private imageFolder = '/chat-images/';

  /**
   * Get the public URL for an image by its ID
   */
  getImageUrl(imageId: string): string {
    // If it's already a URL (starts with http, data:, or blob:), return as is
    if (imageId.startsWith('http') || imageId.startsWith('data:') || imageId.startsWith('blob:')) {
      return imageId;
    }

    // Return the public URL for the image
    return `${this.imageFolder}${imageId}`;
  }

  /**
   * Save an image file and update the mapping
   */
  async saveImage(file: File, imageId: string): Promise<string> {
    try {
      // Create a filename with the imageId and original extension
      const extension = file.name.split('.').pop() || 'jpg';
      const filename = `${imageId}.${extension}`;
      
      // Convert file to base64 for storage
      const base64 = await this.fileToBase64(file);
      
      // Save the image data to localStorage temporarily (in a real app, this would be uploaded to server)
      const imageData = {
        filename,
        originalName: file.name,
        uploadedAt: new Date().toISOString(),
        size: file.size,
        data: base64
      };

      // Store in localStorage for now (in production, this would be uploaded to server)
      const existingImages = JSON.parse(localStorage.getItem('chat_images') || '{}');
      existingImages[imageId] = imageData;
      localStorage.setItem('chat_images', JSON.stringify(existingImages));

      return this.getImageUrl(imageId);
    } catch (error) {
      console.error('Error saving image:', error);
      throw error;
    }
  }

  /**
   * Get image data by ID
   */
  getImageData(imageId: string): any {
    const existingImages = JSON.parse(localStorage.getItem('chat_images') || '{}');
    return existingImages[imageId];
  }

  /**
   * Convert file to base64
   */
  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  }

  /**
   * Get all stored images
   */
  getAllImages(): ImageMapping {
    return JSON.parse(localStorage.getItem('chat_images') || '{}');
  }

  /**
   * Delete an image
   */
  deleteImage(imageId: string): void {
    const existingImages = JSON.parse(localStorage.getItem('chat_images') || '{}');
    delete existingImages[imageId];
    localStorage.setItem('chat_images', JSON.stringify(existingImages));
  }

  /**
   * Generate a unique image ID
   */
  generateImageId(): string {
    return `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const imageService = new ImageService();
