
export enum PlanType {
  FURNITURE_REMOVE = 'FURNITURE_REMOVE',
  FURNITURE_ADD = 'FURNITURE_ADD',
  FURNITURE_BOTH = 'FURNITURE_BOTH'
}

export interface User {
  id: string;
  email: string;
  role: 'admin' | 'editor' | 'user';
  editorRecordId?: string; 
}

export interface Editor {
  id: string;
  name: string;
  email?: string;
  specialty: string;
}

export interface ReferenceImage {
  id: string;
  dataUrl: string;
  fileName: string;
  description: string;
}

export interface Submission {
  id: string;
  ownerId: string;
  plan: PlanType;
  fileName: string;
  fileSize: number;
  dataUrl: string; 
  resultDataUrl?: string; 
  instructions?: string; 
  revisionNotes?: string; // 修正依頼内容
  referenceImages?: ReferenceImage[]; 
  timestamp: number;
  status: 'pending' | 'processing' | 'reviewing' | 'completed';
  assignedEditorId?: string;
}

export const PLAN_DETAILS = {
  [PlanType.FURNITURE_REMOVE]: {
    title: 'Furniture Removal',
    description: 'Clean out existing furniture to show the room\'s full potential.',
    icon: '✨',
    price: '¥2,500'
  },
  [PlanType.FURNITURE_ADD]: {
    title: 'Furniture Addition',
    description: 'Add modern furniture to empty rooms for a cozy atmosphere.',
    icon: '🛋️',
    price: '¥3,500'
  },
  [PlanType.FURNITURE_BOTH]: {
    title: 'Full Staging (Both)',
    description: 'Remove current furniture and replace with high-end staging items.',
    icon: '🏠',
    price: '¥5,000'
  }
};

export const getEstimatedDeliveryDate = (timestamp: number): Date => {
  let date = new Date(timestamp);
  let businessDaysAdded = 0;
  let safetyCounter = 0;
  while (businessDaysAdded < 3 && safetyCounter < 15) {
    date.setDate(date.getDate() + 1);
    const day = date.getDay();
    if (day !== 0 && day !== 6) {
      businessDaysAdded++;
    }
    safetyCounter++;
  }
  return date;
};
