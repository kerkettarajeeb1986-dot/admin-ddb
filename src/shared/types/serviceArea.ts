export type LocalAreaStatus = 'active' | 'inactive' | 'archived';

export interface LocalArea {
  id: string;
  name: string;
  pinCodes: string[];
  district: string;
  state: string;
  deliveryAvailable: boolean;
  status: LocalAreaStatus;
  createdAt?: any;
  updatedAt?: any;
  createdBy?: string;
  notes?: string;
}

export interface LocalAreaFormData {
  name: string;
  pinCodes: string; // comma separated in form
  district: string;
  state: string;
  deliveryAvailable: boolean;
  status: LocalAreaStatus;
  notes?: string;
}

export interface ServiceabilityCheckResult {
  isServiceable: boolean;
  area?: LocalArea;
  message: string;
  distanceKm?: number;
}
