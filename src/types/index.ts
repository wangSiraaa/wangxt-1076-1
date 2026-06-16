export type RoomStatus = 'available' | 'occupied' | 'cleaning' | 'maintenance' | 'paused';

export type PatientPriority = 'normal' | 'emergency';

export type DisinfectionItem = 'surface' | 'equipment' | 'air' | 'waterline' | 'tray';

export type BatchStatus = 'pending' | 'qualified' | 'unqualified' | 'expired';

export type TimelineEventType = 'patient-enter' | 'patient-exit' | 'cleaning-start' | 'cleaning-complete' | 
                                'maintenance-start' | 'maintenance-end' | 'pause' | 'resume' |
                                'package-bound' | 'package-unbound' | 'batch-qualified' | 'batch-unqualified';

export type EmergencyRequestStatus = 'pending' | 'approved' | 'rejected' | 'completed';

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
  eventType: TimelineEventType;
  timestamp: Date;
  description: string;
  operatorName: string;
  batchId?: string;
  batchNumber?: string;
  packageId?: string;
  packageName?: string;
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

export interface SterilizationBatch {
  id: string;
  batchNumber: string;
  sterilizationDate: Date;
  expirationDate: Date;
  status: BatchStatus;
  sterilizerId: string;
  sterilizerName: string;
  operatorName: string;
  createdAt: Date;
  notes?: string;
  packageIds: string[];
  unqualifiedReason?: string;
  unqualifiedAt?: Date;
}

export interface RoomBinding {
  id: string;
  roomId: string;
  roomName: string;
  packageId: string;
  packageName: string;
  batchId: string;
  batchNumber: string;
  boundAt: Date;
  operatorName: string;
  isActive: boolean;
  unboundAt?: Date;
}

export interface BatchTraceResult {
  id: string;
  batchId: string;
  batchNumber: string;
  tracedAt: Date;
  operatorName: string;
  affectedRooms: {
    roomId: string;
    roomName: string;
    status: RoomStatus;
    currentPatientId?: string;
    currentPatientName?: string;
    bindingId: string;
  }[];
  affectedPatients: {
    patientId: string;
    patientName: string;
    roomId: string;
    roomName: string;
    status: 'in-treatment' | 'waiting';
  }[];
  resolved: boolean;
  resolvedAt?: Date;
}

export interface EmergencyInsertRequest {
  id: string;
  patientName: string;
  patientPriority: 'emergency';
  doctorId: string;
  doctorName: string;
  equipmentRequirements: string[];
  requestedAt: Date;
  status: EmergencyRequestStatus;
  matchedRoomId?: string;
  matchedRoomName?: string;
  rejectionReason?: string;
}

export interface EquipmentRequirement {
  id: string;
  name: string;
  category: string;
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
  sterilizationBatches: SterilizationBatch[];
  roomBindings: RoomBinding[];
  batchTraces: BatchTraceResult[];
  emergencyRequests: EmergencyInsertRequest[];
  equipmentRequirements: EquipmentRequirement[];
  autoPauseRooms: Record<string, string>;
  
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
  
  addSterilizationBatch: (batch: Omit<SterilizationBatch, 'id' | 'createdAt'>) => void;
  markBatchQualified: (batchId: string, operatorName: string) => void;
  markBatchUnqualified: (batchId: string, reason: string, operatorName: string) => BatchTraceResult;
  
  bindPackageToRoom: (roomId: string, packageId: string, batchId: string, operatorName: string) => { success: boolean; message: string };
  unbindPackageFromRoom: (bindingId: string, operatorName: string) => void;
  getActiveBindingsByRoom: (roomId: string) => RoomBinding[];
  
  traceBatch: (batchId: string, operatorName: string) => BatchTraceResult;
  resolveBatchTrace: (traceId: string, operatorName: string) => void;
  
  submitEmergencyRequest: (request: Omit<EmergencyInsertRequest, 'id' | 'requestedAt' | 'status'>) => { success: boolean; message: string; matchedRooms?: Room[] };
  processEmergencyRequest: (requestId: string, approved: boolean, roomId?: string, reason?: string) => void;
  
  checkRoomSterilizationStatus: (roomId: string) => { isQualified: boolean; reason?: string; batchId?: string };
  checkRoomEquipmentMatch: (roomId: string, requirements: string[]) => { isMatch: boolean; missingEquipment?: string[] };
  
  getQualifiedBatches: () => SterilizationBatch[];
  getAvailablePackagesWithBatch: () => (InstrumentPackage & { batch?: SterilizationBatch })[];
  getRoomTimelineWithBatch: (roomId: string) => TimelineEvent[];
  getAllTimeline: () => TimelineEvent[];
  
  markRoomForAutoPause: (roomId: string, reason: string) => void;
  cancelPatientRoomAssignment: (patientId: string) => void;
}
