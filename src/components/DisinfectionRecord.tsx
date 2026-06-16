import { useState } from 'react';
import { Droplets, CheckSquare, Package, AlertTriangle, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useClinicStore } from '@/store/clinicStore';
import { cn } from '@/lib/utils';
import type { DisinfectionItem, DisinfectionRecord } from '@/types';

const disinfectionItems: { value: DisinfectionItem; label: string }[] = [
  { value: 'surface', label: '物体表面消毒' },
  { value: 'equipment', label: '设备器械消毒' },
  { value: 'air', label: '空气消毒' },
  { value: 'waterline', label: '水路消毒' },
  { value: 'tray', label: '治疗盘消毒' },
];

const formatTime = (date?: Date) => {
  if (!date) return '--:--';
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
};

const getDurationMinutes = (start: Date, end?: Date) => {
  const endTime = end || new Date();
  return Math.floor((endTime.getTime() - start.getTime()) / 60000);
};

export default function DisinfectionRecordComponent() {
  const {
    rooms,
    disinfectionRecords,
    instrumentPackages,
    currentTime,
    startDisinfection,
    completeDisinfection,
  } = useClinicStore();

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    roomId: '',
    nurseName: '李护士',
    items: [] as DisinfectionItem[],
    instrumentPackageId: '',
    needsSecondaryTreatment: false,
  });

  const cleaningRooms = rooms.filter(r => r.status === 'cleaning');
  const availablePackages = instrumentPackages.filter(p => p.status === 'available');
  const inProgressRecords = disinfectionRecords.filter(r => r.status === 'in-progress');
  const completedRecords = disinfectionRecords
    .filter(r => r.status === 'completed')
    .sort((a, b) => (b.endTime?.getTime() || 0) - (a.endTime?.getTime() || 0))
    .slice(0, 5);

  const handleSubmit = () => {
    if (!formData.roomId || formData.items.length === 0 || !formData.instrumentPackageId) return;

    const selectedPackage = instrumentPackages.find(p => p.id === formData.instrumentPackageId);
    if (!selectedPackage) return;

    startDisinfection({
      roomId: formData.roomId,
      nurseId: 'nurse-1',
      nurseName: formData.nurseName,
      items: formData.items,
      instrumentPackageId: formData.instrumentPackageId,
      instrumentPackageName: selectedPackage.name,
      needsSecondaryTreatment: formData.needsSecondaryTreatment,
    });

    setFormData({
      roomId: '',
      nurseName: '李护士',
      items: [],
      instrumentPackageId: '',
      needsSecondaryTreatment: false,
    });
    setShowForm(false);
  };

  const toggleItem = (item: DisinfectionItem) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.includes(item)
        ? prev.items.filter(i => i !== item)
        : [...prev.items, item],
    }));
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-cyan-100 flex items-center justify-center">
              <Droplets className="w-5 h-5 text-cyan-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-800">清洁消毒记录</h3>
              <p className="text-sm text-gray-500">
                进行中 {inProgressRecords.length} 项
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1 px-3 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <CheckSquare className="w-4 h-4" />
            登记消毒
          </button>
        </div>
      </div>

      {showForm && (
        <div className="p-4 bg-cyan-50 border-b border-cyan-100 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">选择诊室</label>
              <select
                value={formData.roomId}
                onChange={(e) => setFormData({ ...formData, roomId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="">请选择诊室</option>
                {rooms.filter(r => r.status !== 'maintenance').map(room => (
                  <option key={room.id} value={room.id}>
                    {room.name} ({room.status === 'cleaning' ? '清洁中' : room.status === 'occupied' ? '使用中' : '空闲'})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">护士姓名</label>
              <input
                type="text"
                value={formData.nurseName}
                onChange={(e) => setFormData({ ...formData, nurseName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">消毒项目</label>
            <div className="grid grid-cols-5 gap-2">
              {disinfectionItems.map(item => (
                <button
                  key={item.value}
                  onClick={() => toggleItem(item.value)}
                  className={cn(
                    'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    formData.items.includes(item.value)
                      ? 'bg-cyan-600 text-white'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Package className="w-4 h-4 inline mr-1" />
                器械包编号
              </label>
              <select
                value={formData.instrumentPackageId}
                onChange={(e) => setFormData({ ...formData, instrumentPackageId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="">请选择器械包</option>
                {availablePackages.map(pkg => (
                  <option key={pkg.id} value={pkg.id}>
                    {pkg.code} - {pkg.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.needsSecondaryTreatment}
                  onChange={(e) => setFormData({ ...formData, needsSecondaryTreatment: e.target.checked })}
                  className="w-4 h-4 text-cyan-600 rounded focus:ring-cyan-500"
                />
                <span className="text-sm text-gray-700">需要二次处理</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleSubmit}
              disabled={!formData.roomId || formData.items.length === 0 || !formData.instrumentPackageId}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-300 text-white rounded-lg text-sm font-medium transition-colors"
            >
              开始消毒
            </button>
          </div>
        </div>
      )}

      <div className="divide-y divide-gray-100">
        {inProgressRecords.length > 0 && (
          <div className="p-4">
            <h4 className="text-sm font-medium text-gray-500 mb-3">进行中</h4>
            <div className="space-y-3">
              {inProgressRecords.map(record => (
                <DisinfectionCard
                  key={record.id}
                  record={record}
                  isInProgress
                  onComplete={() => completeDisinfection(record.id)}
                />
              ))}
            </div>
          </div>
        )}

        {completedRecords.length > 0 && (
          <div className="p-4">
            <h4 className="text-sm font-medium text-gray-500 mb-3">最近完成</h4>
            <div className="space-y-3">
              {completedRecords.map(record => (
                <DisinfectionCard key={record.id} record={record} />
              ))}
            </div>
          </div>
        )}

        {inProgressRecords.length === 0 && completedRecords.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            <Droplets className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p>暂无消毒记录</p>
          </div>
        )}
      </div>
    </div>
  );
}

function DisinfectionCard({
  record,
  isInProgress,
  onComplete,
}: {
  record: DisinfectionRecord;
  isInProgress?: boolean;
  onComplete?: () => void;
}) {
  const { rooms, currentTime } = useClinicStore();
  const room = rooms.find(r => r.id === record.roomId);
  const duration = getDurationMinutes(record.startTime, record.endTime);

  return (
    <div className={cn(
      'p-3 rounded-lg border',
      isInProgress ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50 border-gray-200'
    )}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-2">
          <div className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
            isInProgress ? 'bg-yellow-200' : 'bg-green-200'
          )}>
            {isInProgress ? (
              <Clock className="w-4 h-4 text-yellow-700" />
            ) : (
              <CheckCircle className="w-4 h-4 text-green-700" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-800">{room?.name}</span>
              <span className="text-sm text-gray-500">· {record.nurseName}</span>
            </div>
            <div className="flex flex-wrap gap-1 mt-1">
              {record.items.map(item => (
                <span key={item} className="px-2 py-0.5 bg-white rounded text-xs text-gray-600">
                  {disinfectionItems.find(i => i.value === item)?.label}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
              <span>器械包：{record.instrumentPackageName}</span>
              <span>开始：{formatTime(record.startTime)}</span>
              {record.endTime && <span>结束：{formatTime(record.endTime)}</span>}
              <span className="font-medium">用时 {duration} 分钟</span>
            </div>
            {record.needsSecondaryTreatment && (
              <div className="flex items-center gap-1 mt-1 text-xs text-orange-600">
                <AlertTriangle className="w-3 h-3" />
                需要二次处理
              </div>
            )}
          </div>
        </div>

        {isInProgress && onComplete && (
          <button
            onClick={onComplete}
            className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <CheckCircle className="w-4 h-4" />
            完成
          </button>
        )}
      </div>
    </div>
  );
}
