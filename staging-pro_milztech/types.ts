
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
  ownerEmail?: string; // 追加
  plan: PlanType;
  fileName: string;
  fileSize: number;
  dataUrl: string; 
  resultDataUrl?: string; 
  instructions?: string; 
  revisionNotes?: string; 
  referenceImages?: ReferenceImage[]; 
  timestamp: number;
  status: 'pending' | 'processing' | 'reviewing' | 'completed';
  assignedEditorId?: string;
}

export const PLAN_DETAILS = {
  [PlanType.FURNITURE_REMOVE]: {
    title: 'Furniture Removal',
    description: 'Advanced removal of existing assets. We clean the digital canvas to reveal the structural potential of your space.',
    price: '$35',
    number: '01'
  },
  [PlanType.FURNITURE_ADD]: {
    title: 'Furniture Addition',
    description: 'Precision staging for vacant rooms. Curated sets selected by architectural visualizers to maximize market value.',
    price: '$35',
    number: '02'
  },
  [PlanType.FURNITURE_BOTH]: {
    title: 'Full Staging (Both)',
    description: 'Complete spatial overhaul. Existing items are removed and replaced with elite, high-resolution digital staging.',
    price: '$60',
    number: '03'
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
