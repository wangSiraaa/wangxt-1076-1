import { create } from 'zustand';
import type {
  ClinicStore,
  Room,
  Patient,
  DisinfectionRecord,
  InstrumentPackage,
  MaintenanceRecord,
  DoctorRequest,
  TimelineEvent,
  PauseAlert,
  CleaningTimeoutAlert,
  SterilizationBatch,
  RoomBinding,
  BatchTraceResult,
  EmergencyInsertRequest,
  EquipmentRequirement,
  TimelineEventType,
} from '@/types';

const generateId = () => Math.random().toString(36).substring(2, 9);

const now = new Date();
const addMinutes = (date: Date, minutes: number) => new Date(date.getTime() + minutes * 60000);
const subtractMinutes = (date: Date, minutes: number) => new Date(date.getTime() - minutes * 60000);

const initialRooms: Room[] = [
  {
    id: 'room-1',
    name: '诊室1',
    status: 'occupied',
    currentPatientId: 'patient-1',
    currentPatientName: '张三',
    currentDoctorId: 'doctor-1',
    currentDoctorName: '王医生',
    treatmentStartTime: subtractMinutes(now, 25),
    estimatedEndTime: addMinutes(now, 15),
    timeoutThreshold: 15,
  },
  {
    id: 'room-2',
    name: '诊室2',
    status: 'cleaning',
    cleaningStartTime: subtractMinutes(now, 8),
    estimatedCleaningEndTime: addMinutes(now, 7),
    timeoutThreshold: 15,
  },
  {
    id: 'room-3',
    name: '诊室3',
    status: 'available',
    timeoutThreshold: 15,
  },
  {
    id: 'room-4',
    name: '诊室4',
    status: 'maintenance',
    currentMaintenanceId: 'maintenance-1',
    timeoutThreshold: 15,
  },
  {
    id: 'room-5',
    name: '诊室5',
    status: 'paused',
    pausedReason: '器械包缺失',
    pausedAt: subtractMinutes(now, 10),
    timeoutThreshold: 15,
  },
];

const initialPatients: Patient[] = [
  {
    id: 'patient-1',
    name: '张三',
    priority: 'normal',
    queueNumber: 1,
    estimatedDuration: 40,
    arrivedAt: subtractMinutes(now, 30),
    roomId: 'room-1',
    status: 'in-treatment',
    doctorId: 'doctor-1',
  },
  {
    id: 'patient-2',
    name: '李四',
    priority: 'normal',
    queueNumber: 2,
    estimatedDuration: 30,
    arrivedAt: subtractMinutes(now, 20),
    status: 'waiting',
  },
  {
    id: 'patient-3',
    name: '王五',
    priority: 'normal',
    queueNumber: 3,
    estimatedDuration: 45,
    arrivedAt: subtractMinutes(now, 15),
    status: 'waiting',
  },
  {
    id: 'patient-4',
    name: '赵六',
    priority: 'normal',
    queueNumber: 4,
    estimatedDuration: 25,
    arrivedAt: subtractMinutes(now, 10),
    status: 'waiting',
  },
];

const initialDisinfectionRecords: DisinfectionRecord[] = [
  {
    id: 'disinfection-1',
    roomId: 'room-2',
    nurseId: 'nurse-1',
    nurseName: '李护士',
    items: ['surface', 'equipment'],
    instrumentPackageId: 'package-2',
    instrumentPackageName: '基础治疗包B',
    needsSecondaryTreatment: false,
    startTime: subtractMinutes(now, 8),
    status: 'in-progress',
  },
];

const initialInstrumentPackages: InstrumentPackage[] = [
  {
    id: 'package-1',
    name: '基础治疗包A',
    code: 'PKG-001',
    status: 'in-use',
    roomId: 'room-1',
    sterilizationDate: subtractMinutes(now, 120),
    expirationDate: addMinutes(now, 1440),
  },
  {
    id: 'package-2',
    name: '基础治疗包B',
    code: 'PKG-002',
    status: 'in-use',
    roomId: 'room-2',
    sterilizationDate: subtractMinutes(now, 180),
    expirationDate: addMinutes(now, 1440),
  },
  {
    id: 'package-3',
    name: '基础治疗包C',
    code: 'PKG-003',
    status: 'available',
    sterilizationDate: subtractMinutes(now, 60),
    expirationDate: addMinutes(now, 1440),
  },
  {
    id: 'package-4',
    name: '外科手术包',
    code: 'PKG-004',
    status: 'available',
    sterilizationDate: subtractMinutes(now, 240),
    expirationDate: addMinutes(now, 1440),
  },
  {
    id: 'package-5',
    name: '基础治疗包D',
    code: 'PKG-005',
    status: 'missing',
    roomId: 'room-5',
    sterilizationDate: subtractMinutes(now, 300),
    expirationDate: addMinutes(now, 1440),
  },
];

const initialMaintenanceRecords: MaintenanceRecord[] = [
  {
    id: 'maintenance-1',
    roomId: 'room-4',
    staffId: 'maintenance-1',
    staffName: '张师傅',
    issue: '治疗台升降故障',
    startTime: subtractMinutes(now, 45),
    status: 'in-progress',
  },
];

const initialTimeline: TimelineEvent[] = [
  {
    id: 'tl-1',
    roomId: 'room-1',
    eventType: 'patient-enter',
    timestamp: subtractMinutes(now, 25),
    description: '患者张三进入诊室',
    operatorName: '前台小王',
    batchId: 'batch-001',
    batchNumber: 'DIS-2024-001',
    packageId: 'package-1',
    packageName: '基础治疗包A',
  },
  {
    id: 'tl-2',
    roomId: 'room-2',
    eventType: 'patient-exit',
    timestamp: subtractMinutes(now, 10),
    description: '患者治疗结束离开',
    operatorName: '王医生',
  },
  {
    id: 'tl-3',
    roomId: 'room-2',
    eventType: 'cleaning-start',
    timestamp: subtractMinutes(now, 8),
    description: '李护士开始消毒清洁',
    operatorName: '李护士',
  },
  {
    id: 'tl-4',
    roomId: 'room-4',
    eventType: 'maintenance-start',
    timestamp: subtractMinutes(now, 45),
    description: '治疗台升降故障报修',
    operatorName: '王医生',
  },
  {
    id: 'tl-5',
    roomId: 'room-5',
    eventType: 'pause',
    timestamp: subtractMinutes(now, 10),
    description: '器械包缺失，暂停使用',
    operatorName: '李护士',
  },
  {
    id: 'tl-6',
    roomId: 'room-1',
    eventType: 'package-bound',
    timestamp: subtractMinutes(now, 30),
    description: '绑定器械包 基础治疗包A，消毒批次 DIS-2024-001',
    operatorName: '李护士',
    batchId: 'batch-001',
    batchNumber: 'DIS-2024-001',
    packageId: 'package-1',
    packageName: '基础治疗包A',
  },
  {
    id: 'tl-7',
    roomId: 'room-3',
    eventType: 'package-bound',
    timestamp: subtractMinutes(now, 40),
    description: '绑定器械包 基础治疗包C，消毒批次 DIS-2024-002',
    operatorName: '李护士',
    batchId: 'batch-002',
    batchNumber: 'DIS-2024-002',
    packageId: 'package-3',
    packageName: '基础治疗包C',
  },
];

const initialPauseAlerts: PauseAlert[] = [
  {
    id: 'pause-1',
    roomId: 'room-5',
    roomName: '诊室5',
    reason: '器械包缺失',
    createdAt: subtractMinutes(now, 10),
    resolved: false,
  },
];

const initialSterilizationBatches: SterilizationBatch[] = [
  {
    id: 'batch-001',
    batchNumber: 'DIS-2024-001',
    sterilizationDate: subtractMinutes(now, 120),
    expirationDate: addMinutes(now, 1440),
    status: 'qualified',
    sterilizerId: 'ster-001',
    sterilizerName: '高压灭菌器A',
    operatorName: '张护士长',
    createdAt: subtractMinutes(now, 120),
    packageIds: ['package-1'],
  },
  {
    id: 'batch-002',
    batchNumber: 'DIS-2024-002',
    sterilizationDate: subtractMinutes(now, 60),
    expirationDate: addMinutes(now, 1440),
    status: 'qualified',
    sterilizerId: 'ster-001',
    sterilizerName: '高压灭菌器A',
    operatorName: '张护士长',
    createdAt: subtractMinutes(now, 60),
    packageIds: ['package-3'],
  },
  {
    id: 'batch-003',
    batchNumber: 'DIS-2024-003',
    sterilizationDate: subtractMinutes(now, 180),
    expirationDate: addMinutes(now, 1440),
    status: 'qualified',
    sterilizerId: 'ster-002',
    sterilizerName: '高压灭菌器B',
    operatorName: '张护士长',
    createdAt: subtractMinutes(now, 180),
    packageIds: ['package-2'],
  },
  {
    id: 'batch-004',
    batchNumber: 'DIS-2024-004',
    sterilizationDate: subtractMinutes(now, 240),
    expirationDate: addMinutes(now, 1440),
    status: 'pending',
    sterilizerId: 'ster-002',
    sterilizerName: '高压灭菌器B',
    operatorName: '张护士长',
    createdAt: subtractMinutes(now, 240),
    packageIds: ['package-4'],
  },
  {
    id: 'batch-005',
    batchNumber: 'DIS-2024-005',
    sterilizationDate: subtractMinutes(now, 300),
    expirationDate: addMinutes(now, 1440),
    status: 'qualified',
    sterilizerId: 'ster-001',
    sterilizerName: '高压灭菌器A',
    operatorName: '张护士长',
    createdAt: subtractMinutes(now, 300),
    packageIds: ['package-5'],
  },
];

const initialRoomBindings: RoomBinding[] = [
  {
    id: 'binding-1',
    roomId: 'room-1',
    roomName: '诊室1',
    packageId: 'package-1',
    packageName: '基础治疗包A',
    batchId: 'batch-001',
    batchNumber: 'DIS-2024-001',
    boundAt: subtractMinutes(now, 30),
    operatorName: '李护士',
    isActive: true,
  },
  {
    id: 'binding-2',
    roomId: 'room-3',
    roomName: '诊室3',
    packageId: 'package-3',
    packageName: '基础治疗包C',
    batchId: 'batch-002',
    batchNumber: 'DIS-2024-002',
    boundAt: subtractMinutes(now, 40),
    operatorName: '李护士',
    isActive: true,
  },
  {
    id: 'binding-3',
    roomId: 'room-5',
    roomName: '诊室5',
    packageId: 'package-5',
    packageName: '基础治疗包D',
    batchId: 'batch-005',
    batchNumber: 'DIS-2024-005',
    boundAt: subtractMinutes(now, 60),
    operatorName: '李护士',
    isActive: true,
  },
];

const initialEquipmentRequirements: EquipmentRequirement[] = [
  { id: 'equip-1', name: '综合治疗台', category: '基础设备' },
  { id: 'equip-2', name: '牙科手机', category: '基础设备' },
  { id: 'equip-3', name: '超声洁牙机', category: '清洁设备' },
  { id: 'equip-4', name: '光固化机', category: '修复设备' },
  { id: 'equip-5', name: '口腔内窥镜', category: '检查设备' },
  { id: 'equip-6', name: '拔牙器械套装', category: '外科设备' },
  { id: 'equip-7', name: '根管测量仪', category: '根管治疗' },
  { id: 'equip-8', name: '种植机', category: '种植设备' },
];

const roomEquipmentMap: Record<string, string[]> = {
  'room-1': ['equip-1', 'equip-2', 'equip-3', 'equip-4', 'equip-5'],
  'room-2': ['equip-1', 'equip-2', 'equip-3', 'equip-4', 'equip-5', 'equip-6'],
  'room-3': ['equip-1', 'equip-2', 'equip-3', 'equip-4', 'equip-5', 'equip-7'],
  'room-4': ['equip-1', 'equip-2', 'equip-3', 'equip-4'],
  'room-5': ['equip-1', 'equip-2', 'equip-3', 'equip-4', 'equip-5', 'equip-8'],
};

export const useClinicStore = create<ClinicStore>((set, get) => ({
  rooms: initialRooms,
  patients: initialPatients,
  disinfectionRecords: initialDisinfectionRecords,
  instrumentPackages: initialInstrumentPackages,
  maintenanceRecords: initialMaintenanceRecords,
  doctorRequests: [],
  timeline: initialTimeline,
  pauseAlerts: initialPauseAlerts,
  timeoutAlerts: [],
  currentTime: now,
  sterilizationBatches: initialSterilizationBatches,
  roomBindings: initialRoomBindings,
  batchTraces: [],
  emergencyRequests: [],
  equipmentRequirements: initialEquipmentRequirements,
  autoPauseRooms: {},

  setCurrentTime: (time: Date) => set({ currentTime: time }),

  markRoomForAutoPause: (roomId: string, reason: string) => {
    set(state => ({
      autoPauseRooms: { ...state.autoPauseRooms, [roomId]: reason },
    }));
  },

  cancelPatientRoomAssignment: (patientId: string) => {
    set(state => ({
      patients: state.patients.map(p =>
        p.id === patientId ? { ...p, roomId: undefined } : p
      ),
    }));
  },

  checkRoomSterilizationStatus: (roomId: string) => {
    const { roomBindings, sterilizationBatches } = get();
    const activeBinding = roomBindings.find(b => b.roomId === roomId && b.isActive);
    
    if (!activeBinding) {
      return { isQualified: false, reason: '诊室未绑定消毒批次' };
    }

    const batch = sterilizationBatches.find(b => b.id === activeBinding.batchId);
    if (!batch) {
      return { isQualified: false, reason: '消毒批次不存在', batchId: activeBinding.batchId };
    }

    if (batch.status === 'unqualified') {
      return { isQualified: false, reason: `消毒批次 ${batch.batchNumber} 不合格`, batchId: batch.id };
    }

    if (batch.status === 'pending') {
      return { isQualified: false, reason: `消毒批次 ${batch.batchNumber} 待检测`, batchId: batch.id };
    }

    if (batch.status === 'expired' || new Date() > batch.expirationDate) {
      return { isQualified: false, reason: `消毒批次 ${batch.batchNumber} 已过期`, batchId: batch.id };
    }

    return { isQualified: true, batchId: batch.id };
  },

  checkRoomEquipmentMatch: (roomId: string, requirements: string[]) => {
    const roomEquipIds = roomEquipmentMap[roomId] || [];
    const missingEquipment: string[] = [];

    requirements.forEach(reqId => {
      if (!roomEquipIds.includes(reqId)) {
        const { equipmentRequirements } = get();
        const equip = equipmentRequirements.find(e => e.id === reqId);
        missingEquipment.push(equip?.name || reqId);
      }
    });

    if (missingEquipment.length > 0) {
      return { isMatch: false, missingEquipment };
    }

    return { isMatch: true };
  },

  canRoomAcceptPatient: (roomId: string) => {
    const { rooms, disinfectionRecords, instrumentPackages, maintenanceRecords } = get();
    const room = rooms.find(r => r.id === roomId);

    if (!room) return { canAccept: false, reason: '诊室不存在' };
    if (room.status === 'occupied') return { canAccept: false, reason: '诊室正在使用中' };
    if (room.status === 'cleaning') return { canAccept: false, reason: '诊室正在清洁消毒中' };
    if (room.status === 'maintenance') return { canAccept: false, reason: '诊室正在维护中' };
    if (room.status === 'paused') return { canAccept: false, reason: '诊室已暂停使用' };

    const lastDisinfection = disinfectionRecords
      .filter(d => d.roomId === roomId)
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())[0];

    if (!lastDisinfection || lastDisinfection.status !== 'completed') {
      return { canAccept: false, reason: '消毒未完成，不能进入下一位患者' };
    }

    const sterilizationCheck = get().checkRoomSterilizationStatus(roomId);
    if (!sterilizationCheck.isQualified) {
      return { canAccept: false, reason: sterilizationCheck.reason };
    }

    const roomPackages = instrumentPackages.filter(p => p.roomId === roomId);
    const hasMissingPackage = roomPackages.some(p => p.status === 'missing');
    if (hasMissingPackage) {
      return { canAccept: false, reason: '存在缺失的器械包' };
    }

    const activeMaintenance = maintenanceRecords.find(
      m => m.roomId === roomId && m.status !== 'completed'
    );
    if (activeMaintenance) {
      return { canAccept: false, reason: '存在未完成的维护任务' };
    }

    return { canAccept: true };
  },

  getAvailableRooms: () => {
    const { rooms, canRoomAcceptPatient } = get();
    return rooms.filter(r => canRoomAcceptPatient(r.id).canAccept);
  },

  getQueuePatients: () => {
    const { patients } = get();
    return patients
      .filter(p => p.status === 'waiting')
      .sort((a, b) => {
        if (a.priority !== b.priority) {
          return a.priority === 'emergency' ? -1 : 1;
        }
        return a.queueNumber - b.queueNumber;
      });
  },

  getRoomTimeline: (roomId: string) => {
    const { timeline } = get();
    return timeline
      .filter(t => t.roomId === roomId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  },

  getRoomTimelineWithBatch: (roomId: string) => {
    return get().getRoomTimeline(roomId);
  },

  getAllTimeline: () => {
    const { timeline } = get();
    return [...timeline].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  },

  getQualifiedBatches: () => {
    const { sterilizationBatches, currentTime } = get();
    return sterilizationBatches.filter(b => 
      b.status === 'qualified' && b.expirationDate > currentTime
    );
  },

  getAvailablePackagesWithBatch: () => {
    const { instrumentPackages, sterilizationBatches } = get();
    return instrumentPackages
      .filter(p => p.status === 'available')
      .map(p => {
        const batch = sterilizationBatches.find(b => b.packageIds.includes(p.id));
        return { ...p, batch };
      });
  },

  callNextPatient: (roomId: string, operatorName: string) => {
    const state = get();
    const checkResult = state.canRoomAcceptPatient(roomId);

    if (!checkResult.canAccept) {
      return { success: false, message: checkResult.reason || '诊室不可用' };
    }

    const queuePatients = state.getQueuePatients();
    if (queuePatients.length === 0) {
      return { success: false, message: '没有等待中的患者' };
    }

    const nextPatient = queuePatients[0];
    const room = state.rooms.find(r => r.id === roomId)!;
    const now = state.currentTime;

    set({
      rooms: state.rooms.map(r =>
        r.id === roomId
          ? {
              ...r,
              status: 'occupied',
              currentPatientId: nextPatient.id,
              currentPatientName: nextPatient.name,
              currentDoctorId: 'doctor-1',
              currentDoctorName: '王医生',
              treatmentStartTime: now,
              estimatedEndTime: addMinutes(now, nextPatient.estimatedDuration),
            }
          : r
      ),
      patients: state.patients.map(p =>
        p.id === nextPatient.id
          ? { ...p, status: 'in-treatment', roomId, doctorId: 'doctor-1' }
          : p
      ),
      timeline: [
        ...state.timeline,
        {
          id: generateId(),
          roomId,
          eventType: 'patient-enter' as TimelineEventType,
          timestamp: now,
          description: `患者${nextPatient.name}进入诊室`,
          operatorName,
        },
      ],
    });

    return { success: true, message: `已叫号：${nextPatient.name}` };
  },

  insertEmergencyPatient: (patient: Patient, operatorName: string) => {
    const state = get();
    const emergencyPatient: Patient = {
      ...patient,
      priority: 'emergency',
      status: 'waiting',
      queueNumber: 0,
      arrivedAt: state.currentTime,
    };

    set({
      patients: [emergencyPatient, ...state.patients],
      timeline: [
        ...state.timeline,
        {
          id: generateId(),
          roomId: '',
          eventType: 'patient-enter' as TimelineEventType,
          timestamp: state.currentTime,
          description: `急诊患者${patient.name}插入队列`,
          operatorName,
        },
      ],
    });
  },

  completePatientTreatment: (roomId: string, operatorName: string) => {
    const state = get();
    const room = state.rooms.find(r => r.id === roomId);
    if (!room || room.status !== 'occupied') return;

    const now = state.currentTime;
    const autoPauseReason = state.autoPauseRooms[roomId];

    if (autoPauseReason) {
      set({
        rooms: state.rooms.map(r =>
          r.id === roomId
            ? {
                ...r,
                status: 'paused' as const,
                currentPatientId: undefined,
                currentPatientName: undefined,
                currentDoctorId: undefined,
                currentDoctorName: undefined,
                treatmentStartTime: undefined,
                estimatedEndTime: undefined,
                pausedReason: autoPauseReason,
                pausedAt: now,
              }
            : r
        ),
        patients: state.patients.map(p =>
          p.id === room.currentPatientId ? { ...p, status: 'completed', roomId: undefined } : p
        ),
        autoPauseRooms: Object.fromEntries(
          Object.entries(state.autoPauseRooms).filter(([id]) => id !== roomId)
        ),
        pauseAlerts: [
          ...state.pauseAlerts,
          {
            id: generateId(),
            roomId,
            roomName: room.name,
            reason: autoPauseReason,
            createdAt: now,
            resolved: false,
          },
        ],
        timeline: [
          ...state.timeline,
          {
            id: generateId(),
            roomId,
            eventType: 'patient-exit' as TimelineEventType,
            timestamp: now,
            description: `患者治疗结束离开`,
            operatorName,
          },
          {
            id: generateId(),
            roomId,
            eventType: 'pause' as TimelineEventType,
            timestamp: now,
            description: `自动暂停：${autoPauseReason}`,
            operatorName: '系统',
          },
        ],
      });
      return;
    }

    set({
      rooms: state.rooms.map(r =>
        r.id === roomId
          ? {
              ...r,
              status: 'cleaning',
              currentPatientId: undefined,
              currentPatientName: undefined,
              currentDoctorId: undefined,
              currentDoctorName: undefined,
              treatmentStartTime: undefined,
              estimatedEndTime: undefined,
              cleaningStartTime: now,
              estimatedCleaningEndTime: addMinutes(now, r.timeoutThreshold),
            }
          : r
      ),
      patients: state.patients.map(p =>
        p.id === room.currentPatientId ? { ...p, status: 'completed', roomId: undefined } : p
      ),
      timeline: [
        ...state.timeline,
        {
          id: generateId(),
          roomId,
          eventType: 'patient-exit' as TimelineEventType,
          timestamp: now,
          description: `患者治疗结束离开`,
          operatorName,
        },
      ],
    });
  },

  startDisinfection: (record: Omit<DisinfectionRecord, 'id' | 'startTime' | 'status'>) => {
    const state = get();
    const now = state.currentTime;

    const newRecord: DisinfectionRecord = {
      ...record,
      id: generateId(),
      startTime: now,
      status: 'in-progress',
    };

    set({
      disinfectionRecords: [...state.disinfectionRecords, newRecord],
      rooms: state.rooms.map(r =>
        r.id === record.roomId
          ? {
              ...r,
              status: 'cleaning',
              cleaningStartTime: now,
              estimatedCleaningEndTime: addMinutes(now, r.timeoutThreshold),
            }
          : r
      ),
      instrumentPackages: state.instrumentPackages.map(p =>
        p.id === record.instrumentPackageId
          ? { ...p, status: 'in-use', roomId: record.roomId }
          : p
      ),
      timeline: [
        ...state.timeline,
        {
          id: generateId(),
          roomId: record.roomId,
          eventType: 'cleaning-start' as TimelineEventType,
          timestamp: now,
          description: `${record.nurseName}开始消毒清洁`,
          operatorName: record.nurseName,
        },
      ],
    });
  },

  completeDisinfection: (recordId: string, notes?: string) => {
    const state = get();
    const record = state.disinfectionRecords.find(r => r.id === recordId);
    if (!record) return;

    const now = state.currentTime;

    set({
      disinfectionRecords: state.disinfectionRecords.map(r =>
        r.id === recordId
          ? { ...r, status: 'completed', endTime: now, notes }
          : r
      ),
      rooms: state.rooms.map(r =>
        r.id === record.roomId && record.needsSecondaryTreatment
          ? { ...r, status: 'available' }
          : r.id === record.roomId
          ? { ...r, status: 'available', cleaningStartTime: undefined, estimatedCleaningEndTime: undefined }
          : r
      ),
      timeline: [
        ...state.timeline,
        {
          id: generateId(),
          roomId: record.roomId,
          eventType: 'cleaning-complete' as TimelineEventType,
          timestamp: now,
          description: `消毒清洁完成${record.needsSecondaryTreatment ? '（需二次处理）' : ''}`,
          operatorName: record.nurseName,
        },
      ],
    });
  },

  replaceInstrumentPackage: (oldPackageId: string, newPackageId: string, operatorName: string) => {
    const state = get();
    const oldPackage = state.instrumentPackages.find(p => p.id === oldPackageId);
    const newPackage = state.instrumentPackages.find(p => p.id === newPackageId);

    if (!oldPackage || !newPackage) return;

    const now = state.currentTime;

    set({
      instrumentPackages: state.instrumentPackages.map(p => {
        if (p.id === oldPackageId) {
          return { ...p, status: 'replaced', replacedBy: newPackageId, replacedAt: now };
        }
        if (p.id === newPackageId) {
          return { ...p, status: 'in-use', roomId: oldPackage.roomId };
        }
        return p;
      }),
      pauseAlerts: state.pauseAlerts.map(alert =>
        alert.roomId === oldPackage.roomId && alert.reason === '器械包缺失' && !alert.resolved
          ? { ...alert, resolved: true, resolvedAt: now }
          : alert
      ),
      rooms: state.rooms.map(r =>
        r.id === oldPackage.roomId && r.status === 'paused' && r.pausedReason === '器械包缺失'
          ? { ...r, status: 'available', pausedReason: undefined, pausedAt: undefined }
          : r
      ),
      timeline: [
        ...state.timeline,
        {
          id: generateId(),
          roomId: oldPackage.roomId || '',
          eventType: 'resume' as TimelineEventType,
          timestamp: now,
          description: `器械包替换：${oldPackage.name} → ${newPackage.name}`,
          operatorName,
        },
      ],
    });
  },

  startMaintenance: (record: Omit<MaintenanceRecord, 'id' | 'startTime' | 'status'>) => {
    const state = get();
    const now = state.currentTime;

    const newRecord: MaintenanceRecord = {
      ...record,
      id: generateId(),
      startTime: now,
      status: 'in-progress',
    };

    set({
      maintenanceRecords: [...state.maintenanceRecords, newRecord],
      rooms: state.rooms.map(r =>
        r.id === record.roomId
          ? { ...r, status: 'maintenance', currentMaintenanceId: newRecord.id }
          : r
      ),
      timeline: [
        ...state.timeline,
        {
          id: generateId(),
          roomId: record.roomId,
          eventType: 'maintenance-start' as TimelineEventType,
          timestamp: now,
          description: `开始维护：${record.issue}`,
          operatorName: record.staffName,
        },
      ],
    });
  },

  completeMaintenance: (recordId: string) => {
    const state = get();
    const record = state.maintenanceRecords.find(r => r.id === recordId);
    if (!record) return;

    const now = state.currentTime;

    set({
      maintenanceRecords: state.maintenanceRecords.map(r =>
        r.id === recordId ? { ...r, status: 'completed', endTime: now } : r
      ),
      rooms: state.rooms.map(r =>
        r.id === record.roomId
          ? { ...r, status: 'available', currentMaintenanceId: undefined }
          : r
      ),
      timeline: [
        ...state.timeline,
        {
          id: generateId(),
          roomId: record.roomId,
          eventType: 'maintenance-end' as TimelineEventType,
          timestamp: now,
          description: '维护完成',
          operatorName: record.staffName,
        },
      ],
    });
  },

  submitDoctorRequest: (request: Omit<DoctorRequest, 'id' | 'requestedAt' | 'status'>) => {
    const state = get();
    const checkResult = state.canRoomAcceptPatient(request.roomId);

    const newRequest: DoctorRequest = {
      ...request,
      id: generateId(),
      requestedAt: state.currentTime,
      status: 'pending',
    };

    set({
      doctorRequests: [...state.doctorRequests, newRequest],
    });

    if (!checkResult.canAccept) {
      return { success: false, message: checkResult.reason || '诊室不可用' };
    }

    return { success: true, message: '申请已提交，等待审核' };
  },

  processDoctorRequest: (requestId: string, approved: boolean, reason?: string) => {
    const state = get();
    const request = state.doctorRequests.find(r => r.id === requestId);
    if (!request) return;

    if (approved) {
      state.callNextPatient(request.roomId, request.doctorName);
      set({
        doctorRequests: state.doctorRequests.map(r =>
          r.id === requestId ? { ...r, status: 'approved' } : r
        ),
      });
    } else {
      set({
        doctorRequests: state.doctorRequests.map(r =>
          r.id === requestId ? { ...r, status: 'rejected', rejectionReason: reason } : r
        ),
      });
    }
  },

  pauseRoom: (roomId: string, reason: string, operatorName: string) => {
    const state = get();
    const now = state.currentTime;

    set({
      rooms: state.rooms.map(r =>
        r.id === roomId ? { ...r, status: 'paused', pausedReason: reason, pausedAt: now } : r
      ),
      pauseAlerts: [
        ...state.pauseAlerts,
        {
          id: generateId(),
          roomId,
          roomName: state.rooms.find(r => r.id === roomId)?.name || '',
          reason,
          createdAt: now,
          resolved: false,
        },
      ],
      timeline: [
        ...state.timeline,
        {
          id: generateId(),
          roomId,
          eventType: 'pause' as TimelineEventType,
          timestamp: now,
          description: `暂停使用：${reason}`,
          operatorName,
        },
      ],
    });
  },

  resumeRoom: (roomId: string, operatorName: string) => {
    const state = get();
    const now = state.currentTime;

    set({
      rooms: state.rooms.map(r =>
        r.id === roomId
          ? { ...r, status: 'available', pausedReason: undefined, pausedAt: undefined }
          : r
      ),
      pauseAlerts: state.pauseAlerts.map(alert =>
        alert.roomId === roomId && !alert.resolved
          ? { ...alert, resolved: true, resolvedAt: now }
          : alert
      ),
      timeline: [
        ...state.timeline,
        {
          id: generateId(),
          roomId,
          eventType: 'resume' as TimelineEventType,
          timestamp: now,
          description: '恢复使用',
          operatorName,
        },
      ],
    });
  },

  acknowledgeTimeoutAlert: (alertId: string) => {
    const state = get();
    set({
      timeoutAlerts: state.timeoutAlerts.map(a =>
        a.id === alertId ? { ...a, acknowledged: true } : a
      ),
    });
  },

  checkCleaningTimeouts: () => {
    const state = get();
    const now = state.currentTime;
    const newAlerts: CleaningTimeoutAlert[] = [];

    state.rooms.forEach(room => {
      if (room.status === 'cleaning' && room.cleaningStartTime && room.estimatedCleaningEndTime) {
        const overdueMinutes = Math.floor(
          (now.getTime() - room.estimatedCleaningEndTime.getTime()) / 60000
        );

        if (overdueMinutes > 0) {
          const existingAlert = state.timeoutAlerts.find(
            a => a.roomId === room.id && !a.acknowledged
          );

          if (!existingAlert) {
            newAlerts.push({
              id: generateId(),
              roomId: room.id,
              roomName: room.name,
              cleaningStartTime: room.cleaningStartTime,
              expectedEndTime: room.estimatedCleaningEndTime,
              overdueMinutes,
              acknowledged: false,
            });
          }
        }
      }
    });

    if (newAlerts.length > 0) {
      set({
        timeoutAlerts: [...state.timeoutAlerts, ...newAlerts],
      });
    }
  },

  addSterilizationBatch: (batch: Omit<SterilizationBatch, 'id' | 'createdAt'>) => {
    const state = get();
    const newBatch: SterilizationBatch = {
      ...batch,
      id: generateId(),
      createdAt: state.currentTime,
    };

    set({
      sterilizationBatches: [...state.sterilizationBatches, newBatch],
      timeline: [
        ...state.timeline,
        {
          id: generateId(),
          roomId: '',
          eventType: 'batch-qualified' as TimelineEventType,
          timestamp: state.currentTime,
          description: `新增消毒批次 ${newBatch.batchNumber}`,
          operatorName: batch.operatorName,
          batchId: newBatch.id,
          batchNumber: newBatch.batchNumber,
        },
      ],
    });
  },

  markBatchQualified: (batchId: string, operatorName: string) => {
    const state = get();
    const now = state.currentTime;

    set({
      sterilizationBatches: state.sterilizationBatches.map(b =>
        b.id === batchId ? { ...b, status: 'qualified' } : b
      ),
      timeline: [
        ...state.timeline,
        {
          id: generateId(),
          roomId: '',
          eventType: 'batch-qualified' as TimelineEventType,
          timestamp: now,
          description: `消毒批次 ${state.sterilizationBatches.find(b => b.id === batchId)?.batchNumber} 判定为合格`,
          operatorName,
          batchId,
          batchNumber: state.sterilizationBatches.find(b => b.id === batchId)?.batchNumber,
        },
      ],
    });
  },

  traceBatch: (batchId: string, operatorName: string): BatchTraceResult => {
    const state = get();
    const batch = state.sterilizationBatches.find(b => b.id === batchId);
    if (!batch) {
      throw new Error('批次不存在');
    }

    const activeBindings = state.roomBindings.filter(
      b => b.batchId === batchId && b.isActive
    );

    const affectedRooms = activeBindings.map(binding => {
      const room = state.rooms.find(r => r.id === binding.roomId)!;
      return {
        roomId: room.id,
        roomName: room.name,
        status: room.status,
        currentPatientId: room.currentPatientId,
        currentPatientName: room.currentPatientName,
        bindingId: binding.id,
      };
    });

    const affectedPatients = activeBindings
      .map(binding => {
        const patients = state.patients.filter(
          p => p.roomId === binding.roomId && (p.status === 'in-treatment' || p.status === 'waiting')
        );
        return patients.map(p => ({
          patientId: p.id,
          patientName: p.name,
          roomId: binding.roomId,
          roomName: binding.roomName,
          status: p.status as 'in-treatment' | 'waiting',
        }));
      })
      .flat();

    return {
      id: generateId(),
      batchId,
      batchNumber: batch.batchNumber,
      tracedAt: state.currentTime,
      operatorName,
      affectedRooms,
      affectedPatients,
      resolved: false,
    };
  },

  markBatchUnqualified: (batchId: string, reason: string, operatorName: string): BatchTraceResult => {
    const state = get();
    const now = state.currentTime;

    set({
      sterilizationBatches: state.sterilizationBatches.map(b =>
        b.id === batchId ? { ...b, status: 'unqualified', unqualifiedReason: reason, unqualifiedAt: now } : b
      ),
    });

    const traceResult = state.traceBatch(batchId, operatorName);

    traceResult.affectedRooms.forEach(room => {
      if (room.status === 'occupied') {
        state.markRoomForAutoPause(room.roomId, `消毒批次 ${traceResult.batchNumber} 不合格`);
      } else if (room.status === 'available' || room.status === 'cleaning') {
        state.pauseRoom(room.roomId, `消毒批次 ${traceResult.batchNumber} 不合格`, operatorName);
      }
    });

    traceResult.affectedPatients
      .filter(p => p.status === 'waiting')
      .forEach(patient => {
        state.cancelPatientRoomAssignment(patient.patientId);
      });

    const timelineEvents = traceResult.affectedRooms.map(room => ({
      id: generateId(),
      roomId: room.roomId,
      eventType: 'batch-unqualified' as TimelineEventType,
      timestamp: now,
      description: `消毒批次 ${traceResult.batchNumber} 被判定不合格：${reason}`,
      operatorName,
      batchId,
      batchNumber: traceResult.batchNumber,
    }));

    set({
      batchTraces: [...state.batchTraces, traceResult],
      timeline: [...state.timeline, ...timelineEvents],
    });

    return traceResult;
  },

  bindPackageToRoom: (roomId: string, packageId: string, batchId: string, operatorName: string) => {
    const state = get();
    const room = state.rooms.find(r => r.id === roomId);
    
    if (!room) return { success: false, message: '诊室不存在' };
    if (room.status !== 'cleaning') return { success: false, message: '只有清洁中的诊室才能绑定器械包' };

    const pkg = state.instrumentPackages.find(p => p.id === packageId);
    if (!pkg) return { success: false, message: '器械包不存在' };
    if (pkg.status !== 'available') return { success: false, message: '器械包不可用' };

    const batch = state.sterilizationBatches.find(b => b.id === batchId);
    if (!batch) return { success: false, message: '消毒批次不存在' };
    if (batch.status !== 'qualified') return { success: false, message: '消毒批次不合格，不能绑定' };
    if (state.currentTime > batch.expirationDate) return { success: false, message: '消毒批次已过期' };
    if (!batch.packageIds.includes(packageId)) {
      return { success: false, message: '该器械包不属于此消毒批次' };
    }

    const existingBinding = state.roomBindings.find(b => b.roomId === roomId && b.isActive);
    if (existingBinding) {
      state.unbindPackageFromRoom(existingBinding.id, operatorName);
    }

    const newBinding: RoomBinding = {
      id: generateId(),
      roomId,
      roomName: room.name,
      packageId,
      packageName: pkg.name,
      batchId,
      batchNumber: batch.batchNumber,
      boundAt: state.currentTime,
      operatorName,
      isActive: true,
    };

    set({
      roomBindings: [...state.roomBindings, newBinding],
      instrumentPackages: state.instrumentPackages.map(p =>
        p.id === packageId ? { ...p, status: 'in-use', roomId } : p
      ),
      timeline: [
        ...state.timeline,
        {
          id: generateId(),
          roomId,
          eventType: 'package-bound' as TimelineEventType,
          timestamp: state.currentTime,
          description: `绑定器械包 ${pkg.name}，消毒批次 ${batch.batchNumber}`,
          operatorName,
          batchId,
          batchNumber: batch.batchNumber,
          packageId,
          packageName: pkg.name,
        },
      ],
    });

    return { success: true, message: '绑定成功' };
  },

  unbindPackageFromRoom: (bindingId: string, operatorName: string) => {
    const state = get();
    const binding = state.roomBindings.find(b => b.id === bindingId);
    if (!binding) return;

    set({
      roomBindings: state.roomBindings.map(b =>
        b.id === bindingId ? { ...b, isActive: false, unboundAt: state.currentTime } : b
      ),
      instrumentPackages: state.instrumentPackages.map(p =>
        p.id === binding.packageId ? { ...p, status: 'available', roomId: undefined } : p
      ),
      timeline: [
        ...state.timeline,
        {
          id: generateId(),
          roomId: binding.roomId,
          eventType: 'package-unbound' as TimelineEventType,
          timestamp: state.currentTime,
          description: `解除绑定：${binding.packageName}，批次 ${binding.batchNumber}`,
          operatorName,
          batchId: binding.batchId,
          batchNumber: binding.batchNumber,
          packageId: binding.packageId,
          packageName: binding.packageName,
        },
      ],
    });
  },

  getActiveBindingsByRoom: (roomId: string) => {
    const { roomBindings } = get();
    return roomBindings.filter(b => b.roomId === roomId && b.isActive);
  },

  resolveBatchTrace: (traceId: string, operatorName: string) => {
    const state = get();
    set({
      batchTraces: state.batchTraces.map(t =>
        t.id === traceId ? { ...t, resolved: true, resolvedAt: state.currentTime } : t
      ),
    });
  },

  submitEmergencyRequest: (request: Omit<EmergencyInsertRequest, 'id' | 'requestedAt' | 'status'>) => {
    const state = get();
    const now = state.currentTime;

    const candidateRooms = state.rooms.filter(room => {
      const basicCheck = state.canRoomAcceptPatient(room.id);
      if (!basicCheck.canAccept) return false;

      const sterilizationCheck = state.checkRoomSterilizationStatus(room.id);
      if (!sterilizationCheck.isQualified) return false;

      const equipmentCheck = state.checkRoomEquipmentMatch(room.id, request.equipmentRequirements);
      if (!equipmentCheck.isMatch) return false;

      return true;
    });

    const sortedRooms = candidateRooms.sort((a, b) => {
      const aEquip = roomEquipmentMap[a.id]?.length || 0;
      const bEquip = roomEquipmentMap[b.id]?.length || 0;
      return bEquip - aEquip;
    });

    if (sortedRooms.length === 0) {
      return { success: false, message: '没有满足消毒合格和设备需求的可用诊室' };
    }

    const newRequest: EmergencyInsertRequest = {
      ...request,
      id: generateId(),
      requestedAt: now,
      status: 'pending',
    };

    set({
      emergencyRequests: [...state.emergencyRequests, newRequest],
    });

    return {
      success: true,
      message: `找到 ${sortedRooms.length} 个可用诊室`,
      matchedRooms: sortedRooms,
    };
  },

  processEmergencyRequest: (requestId: string, approved: boolean, roomId?: string, reason?: string) => {
    const state = get();
    const request = state.emergencyRequests.find(r => r.id === requestId);
    if (!request) return;

    if (approved && roomId) {
      const emergencyPatient: Patient = {
        id: generateId(),
        name: request.patientName,
        priority: 'emergency',
        queueNumber: 0,
        estimatedDuration: 30,
        arrivedAt: state.currentTime,
        status: 'waiting',
      };

      set({
        patients: [emergencyPatient, ...state.patients],
        emergencyRequests: state.emergencyRequests.map(r =>
          r.id === requestId ? { ...r, status: 'approved', matchedRoomId: roomId, matchedRoomName: state.rooms.find(rm => rm.id === roomId)?.name } : r
        ),
      });

      state.callNextPatient(roomId, request.doctorName);
    } else {
      set({
        emergencyRequests: state.emergencyRequests.map(r =>
          r.id === requestId ? { ...r, status: 'rejected', rejectionReason: reason } : r
        ),
      });
    }
  },
}));
