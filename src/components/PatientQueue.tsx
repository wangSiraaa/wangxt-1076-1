import { useState } from 'react';
import { Users, Clock, AlertCircle, Plus, Zap, UserPlus } from 'lucide-react';
import { useClinicStore } from '@/store/clinicStore';
import { cn } from '@/lib/utils';
import type { Patient, PatientPriority } from '@/types';

const formatTime = (date?: Date) => {
  if (!date) return '--:--';
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
};

const getWaitMinutes = (arrivedAt: Date, now: Date) => {
  return Math.floor((now.getTime() - arrivedAt.getTime()) / 60000);
};

export default function PatientQueue() {
  const { patients, currentTime, getQueuePatients, insertEmergencyPatient } = useClinicStore();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPatient, setNewPatient] = useState({ name: '', priority: 'normal' as PatientPriority, estimatedDuration: 30 });

  const queuePatients = getQueuePatients();
  const waitingCount = queuePatients.length;
  const emergencyCount = queuePatients.filter(p => p.priority === 'emergency').length;

  const handleAddPatient = () => {
    if (!newPatient.name.trim()) return;

    const patient: Patient = {
      id: `patient-${Date.now()}`,
      name: newPatient.name,
      priority: newPatient.priority,
      queueNumber: patients.length + 1,
      estimatedDuration: newPatient.estimatedDuration,
      arrivedAt: currentTime,
      status: 'waiting',
    };

    if (newPatient.priority === 'emergency') {
      insertEmergencyPatient(patient, '前台小王');
    } else {
      useClinicStore.setState(state => ({
        patients: [...state.patients, { ...patient, queueNumber: state.patients.length + 1 }],
      }));
    }

    setNewPatient({ name: '', priority: 'normal', estimatedDuration: 30 });
    setShowAddForm(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-800">叫号队列</h3>
              <p className="text-sm text-gray-500">
                等待 {waitingCount} 人 {emergencyCount > 0 && (
                  <span className="text-red-500 font-medium">· 急诊 {emergencyCount} 人</span>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            添加患者
          </button>
        </div>
      </div>

      {showAddForm && (
        <div className="p-4 bg-purple-50 border-b border-purple-100">
          <div className="grid grid-cols-3 gap-3">
            <input
              type="text"
              placeholder="患者姓名"
              value={newPatient.name}
              onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <select
              value={newPatient.priority}
              onChange={(e) => setNewPatient({ ...newPatient, priority: e.target.value as PatientPriority })}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="normal">普通患者</option>
              <option value="emergency">急诊患者</option>
            </select>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="预计时长(分钟)"
                value={newPatient.estimatedDuration}
                onChange={(e) => setNewPatient({ ...newPatient, estimatedDuration: parseInt(e.target.value) || 30 })}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                onClick={handleAddPatient}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
        {queuePatients.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p>暂无等待患者</p>
          </div>
        ) : (
          queuePatients.map((patient, index) => (
            <QueueItem
              key={patient.id}
              patient={patient}
              index={index}
              waitMinutes={getWaitMinutes(patient.arrivedAt, currentTime)}
            />
          ))
        )}
      </div>
    </div>
  );
}

function QueueItem({ patient, index, waitMinutes }: { patient: Patient; index: number; waitMinutes: number }) {
  const isEmergency = patient.priority === 'emergency';
  const isFirst = index === 0;

  return (
    <div className={cn(
      'p-4 flex items-center gap-3',
      isFirst && 'bg-blue-50',
      isEmergency && !isFirst && 'bg-red-50'
    )}>
      <div className={cn(
        'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm',
        isEmergency ? 'bg-red-500 text-white' : isFirst ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'
      )}>
        {isEmergency ? <Zap className="w-5 h-5" /> : patient.queueNumber}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-800">{patient.name}</span>
          {isEmergency && (
            <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full font-medium flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              急诊
            </span>
          )}
          {isFirst && !isEmergency && (
            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
              下一位
            </span>
          )}
        </div>
        <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            预计 {patient.estimatedDuration} 分钟
          </span>
          <span>到诊 {formatTime(patient.arrivedAt)}</span>
          <span className={cn(
            waitMinutes > 30 ? 'text-red-500 font-medium' : ''
          )}>
            等待 {waitMinutes} 分钟
          </span>
        </div>
      </div>

      <div className="text-right">
        <div className="text-2xl font-bold text-gray-300">#{index + 1}</div>
      </div>
    </div>
  );
}
