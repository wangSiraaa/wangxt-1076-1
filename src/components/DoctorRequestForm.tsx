import { useState } from 'react';
import { Stethoscope, Send, AlertCircle } from 'lucide-react';
import { useClinicStore } from '@/store/clinicStore';
import { cn } from '@/lib/utils';

export default function DoctorRequestForm() {
  const { rooms, patients, submitDoctorRequest, canRoomAcceptPatient } = useClinicStore();
  const [formData, setFormData] = useState({
    doctorName: '王医生',
    roomId: '',
    patientId: '',
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const availableRooms = rooms.filter(r => r.status !== 'maintenance');
  const waitingPatients = patients.filter(p => p.status === 'waiting');

  const handleSubmit = () => {
    if (!formData.roomId || !formData.patientId || !formData.doctorName.trim()) return;

    const patient = patients.find(p => p.id === formData.patientId);
    if (!patient) return;

    const result = submitDoctorRequest({
      doctorId: 'doctor-1',
      doctorName: formData.doctorName,
      roomId: formData.roomId,
      patientId: formData.patientId,
      patientName: patient.name,
    });

    setMessage({
      type: result.success ? 'success' : 'error',
      text: result.message,
    });

    if (result.success) {
      setFormData({ doctorName: '王医生', roomId: '', patientId: '' });
    }

    setTimeout(() => setMessage(null), 3000);
  };

  const checkResult = formData.roomId ? canRoomAcceptPatient(formData.roomId) : null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center">
            <Stethoscope className="w-5 h-5 text-teal-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-800">医生申请接诊</h3>
            <p className="text-sm text-gray-500">申请诊室接诊下一位患者</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {message && (
          <div className={cn(
            'p-3 rounded-lg flex items-center gap-2',
            message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          )}>
            <AlertCircle className="w-4 h-4" />
            {message.text}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">医生姓名</label>
          <input
            type="text"
            value={formData.doctorName}
            onChange={(e) => setFormData({ ...formData, doctorName: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            placeholder="请输入医生姓名"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">选择诊室</label>
          <select
            value={formData.roomId}
            onChange={(e) => setFormData({ ...formData, roomId: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="">请选择诊室</option>
            {availableRooms.map(room => (
              <option key={room.id} value={room.id}>
                {room.name} - {
                  room.status === 'available' ? '空闲' :
                  room.status === 'occupied' ? '使用中' :
                  room.status === 'cleaning' ? '清洁中' :
                  room.status === 'paused' ? '已暂停' : '维护中'
                }
              </option>
            ))}
          </select>
        </div>

        {checkResult && !checkResult.canAccept && (
          <div className="p-3 bg-yellow-50 text-yellow-700 rounded-lg text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {checkResult.reason}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">选择患者</label>
          <select
            value={formData.patientId}
            onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="">请选择患者</option>
            {waitingPatients.map(patient => (
              <option key={patient.id} value={patient.id}>
                {patient.name} {patient.priority === 'emergency' ? '(急诊)' : ''} - #{patient.queueNumber}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!formData.roomId || !formData.patientId || !formData.doctorName.trim()}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-300 text-white rounded-lg font-medium transition-colors"
        >
          <Send className="w-4 h-4" />
          提交申请
        </button>
      </div>
    </div>
  );
}
