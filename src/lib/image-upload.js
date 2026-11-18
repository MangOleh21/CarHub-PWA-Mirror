export const maxImageSizeBytes = 5 * 1024 * 1024
export const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp']

export function getImageFileError(file) {
  if (!file || !Number.isInteger(file.size) || file.size < 1) {
    return 'File foto tidak valid.'
  }
  if (!allowedImageTypes.includes(file.type)) {
    return 'Format foto harus JPG, PNG, atau WebP.'
  }
  if (file.size > maxImageSizeBytes) {
    return 'Ukuran foto maksimal 5 MB.'
  }
  return null
}
