# Chat Images Directory

This directory contains images uploaded through the chat system.

## File Structure

- `image-mapping.json` - Maps image IDs to their metadata
- `*.jpg`, `*.png`, `*.gif` - Actual image files

## How it works

1. When a user uploads an image, it gets a unique ID (e.g., `img_1234567890_abc123def`)
2. The image is stored in localStorage as base64 data
3. The image ID is used in chat messages
4. When displaying images, the system:
   - Checks if the URL is already a proper URL (http, data:, blob:)
   - If not, looks up the image data in localStorage
   - Returns the base64 data for display

## Image Service

The `imageService` handles:
- Generating unique image IDs
- Saving images to localStorage
- Retrieving image URLs and data
- Managing the image mapping

## Usage

```typescript
import { imageService } from '@/services/imageService';

// Generate a new image ID
const imageId = imageService.generateImageId();

// Save an image
const imageUrl = await imageService.saveImage(file, imageId);

// Get image URL
const url = imageService.getImageUrl(imageId);

// Get image data
const data = imageService.getImageData(imageId);
```
