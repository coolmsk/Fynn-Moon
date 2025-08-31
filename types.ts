export enum AppStep {
  UPLOAD = 'UPLOAD',
  PROCESSING = 'PROCESSING',
  REPORT = 'REPORT',
}

export interface ReportData {
  extractedText: string;
  generatedReport: string;
}

export enum InputMode {
  UPLOAD = 'UPLOAD',
  TEXT = 'TEXT',
}
