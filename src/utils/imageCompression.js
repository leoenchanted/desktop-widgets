const MAX_IMAGE_EDGE = 2560;
const HIGH_QUALITY = 0.92;

export function dataUrlToBlob(dataUrl) {
  const [meta, base64] = dataUrl.split(',');
  const mime = meta.match(/data:(.*?);base64/)?.[1] || 'application/octet-stream';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return new Blob([bytes], { type: mime });
}

export function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function readImage(fileOrBlob) {
  if ('createImageBitmap' in window) {
    return createImageBitmap(fileOrBlob);
  }

  return new Promise((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(fileOrBlob);
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Image decode failed'));
    };
    image.src = url;
  });
}

function getTargetSize(width, height) {
  const edge = Math.max(width, height);
  if (edge <= MAX_IMAGE_EDGE) return { width, height, resized: false };

  const scale = MAX_IMAGE_EDGE / edge;
  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
    resized: true,
  };
}

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Image encode failed'));
      },
      type,
      quality,
    );
  });
}

export async function compressImageForLocalStorage(file) {
  const image = await readImage(file);
  const naturalWidth = image.width || image.naturalWidth;
  const naturalHeight = image.height || image.naturalHeight;
  const target = getTargetSize(naturalWidth, naturalHeight);
  const shouldTranscode = target.resized || file.size > 4 * 1024 * 1024;

  if (!shouldTranscode) {
    return {
      blob: file,
      mimeType: file.type || 'image/png',
      width: naturalWidth,
      height: naturalHeight,
      compressed: false,
    };
  }

  const canvas = document.createElement('canvas');
  canvas.width = target.width;
  canvas.height = target.height;
  const context = canvas.getContext('2d', { alpha: true });
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.drawImage(image, 0, 0, target.width, target.height);

  const keepsAlpha = file.type === 'image/png' || file.type === 'image/webp';
  const outputType = keepsAlpha ? 'image/webp' : 'image/jpeg';
  const encoded = await canvasToBlob(canvas, outputType, HIGH_QUALITY);

  return {
    blob: encoded.size < file.size ? encoded : file,
    mimeType: encoded.size < file.size ? outputType : file.type || outputType,
    width: encoded.size < file.size ? target.width : naturalWidth,
    height: encoded.size < file.size ? target.height : naturalHeight,
    compressed: encoded.size < file.size,
  };
}
