import { useState } from 'react';
import { AlertTriangle, Stethoscope, Home, Package, CheckCircle, XCircle, Search, User, Thermometer, Wrench, Clock } from 'lucide-react';
import { useClinicStore } from '@/store/clinicStore';
import { cn } from '@/lib/utils';
import BatchStatusBadge from './BatchStatusBadge';
import type { Room, EmergencyInsertRequest } from '@/types';

const formatTime = (date?: Date) => {
  if (!date) return '--:--';
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
};

export default function EmergencyInsertForm() {
  const {
    equipmentRequirements,
    rooms,
    emergencyRequests,
    submitEmergencyRequest,
    processEmergencyRequest,
    checkRoomSterilizationStatus,
    checkRoomEquipmentMatch,
    getActiveBindingsByRoom,
  } = useClinicStore();

  const [formData, setFormData] = useState({
    patientName: '',
    doctorId: '',
    doctorName: '',
    equipmentRequirements: [] as string[],
  });

  const [matchedRooms, setMatchedRooms] = useState<Room[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);

  const doctors = [
    { id: 'doc-001', name: '张医生' },
    { id: 'doc-002', name: '李医生' },
    { id: 'doc-003', name: '王医生' },
  ];

  const handleEquipmentToggle = (equipId: string) => {
    setFormData(prev => ({
      ...prev,
      equipmentRequirements: prev.equipmentRequirements.includes(equipId)
        ? prev.equipmentRequirements.filter(id => id !== equipId)
        : [...prev.equipmentRequirements, equipId]
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!formData.patientName.trim() || !formData.doctorId) {
      setErrorMessage('请填写患者姓名并选择医生');
      return;
    }

    const result = submitEmergencyRequest({
      patientName: formData.patientName.trim(),
      patientPriority: 'emergency',
      doctorId: formData.doctorId,
      doctorName: formData.doctorName,
      equipmentRequirements: formData.equipmentRequirements,
    });

    if (!result.success) {
      setErrorMessage(result.message);
      setShowResults(false);
      return;
    }

    if (result.matchedRooms && result.matchedRooms.length > 0) {
      setMatchedRooms(result.matchedRooms);
      setShowResults(true);
    } else {
      setErrorMessage('没有符合条件的诊室，请调整设备需求或等待诊室释放');
      setShowResults(false);
    }
  };

  const handleConfirmInsert = () => {
    if (!selectedRoom || matchedRooms.length === 0) return;

    const pendingRequest = emergencyRequests.find(r => r.status === 'pending');
    if (pendingRequest) {
      processEmergencyRequest(pendingRequest.id, true, selectedRoom, '急诊插单');
      setFormData({
        patientName: '',
        doctorId: '',
        doctorName: '',
        equipmentRequirements: [],
      });
      setShowResults(false);
      setSelectedRoom(null);
      setMatchedRooms([]);
    }
  };

  const handleCancel = () => {
    const pendingRequest = emergencyRequests.find(r => r.status === 'pending');
    if (pendingRequest) {
      processEmergencyRequest(pendingRequest.id, false, undefined, '取消急诊插单');
    }
    setShowResults(false);
    setSelectedRoom(null);
    setMatchedRooms([]);
  };

  const pendingRequests = emergencyRequests.filter(r => r.status === 'pending');
  const historyRequests = emergencyRequests.filter(r => r.status !== 'pending').slice(0, 5);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-800">急诊插单</h3>
            <p className="text-sm text-gray-500">自动校验消毒合格和设备匹配，确保安全插单</p>
          </div>
        </div>
      </div>

      <div className="p-4">
        {pendingRequests.length > 0 && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center gap-2 text-amber-800">
              <AlertTriangle className="w-4 h-4" />
              <span className="font-medium">有待处理的急诊请求</span>
            </div>
            <p className="text-sm text-amber-700 mt-1">
              {pendingRequests[0].patientName} · {pendingRequests[0].doctorName}
            </p>
          </div>
        )}

        {errorMessage && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-800">
            <XCircle className="w-4 h-4" />
            {errorMessage}
          </div>
        )}

        {!showResults ? (
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <User className="w-3.5 h-3.5 inline mr-1" />
                  患者姓名 *
                </label>
                <input
                  type="text"
                  value={formData.patientName}
                  onChange={(e) => setFormData(prev => ({ ...prev, patientName: e.target.value }))}
                  placeholder="请输入患者姓名"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Stethoscope className="w-3.5 h-3.5 inline mr-1" />
                  主治医生 *
                </label>
                <select
                  value={formData.doctorId}
                  onChange={(e) => {
                    const doctor = doctors.find(d => d.id === e.target.value);
                    setFormData(prev => ({
                      ...prev,
                      doctorId: e.target.value,
                      doctorName: doctor?.name || ''
                    }));
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="">请选择医生</option>
                  {doctors.map(doc => (
                    <option key={doc.id} value={doc.id}>{doc.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Wrench className="w-3.5 h-3.5 inline mr-1" />
                设备需求（可选）
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {equipmentRequirements.map(equip => (
                  <label
                    key={equip.id}
                    className={cn(
                      'flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors text-sm',
                      formData.equipmentRequirements.includes(equip.id)
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={formData.equipmentRequirements.includes(equip.id)}
                      onChange={() => handleEquipmentToggle(equip.id)}
                      className="sr-only"
                    />
                    <Wrench className="w-3.5 h-3.5" />
                    {equip.name}
                  </label>
                ))}
              </div>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg mb-4">
              <h4 className="font-medium text-blue-800 mb-1">插单校验规则</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li className="flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  诊室必须处于可用状态
                </li>
                <li className="flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  绑定的消毒批次必须合格且在有效期内
                </li>
                <li className="flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  满足医生指定的所有设备需求
                </li>
              </ul>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <AlertTriangle className="w-4 h-4" />
              提交急诊插单请求
            </button>
          </form>
        ) : (
          <div>
            <div className="mb-4">
              <h4 className="font-medium text-gray-800 mb-2">匹配结果</h4>
              <p className="text-sm text-gray-600">
                找到 <span className="font-bold text-green-600">{matchedRooms.length}</span> 个符合条件的诊室
              </p>
            </div>

            <div className="space-y-3 mb-4 max-h-[400px] overflow-y-auto">
              {matchedRooms.map((room, index) => {
                const sterilizationStatus = checkRoomSterilizationStatus(room.id);
                const equipmentStatus = checkRoomEquipmentMatch(room.id, formData.equipmentRequirements);
                const activeBindings = getActiveBindingsByRoom(room.id);

                return (
                  <div
                    key={room.id}
                    onClick={() => setSelectedRoom(room.id)}
                    className={cn(
                      'p-4 rounded-lg border-2 cursor-pointer transition-all',
                      selectedRoom === room.id
                        ? 'border-green-500 bg-green-50 ring-2 ring-green-200'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    )}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {index === 0 && (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                            推荐
                          </span>
                        )}
                        <span className="font-bold text-gray-800">{room.name}</span>
                      </div>
                      <Home className="w-5 h-5 text-gray-400" />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Thermometer className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">消毒状态：</span>
                        {sterilizationStatus.isQualified ? (
                          <span className="text-green-600 flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5" />
                            合格
                            {activeBindings[0] && (
                              <span className="font-mono text-xs ml-1">
                                {activeBindings[0].batchNumber}
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="text-red-600 flex items-center gap-1">
                            <XCircle className="w-3.5 h-3.5" />
                            {sterilizationStatus.reason}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-sm">
                        <Wrench className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">设备匹配：</span>
                        {equipmentStatus.isMatch ? (
                          <span className="text-green-600 flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5" />
                            全部满足
                          </span>
                        ) : (
                          <span className="text-amber-600">
                            缺少：{equipmentStatus.missingEquipment?.join('、')}
                          </span>
                        )}
                      </div>

                      {activeBindings.length > 0 && (
                        <div className="flex items-center gap-2 text-sm">
                          <Package className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600">器械包：</span>
                          {activeBindings.map(b => (
                            <span key={b.id} className="bg-gray-100 px-2 py-0.5 rounded text-xs">
                              {b.packageName}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCancel}
                className="flex-1 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleConfirmInsert}
                disabled={!selectedRoom}
                className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                确认插单
              </button>
            </div>
          </div>
        )}

        {historyRequests.length > 0 && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <h4 className="font-medium text-gray-800 mb-3">最近插单记录</h4>
            <div className="space-y-2">
              {historyRequests.map(request => (
                <div key={request.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-sm">
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{request.patientName}</span>
                    <span className="text-gray-500">{request.doctorName}</span>
                    {request.matchedRoomName && (
                      <span className="text-gray-600">→ {request.matchedRoomName}</span>
                    )}
                  </div>
                  <span className={cn(
                    'px-2 py-0.5 rounded-full text-xs font-medium',
                    request.status === 'approved' ? 'bg-green-100 text-green-700' :
                    request.status === 'rejected' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-700'
                  )}>
                    {request.status === 'approved' ? '已安排' :
                     request.status === 'rejected' ? '已拒绝' : '已完成'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
