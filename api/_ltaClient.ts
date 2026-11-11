/**
 * LTA DataMall Serverless Client Utility
 * Handles authentication headers, caching, and upstream proxy requests.
 */

import type { Request } from 'express';

export const LTA_BASE_URL = 'https://datamall2.mytransport.sg/ltaodataservice';

/**
 * Resolves the LTA AccountKey from incoming request headers or environment variables.
 */
export function resolveAccountKey(req?: Request): string {
  // 1. Check custom client headers
  if (req) {
    const headerKey =
      (req.headers['accountkey'] as string) ||
      (req.headers['account-key'] as string) ||
      (req.headers['x-account-key'] as string);
    if (headerKey && headerKey.trim().length > 0) {
      return headerKey.trim();
    }
  }

  // 2. Check environment variables
  const envKey =
    process.env.LTA_DATAMALL_ACCOUNT_KEY ||
    process.env.LTA_ACCOUNT_KEY ||
    process.env.ACCOUNT_KEY ||
    process.env.DATAMALL_ACCOUNT_KEY;

  return envKey?.trim() || '';
}

/**
 * Executes a request to LTA DataMall with required headers
 */
export async function fetchLtaData<T = any>(
  endpointPath: string,
  accountKey: string,
  searchParams?: Record<string, string | number | undefined>
): Promise<{ ok: boolean; status: number; data: T; error?: string }> {
  const url = new URL(
    endpointPath.startsWith('http') ? endpointPath : `${LTA_BASE_URL}${endpointPath.startsWith('/') ? '' : '/'}${endpointPath}`
  );

  if (searchParams) {
    Object.entries(searchParams).forEach(([k, v]) => {
      if (v !== undefined && v !== null) {
        url.searchParams.set(k, String(v));
      }
    });
  }

  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  if (accountKey) {
    headers['AccountKey'] = accountKey;
  }

  try {
    const res = await fetch(url.toString(), {
      method: 'GET',
      headers,
    });

    const contentType = res.headers.get('content-type') || '';
    let parsedData: any;

    if (contentType.includes('application/json')) {
      parsedData = await res.json();
    } else {
      const text = await res.text();
      try {
        parsedData = JSON.parse(text);
      } catch {
        parsedData = { raw: text };
      }
    }

    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        data: parsedData,
        error: `LTA DataMall responded with HTTP ${res.status}: ${res.statusText}`,
      };
    }

    return {
      ok: true,
      status: res.status,
      data: parsedData,
    };
  } catch (err: any) {
    return {
      ok: false,
      status: 500,
      data: null as any,
      error: `Network failure fetching from LTA DataMall: ${err.message || String(err)}`,
    };
  }
}
