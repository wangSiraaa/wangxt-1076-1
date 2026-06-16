import { useEffect, useState } from 'react';
import { Clock, RefreshCw, Info, X, Thermometer, AlertTriangle, Link2, History, Gauge, Stethoscope } from 'lucide-react';
import { useClinicStore } from '@/store/clinicStore';
import { cn } from '@/lib/utils';
import RoomCard from '@/components/RoomCard';
import PatientQueue from '@/components/PatientQueue';
import DisinfectionRecordComponent from '@/components/DisinfectionRecord';
import InstrumentPackageComponent from '@/components/InstrumentPackage';
import PauseAlerts from '@/components/PauseAlerts';
import CleaningTimeoutAlertComponent from '@/components/CleaningTimeoutAlert';
import DoctorRequestForm from '@/components/DoctorRequestForm';
import SterilizationBatchList from '@/components/SterilizationBatchList';
import RoomBindingPanel from '@/components/RoomBindingPanel';
import BindingHistoryTable from '@/components/BindingHistoryTable';
import TraceTimeline from '@/components/TraceTimeline';
import EmergencyInsertForm from '@/components/EmergencyInsertForm';
import BatchTraceCenter from '@/components/BatchTraceCenter';

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
    batchTraces,
  } = useClinicStore();

  const [showGuide, setShowGuide] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'queue' | 'disinfection' | 'instruments' | 'batch' | 'binding' | 'timeline' | 'emergency' | 'trace'>('overview');

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
  const activeTraceCount = batchTraces.filter(t => !t.resolved).length;
  const hasEmergency = activeTraceCount > 0;

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
              {hasEmergency && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white rounded-lg animate-pulse">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {activeTraceCount} 个不合格批次待处理
                  </span>
                </div>
              )}
              {hasAlerts && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg">
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

            <div className="flex gap-1 flex-wrap">
              {[
                { key: 'overview', label: '诊室总览', icon: Gauge },
                { key: 'queue', label: '叫号队列', icon: Clock },
                { key: 'batch', label: '消毒批次', icon: Thermometer },
                { key: 'binding', label: '诊室绑定', icon: Link2 },
                { key: 'emergency', label: '急诊插单', icon: Stethoscope },
                { key: 'trace', label: '应急处理', icon: AlertTriangle, badge: activeTraceCount },
                { key: 'timeline', label: '追溯时间线', icon: History },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as typeof activeTab)}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5',
                    activeTab === tab.key
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  )}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                  {tab.badge && tab.badge > 0 && (
                    <span className="ml-0.5 px-1.5 py-0.5 bg-red-500 text-white rounded-full text-xs">
                      {tab.badge}
                    </span>
                  )}
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
            <h3 className="font-bold text-blue-800 mb-2">消毒批次追溯操作指南</h3>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-3 text-sm text-blue-700">
              <div className="flex flex-col gap-1">
                <span className="font-medium flex items-center gap-1">
                  <Thermometer className="w-3.5 h-3.5" />
                  1. 消毒批次：
                </span>
                录入批次→判定合格/不合格
              </div>
              <div className="flex flex-col gap-1">
                <span className="font-medium flex items-center gap-1">
                  <Link2 className="w-3.5 h-3.5" />
                  2. 诊室绑定：
                </span>
                清洁完成后绑定器械包和批次
              </div>
              <div className="flex flex-col gap-1">
                <span className="font-medium flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  3. 不合格追溯：
                </span>
                系统自动暂停相关诊室、取消患者分配
              </div>
              <div className="flex flex-col gap-1">
                <span className="font-medium flex items-center gap-1">
                  <Stethoscope className="w-3.5 h-3.5" />
                  4. 急诊插单：
                </span>
                三重校验→匹配合格诊室
              </div>
              <div className="flex flex-col gap-1">
                <span className="font-medium flex items-center gap-1">
                  <History className="w-3.5 h-3.5" />
                  5. 追溯时间线：
                </span>
                叫号、清洁、器械、暂停全流程可追溯
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

        {activeTab === 'batch' && (
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2">
              <SterilizationBatchList />
            </div>
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <h3 className="font-bold text-gray-800 mb-3">消毒批次管理规则</h3>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• 消毒完成后需录入批次号并送检</li>
                  <li>• 检测合格后才能绑定到诊室使用</li>
                  <li>• 批次有效期通常为7天，过期自动失效</li>
                  <li>• 不合格批次会自动追溯所有受影响诊室</li>
                  <li>• 历史记录永久保存，可随时查询审计</li>
                </ul>
              </div>
              <div className="bg-gradient-to-br from-red-50 to-amber-50 rounded-xl border border-red-200 p-4">
                <h3 className="font-bold text-red-800 mb-2">⚠️ 不合格判定后果</h3>
                <p className="text-sm text-red-700">
                  一旦标记某个批次为不合格，系统将：
                </p>
                <ul className="text-sm text-red-700 space-y-1 mt-2">
                  <li>• 立即暂停所有使用该批次的可用诊室</li>
                  <li>• 标记正在使用的诊室「治疗完成后自动暂停」</li>
                  <li>• 取消所有已分配该诊室的待叫号患者</li>
                  <li>• 生成追溯记录，记录所有受影响的诊室和患者</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'binding' && (
          <div className="space-y-6">
            <RoomBindingPanel />
            <BindingHistoryTable />
          </div>
        )}

        {activeTab === 'emergency' && (
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2">
              <EmergencyInsertForm />
            </div>
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <h3 className="font-bold text-gray-800 mb-3">急诊插单校验规则</h3>
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="font-medium text-blue-800 text-sm">第一重：基础可用校验</div>
                    <p className="text-xs text-blue-700 mt-1">诊室必须处于「空闲」或「清洁完成」状态</p>
                  </div>
                  <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                    <div className="font-medium text-red-800 text-sm">第二重：消毒合格校验</div>
                    <p className="text-xs text-red-700 mt-1">当前绑定的消毒批次必须在有效期内且检测合格</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="font-medium text-green-800 text-sm">第三重：设备匹配校验</div>
                    <p className="text-xs text-green-700 mt-1">诊室设备配置必须满足医生提出的特殊需求</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <h3 className="font-bold text-gray-800 mb-3">智能匹配排序</h3>
                <p className="text-sm text-gray-600 mb-2">
                  系统按「设备匹配度」从高到低排序推荐诊室，优先推荐设备配置更丰富的诊室。
                </p>
                <div className="text-sm text-gray-500">
                  <strong>匹配度计算：</strong>基础分100分 + 每个匹配的额外设备加10分
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'trace' && (
          <div className="space-y-6">
            <BatchTraceCenter />
          </div>
        )}

        {activeTab === 'timeline' && (
          <div className="space-y-6">
            <TraceTimeline />
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
