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

  setCurrentTime: (time: Date) => set({ currentTime: time }),

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
          eventType: 'patient-enter',
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
          eventType: 'patient-enter',
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
          eventType: 'patient-exit',
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
          eventType: 'cleaning-start',
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
          eventType: 'cleaning-complete',
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
          eventType: 'resume',
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
          eventType: 'maintenance-start',
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
          eventType: 'maintenance-end',
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

    const now = state.currentTime;

    if (approved) {
      const callResult = state.callNextPatient(request.roomId, request.doctorName);
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
          eventType: 'pause',
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
          eventType: 'resume',
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
}));
