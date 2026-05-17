export type Analysis = {
  id: string;
  file_name: string;
  status: string;
  result_label: string | null;
  confidence: number | null;
  model_type: string;
  model_name: string;
  created_at: string;
};

export type AnalysisListResponse = {
  items: Analysis[];
  total: number;
  total_pages: number;
};

export type AnalysisDetail = {
  id: string;
  file_name: string;
  storage_key: string;
  result_label: string | null;
  confidence: number | null;
  inference_time_ms: number | null;
  text_preview?: string;
  logs: AnalysisLog[];
};

export type AnalysisLog = {
  id: number;
  event_type: string;
  message: string | null;
  created_at: string;
};

