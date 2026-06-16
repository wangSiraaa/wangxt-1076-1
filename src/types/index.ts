export type RoomStatus = 'available' | 'occupied' | 'cleaning' | 'maintenance' | 'paused';

export type PatientPriority = 'normal' | 'emergency';

export type DisinfectionItem = 'surface' | 'equipment' | 'air' | 'waterline' | 'tray';

export interface Patient {
  id: string;
  name: string;
  priority: PatientPriority;
  queueNumber: number;
  estimatedDuration: number;
  arrivedAt: Date;
  roomId?: string;
  status: 'waiting' | 'in-treatment' | 'completed';
  doctorId?: string;
}

export interface DisinfectionRecord {
  id: string;
  roomId: string;
  nurseId: string;
  nurseName: string;
  items: DisinfectionItem[];
  instrumentPackageId: string;
  instrumentPackageName: string;
  needsSecondaryTreatment: boolean;
  startTime: Date;
  endTime?: Date;
  notes?: string;
  status: 'in-progress' | 'completed' | 'failed';
}

export interface InstrumentPackage {
  id: string;
  name: string;
  code: string;
  status: 'available' | 'in-use' | 'missing' | 'replaced';
  roomId?: string;
  sterilizationDate: Date;
  expirationDate: Date;
  replacedBy?: string;
  replacedAt?: Date;
}

export interface MaintenanceRecord {
  id: string;
  roomId: string;
  staffId: string;
  staffName: string;
  issue: string;
  startTime: Date;
  endTime?: Date;
  status: 'pending' | 'in-progress' | 'completed';
}

export interface DoctorRequest {
  id: string;
  doctorId: string;
  doctorName: string;
  roomId: string;
  patientId: string;
  patientName: string;
  requestedAt: Date;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
}

export interface TimelineEvent {
  id: string;
  roomId: string;
  eventType: 'patient-enter' | 'patient-exit' | 'cleaning-start' | 'cleaning-complete' | 'maintenance-start' | 'maintenance-end' | 'pause' | 'resume';
  timestamp: Date;
  description: string;
  operatorName: string;
}

export interface Room {
  id: string;
  name: string;
  status: RoomStatus;
  currentPatientId?: string;
  currentPatientName?: string;
  currentDoctorId?: string;
  currentDoctorName?: string;
  treatmentStartTime?: Date;
  estimatedEndTime?: Date;
  cleaningStartTime?: Date;
  estimatedCleaningEndTime?: Date;
  pausedReason?: string;
  pausedAt?: Date;
  currentMaintenanceId?: string;
  timeoutThreshold: number;
}

export interface PauseAlert {
  id: string;
  roomId: string;
  roomName: string;
  reason: string;
  createdAt: Date;
  resolved: boolean;
  resolvedAt?: Date;
}

export interface CleaningTimeoutAlert {
  id: string;
  roomId: string;
  roomName: string;
  cleaningStartTime: Date;
  expectedEndTime: Date;
  overdueMinutes: number;
  acknowledged: boolean;
}

export interface ClinicStore {
  rooms: Room[];
  patients: Patient[];
  disinfectionRecords: DisinfectionRecord[];
  instrumentPackages: InstrumentPackage[];
  maintenanceRecords: MaintenanceRecord[];
  doctorRequests: DoctorRequest[];
  timeline: TimelineEvent[];
  pauseAlerts: PauseAlert[];
  timeoutAlerts: CleaningTimeoutAlert[];
  currentTime: Date;
  
  setCurrentTime: (time: Date) => void;
  
  callNextPatient: (roomId: string, operatorName: string) => { success: boolean; message: string };
  insertEmergencyPatient: (patient: Patient, operatorName: string) => void;
  completePatientTreatment: (roomId: string, operatorName: string) => void;
  
  startDisinfection: (record: Omit<DisinfectionRecord, 'id' | 'startTime' | 'status'>) => void;
  completeDisinfection: (recordId: string, notes?: string) => void;
  
  replaceInstrumentPackage: (oldPackageId: string, newPackageId: string, operatorName: string) => void;
  
  startMaintenance: (record: Omit<MaintenanceRecord, 'id' | 'startTime' | 'status'>) => void;
  completeMaintenance: (recordId: string) => void;
  
  submitDoctorRequest: (request: Omit<DoctorRequest, 'id' | 'requestedAt' | 'status'>) => { success: boolean; message: string };
  processDoctorRequest: (requestId: string, approved: boolean, reason?: string) => void;
  
  pauseRoom: (roomId: string, reason: string, operatorName: string) => void;
  resumeRoom: (roomId: string, operatorName: string) => void;
  
  acknowledgeTimeoutAlert: (alertId: string) => void;
  checkCleaningTimeouts: () => void;
  
  canRoomAcceptPatient: (roomId: string) => { canAccept: boolean; reason?: string };
  getAvailableRooms: () => Room[];
  getQueuePatients: () => Patient[];
  getRoomTimeline: (roomId: string) => TimelineEvent[];
}
