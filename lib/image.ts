export async function processImageFile(
  file: File,
  maxDimension = 1280,
  quality = 0.85
): Promise<string> {
  if (!file.type.startsWith("image/") && !/\.(jpe?g|png|webp|heic|heif)$/i.test(file.name)) {
    throw new Error("Selected file is not an image")
  }

  let bitmap: ImageBitmap | HTMLImageElement | null = null
  let objectUrl: string | null = null

  try {
    if (typeof createImageBitmap === "function") {
      try {
        bitmap = await createImageBitmap(file)
      } catch {
        bitmap = null
      }
    }

    if (!bitmap) {
      objectUrl = URL.createObjectURL(file)
      bitmap = await loadImage(objectUrl)
    }

    const sourceWidth = "naturalWidth" in bitmap ? bitmap.naturalWidth : bitmap.width
    const sourceHeight = "naturalHeight" in bitmap ? bitmap.naturalHeight : bitmap.height
    const { width, height } = scaleDown(sourceWidth, sourceHeight, maxDimension)

    const canvas = document.createElement("canvas")
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext("2d")
    if (!ctx) throw new Error("Could not prepare image canvas")

    ctx.drawImage(bitmap as CanvasImageSource, 0, 0, width, height)
    const dataUrl = canvas.toDataURL("image/jpeg", quality)
    if (!dataUrl || !dataUrl.startsWith("data:image/")) {
      throw new Error("Could not encode image")
    }
    return dataUrl
  } finally {
    if (bitmap && "close" in bitmap && typeof (bitmap as ImageBitmap).close === "function") {
      try { (bitmap as ImageBitmap).close() } catch {}
    }
    if (objectUrl) URL.revokeObjectURL(objectUrl)
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error("Could not decode the selected image"))
    img.src = src
  })
}

function scaleDown(w: number, h: number, max: number) {
  if (!w || !h) return { width: max, height: max }
  if (w <= max && h <= max) return { width: w, height: h }
  const ratio = w > h ? max / w : max / h
  return { width: Math.round(w * ratio), height: Math.round(h * ratio) }
}
