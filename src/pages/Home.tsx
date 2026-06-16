import { useEffect, useState } from 'react';
import { Clock, RefreshCw, Info, X } from 'lucide-react';
import { useClinicStore } from '@/store/clinicStore';
import { cn } from '@/lib/utils';
import RoomCard from '@/components/RoomCard';
import PatientQueue from '@/components/PatientQueue';
import DisinfectionRecordComponent from '@/components/DisinfectionRecord';
import InstrumentPackageComponent from '@/components/InstrumentPackage';
import PauseAlerts from '@/components/PauseAlerts';
import CleaningTimeoutAlertComponent from '@/components/CleaningTimeoutAlert';
import DoctorRequestForm from '@/components/DoctorRequestForm';

export default function Home() {
  const {
    rooms,
    currentTime,
    setCurrentTime,
    callNextPatient,
    completePatientTreatment,
    completeMaintenance,
    checkCleaningTimeouts,
    getAvailableRooms,
    pauseAlerts,
    timeoutAlerts,
  } = useClinicStore();

  const [showGuide, setShowGuide] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'queue' | 'disinfection' | 'instruments'>('overview');

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      checkCleaningTimeouts();
    }, 1000);

    return () => clearInterval(timer);
  }, [setCurrentTime, checkCleaningTimeouts]);

  const availableRooms = getAvailableRooms();
  const occupiedRooms = rooms.filter(r => r.status === 'occupied');
  const cleaningRooms = rooms.filter(r => r.status === 'cleaning');
  const maintenanceRooms = rooms.filter(r => r.status === 'maintenance');
  const pausedRooms = rooms.filter(r => r.status === 'paused');

  const unacknowledgedTimeouts = timeoutAlerts.filter(a => !a.acknowledged).length;
  const unresolvedPauses = pauseAlerts.filter(a => !a.resolved).length;
  const hasAlerts = unacknowledgedTimeouts > 0 || unresolvedPauses > 0;

  const handleCallPatient = (roomId: string) => {
    const result = callNextPatient(roomId, '前台小王');
    if (!result.success) {
      alert(result.message);
    }
  };

  const handleCompleteTreatment = (roomId: string) => {
    completePatientTreatment(roomId, '王医生');
  };

  const handleCompleteMaintenance = (recordId: string) => {
    completeMaintenance(recordId);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-800">牙科诊室清洁周转系统</h1>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg">
                <Clock className="w-4 h-4" />
                <span className="font-mono font-medium">
                  {currentTime.toLocaleString('zh-CN', {
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {hasAlerts && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-700 rounded-lg animate-pulse">
                  <Info className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {unacknowledgedTimeouts > 0 && `${unacknowledgedTimeouts} 条超时`}
                    {unacknowledgedTimeouts > 0 && unresolvedPauses > 0 && ' · '}
                    {unresolvedPauses > 0 && `${unresolvedPauses} 条暂停`}
                  </span>
                </div>
              )}
              <button
                onClick={() => checkCleaningTimeouts()}
                className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                刷新状态
              </button>
            </div>
          </div>

          <div className="flex items-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-sm text-gray-600">空闲 {availableRooms.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-sm text-gray-600">使用中 {occupiedRooms.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <span className="text-sm text-gray-600">清洁中 {cleaningRooms.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-500"></div>
              <span className="text-sm text-gray-600">维护中 {maintenanceRooms.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-sm text-gray-600">已暂停 {pausedRooms.length}</span>
            </div>

            <div className="flex-1"></div>

            <div className="flex gap-1">
              {[
                { key: 'overview', label: '诊室总览' },
                { key: 'queue', label: '叫号队列' },
                { key: 'disinfection', label: '消毒记录' },
                { key: 'instruments', label: '器械管理' },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as typeof activeTab)}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                    activeTab === tab.key
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {showGuide && (
        <div className="max-w-7xl mx-auto px-4 mt-4">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 relative">
            <button
              onClick={() => setShowGuide(false)}
              className="absolute top-3 right-3 p-1 hover:bg-blue-100 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-blue-700" />
            </button>
            <h3 className="font-bold text-blue-800 mb-2">操作指南</h3>
            <div className="grid grid-cols-5 gap-4 text-sm text-blue-700">
              <div>
                <span className="font-medium">1. 完成治疗：</span>
                诊室1 点击「完成治疗」
              </div>
              <div>
                <span className="font-medium">2. 登记消毒：</span>
                清洁消毒记录 → 登记消毒
              </div>
              <div>
                <span className="font-medium">3. 完成消毒：</span>
                进行中 → 点击「完成」
              </div>
              <div>
                <span className="font-medium">4. 叫号接诊：</span>
                诊室卡片 → 点击「叫号接诊」
              </div>
              <div>
                <span className="font-medium">5. 异常处理：</span>
                超时提醒、暂停恢复、器械替换
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-8 space-y-6">
              <div>
                <h2 className="text-lg font-bold text-gray-800 mb-4">诊室状态</h2>
                <div className="grid grid-cols-3 gap-4">
                  {rooms.map(room => (
                    <RoomCard
                      key={room.id}
                      room={room}
                      onCallPatient={() => handleCallPatient(room.id)}
                      onCompleteTreatment={() => handleCompleteTreatment(room.id)}
                      onCompleteMaintenance={() => {
                        const maintenance = useClinicStore.getState().maintenanceRecords.find(
                          m => m.roomId === room.id && m.status === 'in-progress'
                        );
                        if (maintenance) {
                          handleCompleteMaintenance(maintenance.id);
                        }
                      }}
                    />
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <CleaningTimeoutAlertComponent />
                <PauseAlerts />
              </div>
            </div>

            <div className="col-span-4 space-y-6">
              <PatientQueue />
              <DoctorRequestForm />
            </div>
          </div>
        )}

        {activeTab === 'queue' && (
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2">
              <PatientQueue />
            </div>
            <div className="space-y-6">
              <DoctorRequestForm />
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <h3 className="font-bold text-gray-800 mb-3">急诊插队演示</h3>
                <p className="text-sm text-gray-600 mb-3">
                  在叫号队列中点击「添加患者」，选择「急诊患者」类型，该患者将自动插入队列最前面。
                </p>
                <div className="p-3 bg-red-50 rounded-lg text-sm text-red-700">
                  <strong>规则：</strong>急诊患者始终优先于普通患者叫号
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'disinfection' && (
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2">
              <DisinfectionRecordComponent />
            </div>
            <div className="space-y-6">
              <CleaningTimeoutAlertComponent />
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <h3 className="font-bold text-gray-800 mb-3">消毒登记说明</h3>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• 必须填写消毒项目（可多选）</li>
                  <li>• 必须选择器械包编号</li>
                  <li>• 如需二次处理请勾选对应选项</li>
                  <li>• 消毒完成前不能叫号接诊</li>
                  <li>• 超过15分钟未完成将触发超时提醒</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'instruments' && (
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2">
              <InstrumentPackageComponent />
            </div>
            <div className="space-y-6">
              <PauseAlerts />
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <h3 className="font-bold text-gray-800 mb-3">器械包管理规则</h3>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• 缺失的器械包会导致诊室暂停</li>
                  <li>• 点击「替换」可更换可用的器械包</li>
                  <li>• 替换后诊室自动恢复可用状态</li>
                  <li>• 已过期器械包会有红色标记</li>
                  <li>• 器械包状态实时同步到诊室卡片</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-gray-200 mt-8 py-4">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-500">
          牙科诊室清洁周转系统 · 按门诊护士长控制诊室翻台节奏设计 · 多角色协作平台
        </div>
      </footer>
    </div>
  );
}
