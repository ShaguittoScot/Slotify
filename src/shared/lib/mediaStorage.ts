import { isSupabaseConfigured, supabase } from './supabase';

export const BUSINESS_LOGOS_BUCKET = 'business-logos';
export const MAX_LOGO_SIZE_BYTES = 4 * 1024 * 1024;
export const ALLOWED_LOGO_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export type AllowedLogoMimeType = (typeof ALLOWED_LOGO_MIME_TYPES)[number];

export interface NormalizedLogoImageType {
  mimeType: AllowedLogoMimeType;
  ext: 'jpg' | 'png' | 'webp';
}

export interface UploadBusinessLogoInput {
  bytes: Uint8Array;
  mimeType?: string | null;
  fileName?: string | null;
  businessId?: string | null;
  previousLogoUrl?: string | null;
}

export interface UploadBusinessLogoResult {
  publicUrl: string;
  storagePath: string;
}

const MIME_MAP: Record<string, NormalizedLogoImageType> = {
  'image/jpeg': { mimeType: 'image/jpeg', ext: 'jpg' },
  'image/jpg': { mimeType: 'image/jpeg', ext: 'jpg' },
  'image/png': { mimeType: 'image/png', ext: 'png' },
  'image/webp': { mimeType: 'image/webp', ext: 'webp' },
};

const EXT_MAP: Record<string, NormalizedLogoImageType> = {
  jpg: { mimeType: 'image/jpeg', ext: 'jpg' },
  jpeg: { mimeType: 'image/jpeg', ext: 'jpg' },
  png: { mimeType: 'image/png', ext: 'png' },
  webp: { mimeType: 'image/webp', ext: 'webp' },
};

const BASE64_ALPHABET =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

export function base64ToUint8Array(base64Input: string): Uint8Array {
  const commaIdx = base64Input.indexOf(',');
  const raw = commaIdx >= 0 && base64Input.slice(0, commaIdx).includes(';base64')
    ? base64Input.slice(commaIdx + 1)
    : base64Input;
  const cleaned = raw.replace(/\s+/g, '');

  if (!cleaned) return new Uint8Array(0);

  let padding = 0;
  if (cleaned.endsWith('==')) padding = 2;
  else if (cleaned.endsWith('=')) padding = 1;

  const byteLength = Math.floor((cleaned.length * 3) / 4) - padding;
  if (byteLength <= 0) return new Uint8Array(0);

  const bytes = new Uint8Array(byteLength);
  let out = 0;

  for (let i = 0; i < cleaned.length; i += 4) {
    const c1 = BASE64_ALPHABET.indexOf(cleaned[i]);
    const c2 = BASE64_ALPHABET.indexOf(cleaned[i + 1]);
    const c3Char = cleaned[i + 2];
    const c4Char = cleaned[i + 3];
    const c3 = c3Char === '=' ? 0 : BASE64_ALPHABET.indexOf(c3Char);
    const c4 = c4Char === '=' ? 0 : BASE64_ALPHABET.indexOf(c4Char);

    if (c1 < 0 || c2 < 0 || (c3Char !== '=' && c3 < 0) || (c4Char !== '=' && c4 < 0)) {
      throw new Error('Los datos de imagen en Base64 no son válidos.');
    }

    const chunk = (c1 << 18) | (c2 << 12) | (c3 << 6) | c4;
    if (out < byteLength) bytes[out++] = (chunk >> 16) & 0xff;
    if (out < byteLength) bytes[out++] = (chunk >> 8) & 0xff;
    if (out < byteLength) bytes[out++] = chunk & 0xff;
  }

  return bytes;
}

export function normalizeImageMimeType(
  mimeType?: string | null,
  fileName?: string | null
): NormalizedLogoImageType | null {
  const normalizedMime = mimeType?.split(';')[0]?.trim().toLowerCase();
  if (normalizedMime) {
    return MIME_MAP[normalizedMime] ?? null;
  }

  const extMatch = /\.([a-z0-9]+)(?:\?.*)?$/i.exec(fileName?.trim() || '');
  if (extMatch) {
    return EXT_MAP[extMatch[1].toLowerCase()] ?? null;
  }

  return null;
}

export function extractBusinessLogoStoragePath(url?: string | null): string | null {
  if (!url) return null;
  const regex = new RegExp(
    `/storage/v1/object/public/${BUSINESS_LOGOS_BUCKET}/(.+?)(?:\\?.*)?$`,
    'i'
  );
  const match = regex.exec(url.trim());
  if (!match?.[1]) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

export async function deleteBusinessLogoIfManaged(
  logoUrl?: string | null
): Promise<void> {
  if (!isSupabaseConfigured) return;
  const path = extractBusinessLogoStoragePath(logoUrl);
  if (!path) return;
  try {
    await supabase.storage.from(BUSINESS_LOGOS_BUCKET).remove([path]);
  } catch {
    // Eliminación best-effort para no bloquear cambios de marca
  }
}

function sanitizePathSegment(value?: string | null): string {
  const cleaned = (value || 'general').replace(/[^a-zA-Z0-9_-]/g, '');
  return cleaned || 'general';
}

export async function uploadBusinessLogo(
  input: UploadBusinessLogoInput
): Promise<UploadBusinessLogoResult> {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase no está configurado para subir imágenes.');
  }

  if (!input.bytes || input.bytes.byteLength === 0) {
    throw new Error('El archivo de imagen está vacío.');
  }

  if (input.bytes.byteLength > MAX_LOGO_SIZE_BYTES) {
    throw new Error('El logotipo debe pesar menos de 4 MB.');
  }

  const normalizedType = normalizeImageMimeType(input.mimeType, input.fileName);
  if (!normalizedType) {
    throw new Error('Formato no compatible. Usa imágenes PNG, JPG o WEBP.');
  }

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  const userId = sessionData?.session?.user?.id;
  if (sessionError || !userId) {
    throw new Error('Inicia sesión con tu cuenta para subir imágenes.');
  }

  const folderSegment = sanitizePathSegment(input.businessId);
  const storagePath = `${userId}/${folderSegment}/logo-${Date.now()}.${normalizedType.ext}`;

  const { error: uploadError } = await supabase.storage
    .from(BUSINESS_LOGOS_BUCKET)
    .upload(storagePath, input.bytes, {
      contentType: normalizedType.mimeType,
      cacheControl: '3600',
      upsert: true,
    });

  if (uploadError) {
    throw new Error(`No se pudo subir el logotipo al bucket: ${uploadError.message}`);
  }

  const { data: publicUrlData } = supabase.storage
    .from(BUSINESS_LOGOS_BUCKET)
    .getPublicUrl(storagePath);

  if (!publicUrlData?.publicUrl) {
    throw new Error('No se pudo obtener la URL pública del logotipo.');
  }

  const previousPath = extractBusinessLogoStoragePath(input.previousLogoUrl);
  if (previousPath && previousPath !== storagePath) {
    await deleteBusinessLogoIfManaged(input.previousLogoUrl);
  }

  return {
    publicUrl: publicUrlData.publicUrl,
    storagePath,
  };
}
