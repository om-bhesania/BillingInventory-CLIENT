import { service } from '@/services/service';

export interface CacheStats {
  hits: number;
  misses: number;
  keys: number;
  memory: string;
  connected: boolean;
}

export interface CacheKey {
  key: string;
  value: any;
  exists: boolean;
}

export interface CacheKeysResponse {
  keys: string[];
  count: number;
}

// Cache management API calls
export const getCacheStats = async (): Promise<CacheStats> => {
  const response:any = await service({
    url: '/cache/stats',
    method: 'GET'
  });
  return response.data.data;
};

export const testCacheConnection = async (): Promise<{ connected: boolean; timestamp: string }> => {
  const response:any = await service({
    url: '/cache/test',
    method: 'GET'
  });
  return response.data.data;
};

export const warmCache = async (): Promise<void> => {
  await service({
    url: '/cache/warm',
    method: 'POST'
  });
};

export const clearAllCache = async (): Promise<void> => {
  await service({
    url: '/cache/clear',
    method: 'POST'
  });
};

export const clearCacheByPattern = async (pattern: string): Promise<{ deletedCount: number }> => {
  const response:any = await service({
    url: '/cache/clear-pattern',
    method: 'POST',
    data: { pattern }
  });
  return response.data;
};

export const clearUserCache = async (userId: string): Promise<{ deletedCount: number }> => {
  const response:any = await service({
    url: `/cache/user/${userId}`,
    method: 'DELETE'
  });
  return response.data;
};

export const clearShopCache = async (shopId: string): Promise<{ deletedCount: number }> => {
  const response:any = await service({
    url: `/cache/shop/${shopId}`,
    method: 'DELETE'
  });
  return response.data;
};

export const getCacheKeys = async (pattern: string = '*'): Promise<CacheKeysResponse> => {
  const response:any = await service({
    url: `/cache/keys?pattern=${encodeURIComponent(pattern)}`,
    method: 'GET'
  });
  return response.data.data;
};

export const getCacheValue = async (key: string): Promise<CacheKey> => {
  const response:any = await service({
    url: `/cache/value/${encodeURIComponent(key)}`,
    method: 'GET'
  });
  return response.data.data;
};

export const setCacheValue = async (key: string, value: any, ttl?: number): Promise<void> => {
  await service({
    url: '/cache/value',
    method: 'POST',
    data: { key, value, ttl }
  });
};

export const deleteCacheValue = async (key: string): Promise<void> => {
  await service({
    url: `/cache/value/${encodeURIComponent(key)}`,
    method: 'DELETE'
  });
};
