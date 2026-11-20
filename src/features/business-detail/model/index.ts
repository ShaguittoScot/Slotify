/**
 * Business Detail Feature — Model & Hooks
 */

import { useState, useEffect, useCallback } from 'react';
import { businessDetailApi } from '../api';
import type { BusinessDetailDto } from '../types';

export const isValidHexColor = (color?: string | null): boolean => {
  if (!color || typeof color !== 'string') return false;
  return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/.test(color.trim());
};

export const formatPrice = (price: number): string => {
  if (typeof price !== 'number' || isNaN(price)) return '$0.00';
  return `$${price.toFixed(2)}`;
};

export interface UseBusinessDetailResult {
  business: BusinessDetailDto | null;
  isLoading: boolean;
  isNotFound: boolean;
  errorMessage: string | null;
  refetch: () => Promise<void>;
}

export function useBusinessDetail(slug?: string): UseBusinessDetailResult {
  const [business, setBusiness] = useState<BusinessDetailDto | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isNotFound, setIsNotFound] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchBusiness = useCallback(async () => {
    if (!slug || !slug.trim()) {
      setIsLoading(false);
      setIsNotFound(true);
      setErrorMessage('No se especificó un negocio válido.');
      return;
    }

    try {
      setIsLoading(true);
      setIsNotFound(false);
      setErrorMessage(null);

      const data = await businessDetailApi.getBusinessBySlug(slug.trim());
      setBusiness(data);
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 404) {
        setIsNotFound(true);
        setErrorMessage(
          err?.response?.data?.message ||
            'El negocio que buscas no existe o no se encuentra disponible públicamente.'
        );
      } else {
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          'No fue posible cargar la información del negocio. Revisa tu conexión a internet.';
        setErrorMessage(msg);
      }
    } finally {
      setIsLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchBusiness();
  }, [fetchBusiness]);

  return {
    business,
    isLoading,
    isNotFound,
    errorMessage,
    refetch: fetchBusiness,
  };
}
