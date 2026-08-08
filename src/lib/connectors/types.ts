export interface ConnectorConfig {
  type: string;
  [key: string]: unknown;
}

export interface ConnectorResult {
  columns: string[];
  rows: Record<string, unknown>[];
  metadata?: Record<string, unknown>;
}

export interface Connector {
  connect(config: ConnectorConfig): Promise<void>;
  testConnection(): Promise<boolean>;
  fetchData(): Promise<ConnectorResult>;
  normalize(rows: Record<string, unknown>[], mapping: Record<string, string>): Record<string, unknown>[];
  disconnect(): Promise<void>;
}

export interface ValidationError {
  row: number;
  field?: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}
