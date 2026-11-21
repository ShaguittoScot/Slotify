const mockUpload = jest.fn();
const mockGetPublicUrl = jest.fn();
const mockRemove = jest.fn();
const mockGetSession = jest.fn();

jest.mock('@/shared/lib/supabase', () => ({
  isSupabaseConfigured: true,
  supabase: {
    auth: {
      getSession: (...args: any[]) => mockGetSession(...args),
    },
    storage: {
      from: jest.fn(() => ({
        upload: (...args: any[]) => mockUpload(...args),
        getPublicUrl: (...args: any[]) => mockGetPublicUrl(...args),
        remove: (...args: any[]) => mockRemove(...args),
      })),
    },
  },
}));

import {
  base64ToUint8Array,
  BUSINESS_LOGOS_BUCKET,
  deleteBusinessLogoIfManaged,
  extractBusinessLogoStoragePath,
  MAX_LOGO_SIZE_BYTES,
  normalizeImageMimeType,
  uploadBusinessLogo,
} from '@/shared/lib/mediaStorage';

describe('mediaStorage — Supabase Storage business-logos', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: 'user-uuid-123' } } },
      error: null,
    });
    mockUpload.mockResolvedValue({ error: null });
    mockGetPublicUrl.mockImplementation((path: string) => ({
      data: {
        publicUrl: `https://project.supabase.co/storage/v1/object/public/${BUSINESS_LOGOS_BUCKET}/${path}`,
      },
    }));
    mockRemove.mockResolvedValue({ error: null });
  });

  it('decodes base64 and data-URI strings cleanly into Uint8Array', () => {
    const plain = base64ToUint8Array('SGVsbG8=');
    expect(Array.from(plain)).toEqual([72, 101, 108, 108, 111]);

    const dataUri = base64ToUint8Array('data:image/png;base64,AQI=');
    expect(Array.from(dataUri)).toEqual([1, 2]);
  });

  it('normalizes supported image MIME types and rejects unsupported ones', () => {
    expect(normalizeImageMimeType('image/jpg', null)).toEqual({
      mimeType: 'image/jpeg',
      ext: 'jpg',
    });
    expect(normalizeImageMimeType(undefined, 'brand.WEBP')).toEqual({
      mimeType: 'image/webp',
      ext: 'webp',
    });
    expect(normalizeImageMimeType('image/svg+xml', 'vector.svg')).toBeNull();
  });

  it('extracts storage path only from managed business-logos URLs', () => {
    const managed =
      'https://abc.supabase.co/storage/v1/object/public/business-logos/user-1/biz-1/logo-100.png?t=1';
    expect(extractBusinessLogoStoragePath(managed)).toBe('user-1/biz-1/logo-100.png');
    expect(
      extractBusinessLogoStoragePath('https://cdn.example.com/logos/brand.png')
    ).toBeNull();
  });

  it('rejects files larger than 4 MB and unsupported formats before calling Supabase', async () => {
    const oversized = new Uint8Array(MAX_LOGO_SIZE_BYTES + 1);
    await expect(
      uploadBusinessLogo({ bytes: oversized, mimeType: 'image/png' })
    ).rejects.toThrow('4 MB');

    await expect(
      uploadBusinessLogo({ bytes: new Uint8Array([1, 2, 3]), mimeType: 'image/gif' })
    ).rejects.toThrow('PNG, JPG o WEBP');

    expect(mockUpload).not.toHaveBeenCalled();
  });

  it('uploads logo under userId/businessId folder, returns public URL, and removes previous managed logo', async () => {
    const previousUrl =
      'https://project.supabase.co/storage/v1/object/public/business-logos/user-uuid-123/biz-99/logo-old.png';

    const result = await uploadBusinessLogo({
      bytes: new Uint8Array([137, 80, 78, 71]),
      mimeType: 'image/png',
      businessId: 'biz-99',
      previousLogoUrl: previousUrl,
    });

    expect(mockUpload).toHaveBeenCalledTimes(1);
    const [uploadedPath, uploadedBytes, options] = mockUpload.mock.calls[0];
    expect(uploadedPath).toMatch(/^user-uuid-123\/biz-99\/logo-\d+\.png$/);
    expect(uploadedBytes).toBeInstanceOf(Uint8Array);
    expect(options).toEqual({
      contentType: 'image/png',
      cacheControl: '3600',
      upsert: true,
    });
    expect(result.storagePath).toBe(uploadedPath);
    expect(result.publicUrl).toContain(`/${BUSINESS_LOGOS_BUCKET}/${uploadedPath}`);
    expect(mockRemove).toHaveBeenCalledWith(['user-uuid-123/biz-99/logo-old.png']);
  });

  it('ignores non-Supabase URLs in deleteBusinessLogoIfManaged', async () => {
    await deleteBusinessLogoIfManaged('https://images.unsplash.com/photo-123');
    expect(mockRemove).not.toHaveBeenCalled();
  });
});
