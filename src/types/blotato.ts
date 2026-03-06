export interface BlotatoQueryResult {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: string;
}
