export enum AppStatus {
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export interface CleanerResponse {
  cleanedHtml: string;
}

export interface IconProps {
  className?: string;
}