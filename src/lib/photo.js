// Photo helpers for the check-off screen.
//
// Phone photos are often bigger than 5 MB (our upload limit), so we shrink
// them in the browser before uploading: draw the photo on a canvas that is
// at most 1600 px wide or high, and save it as a JPEG.

export const MAX_PHOTO_SIZE_PX = 1600
const JPEG_QUALITY = 0.8 // 0 = worst, 1 = best. 0.8 looks good and is small.

// The biggest photo the server accepts: 5 MB. Must match file_size_limit
// of the 'photos' bucket in supabase/schema.sql (5242880 bytes).
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024

// Works out the new width and height so that the longest side is at most
// `maxSize`, keeping the same shape (aspect ratio). Small photos stay as they are.
// Example: fitWithin(4000, 3000) -> { width: 1600, height: 1200 }
export function fitWithin(width, height, maxSize = MAX_PHOTO_SIZE_PX) {
  const longestSide = Math.max(width, height)
  if (longestSide <= maxSize) return { width, height }
  const scale = maxSize / longestSide
  return { width: Math.round(width * scale), height: Math.round(height * scale) }
}

// Takes the photo File from the camera and returns a smaller JPEG File.
// If anything goes wrong (old browser, strange file), we return the original.
export async function shrinkPhoto(file) {
  try {
    const image = await createImageBitmap(file) // also turns the photo the right way up
    const { width, height } = fitWithin(image.width, image.height)

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    canvas.getContext('2d').drawImage(image, 0, 0, width, height)
    image.close()

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY))
    if (!blob) return file
    return new File([blob], 'photo.jpg', { type: 'image/jpeg' })
  } catch {
    return file
  }
}

// True if the photo is still too big to upload. This can happen when
// shrinkPhoto could not shrink it and gave back the original.
export function isPhotoTooBig(file) {
  return file.size > MAX_UPLOAD_BYTES
}
