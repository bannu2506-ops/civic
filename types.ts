export enum Severity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export enum IssueType {
  POTHOLE = 'POTHOLE',
  GARBAGE_DUMP = 'GARBAGE_DUMP',
  ILLEGAL_PARKING = 'ILLEGAL_PARKING',
  STREETLIGHT_DAMAGE = 'STREETLIGHT_DAMAGE',
  BROKEN_ROAD = 'BROKEN_ROAD',
  FLOODING = 'FLOODING',
  GRAFFITI = 'GRAFFITI',
  OTHER = 'OTHER'
}

export interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
  accuracy?: number;
  googleMapsUrl?: string;
}

export interface CivicReport {
  id: string;
  timestamp: string;
  issueType: IssueType;
  severity: Severity;
  confidence: number;
  description: string;
  recommendedAction: string;
  suggestedDepartment: string;
  slaEstimate: string;
  location: LocationData;
  imageUrl: string; // Base64 or Blob URL
  hasPII: boolean; // If faces/plates detected
  status: 'PENDING' | 'REVIEWED' | 'DISPATCHED' | 'RESOLVED';
}

export interface AnalysisResult {
  issue_type: string;
  severity: string;
  confidence: number;
  description: string;
  recommended_action: string;
  suggested_department: string;
  sla_estimate: string;
  has_pii: boolean;
}