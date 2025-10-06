import { service } from '@/services/service';

export interface IndexStats {
  tableName: string;
  indexName: string;
  scans: number;
  tuplesRead: number;
  tuplesFetched: number;
  size: string;
}

export interface TableStats {
  tableName: string;
  seqScans: number;
  seqTuplesRead: number;
  indexScans: number;
  indexTuplesRead: number;
  size: string;
}

export interface QueryStats {
  query: string;
  calls: number;
  totalTime: number;
  meanTime: number;
  rows: number;
}

export interface DatabaseSize {
  size: string;
  tables: number;
  indexes: number;
}

export interface HealthReport {
  databaseSize: DatabaseSize;
  indexStats: IndexStats[];
  tableStats: TableStats[];
  unusedIndexes: IndexStats[];
  highSeqScanTables: TableStats[];
  slowQueries: QueryStats[];
  recommendations: string[];
  generatedAt: string;
}

// Database monitoring API calls
export const getDatabaseHealthReport = async (): Promise<HealthReport> => {
  const response = await service({
    url: '/database/health',
    method: 'GET'
  });
  return response.data.data;
};

export const getIndexStats = async (): Promise<IndexStats[]> => {
  const response = await service({
    url: '/database/indexes',
    method: 'GET'
  });
  return response.data.data;
};

export const getTableStats = async (): Promise<TableStats[]> => {
  const response = await service({
    url: '/database/tables',
    method: 'GET'
  });
  return response.data.data;
};

export const getSlowQueries = async (limit: number = 10): Promise<QueryStats[]> => {
  const response = await service({
    url: `/database/slow-queries?limit=${limit}`,
    method: 'GET'
  });
  return response.data.data;
};

export const getUnusedIndexes = async (): Promise<IndexStats[]> => {
  const response = await service({
    url: '/database/unused-indexes',
    method: 'GET'
  });
  return response.data.data;
};

export const getDatabaseSize = async (): Promise<DatabaseSize> => {
  const response = await service({
    url: '/database/size',
    method: 'GET'
  });
  return response.data.data;
};

export const analyzeQuery = async (query: string): Promise<any> => {
  const response = await service({
    url: '/database/analyze-query',
    method: 'POST',
    data: { query }
  });
  return response.data.data;
};

export const updateStatistics = async (): Promise<void> => {
  await service({
    url: '/database/update-statistics',
    method: 'POST'
  });
};
