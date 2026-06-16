import { useState } from 'react';
import { Link2, Unlink, Package, Thermometer, Home, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { useClinicStore } from '@/store/clinicStore';
import { cn } from '@/lib/utils';
import BatchStatusBadge from './BatchStatusBadge';
import BindingHistoryTable from './BindingHistoryTable';
import type { Room, SterilizationBatch, InstrumentPackage } from '@/types';

const formatTime = (date?: Date) => {
  if (!date) return '--:--';
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
};

const formatDateTime = (date?: Date) => {
  if (!date) return '--';
  return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
};

export default function RoomBindingPanel() {
  const {
    rooms,
    sterilizationBatches,
    instrumentPackages,
    roomBindings,
    bindPackageToRoom,
    unbindPackageFromRoom,
    getActiveBindingsByRoom,
    checkRoomSterilizationStatus,
    getQualifiedBatches,
  } = useClinicStore();

  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [selectedBatch, setSelectedBatch] = useState<string | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [bindingMessage, setBindingMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const qualifiedBatches = getQualifiedBatches();
  const availablePackages = instrumentPackages.filter(p => p.status === 'available');

  const handleBind = () => {
    if (!selectedRoom || !selectedPackage || !selectedBatch) {
      setBindingMessage({ type: 'error', message: '请选择诊室、器械包和消毒批次' });
      return;
    }

    const result = bindPackageToRoom(selectedRoom, selectedPackage, selectedBatch, '护士');
    setBindingMessage({
      type: result.success ? 'success' : 'error',
      message: result.message
    });

    if (result.success) {
      setSelectedPackage(null);
      setSelectedBatch(null);
    }

    setTimeout(() => setBindingMessage(null), 3000);
  };

  const handleUnbind = (bindingId: string) => {
    if (confirm('确定要解除此绑定吗？')) {
      unbindPackageFromRoom(bindingId, '护士');
    }
  };

  const getPackagesForBatch = (batchId: string) => {
    const batch = sterilizationBatches.find(b => b.id === batchId);
    if (!batch) return [];
    return availablePackages.filter(p => batch.packageIds.includes(p.id));
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
              <Link2 className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-800">诊室器械绑定</h3>
              <p className="text-sm text-gray-500">护士完成清洁后，绑定器械包和消毒批号</p>
            </div>
          </div>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
          >
            {showHistory ? '返回绑定' : '查看历史'}
          </button>
        </div>

        {bindingMessage && (
          <div className={cn(
            'mb-4 p-3 rounded-lg flex items-center gap-2',
            bindingMessage.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
          )}>
            {bindingMessage.type === 'success' ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <XCircle className="w-4 h-4" />
            )}
            {bindingMessage.message}
          </div>
        )}
      </div>

      {showHistory ? (
        <BindingHistoryTable />
      ) : (
        <div className="p-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <h4 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                <Home className="w-4 h-4" />
                选择诊室
              </h4>
              <div className="space-y-2">
                {rooms.map(room => {
                  const activeBindings = getActiveBindingsByRoom(room.id);
                  const sterilizationStatus = checkRoomSterilizationStatus(room.id);
                  const isSelected = selectedRoom === room.id;

                  return (
                    <button
                      key={room.id}
                      onClick={() => setSelectedRoom(room.id)}
                      className={cn(
                        'w-full p-3 rounded-lg border text-left transition-all',
                        isSelected
                          ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-gray-800">{room.name}</div>
                        <span className={cn(
                          'px-2 py-0.5 rounded-full text-xs font-medium',
                          room.status === 'available' ? 'bg-green-100 text-green-700' :
                          room.status === 'cleaning' ? 'bg-yellow-100 text-yellow-700' :
                          room.status === 'occupied' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        )}>
                          {room.status === 'available' ? '空闲' :
                           room.status === 'cleaning' ? '清洁中' :
                           room.status === 'occupied' ? '使用中' : '暂停'}
                        </span>
                      </div>
                      <div className="mt-2 space-y-1">
                        {activeBindings.length > 0 ? (
                          activeBindings.map(binding => (
                            <div key={binding.id} className="text-xs text-gray-600 flex items-center gap-1">
                              <Package className="w-3 h-3" />
                              {binding.packageName}
                              <span className="text-gray-400">·</span>
                              <span className="font-mono">{binding.batchNumber}</span>
                              {!sterilizationStatus.isQualified && (
                                <AlertTriangle className="w-3 h-3 text-red-500" />
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="text-xs text-gray-400 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            未绑定消毒批次
                          </div>
                        )}
                      </div>
                      {!sterilizationStatus.isQualified && (
                        <div className="mt-2 text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                          {sterilizationStatus.reason}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="lg:col-span-1">
              <h4 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                <Thermometer className="w-4 h-4" />
                选择消毒批次
              </h4>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {qualifiedBatches.length === 0 ? (
                  <div className="p-4 text-center text-gray-500 bg-gray-50 rounded-lg">
                    暂无合格的消毒批次
                  </div>
                ) : (
                  qualifiedBatches.map(batch => {
                    const isSelected = selectedBatch === batch.id;
                    const packagesInBatch = getPackagesForBatch(batch.id);

                    return (
                      <button
                        key={batch.id}
                        onClick={() => {
                          setSelectedBatch(batch.id);
                          setSelectedPackage(null);
                        }}
                        className={cn(
                          'w-full p-3 rounded-lg border text-left transition-all',
                          isSelected
                            ? 'border-teal-500 bg-teal-50 ring-2 ring-teal-200'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        )}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-mono text-sm font-bold">{batch.batchNumber}</span>
                          <BatchStatusBadge status={batch.status} size="sm" />
                        </div>
                        <div className="text-xs text-gray-500">
                          灭菌器：{batch.sterilizerName} · {formatDateTime(batch.sterilizationDate)}
                        </div>
                        <div className="mt-2 text-xs text-gray-600">
                          可用器械包：{packagesInBatch.length} 个
                        </div>
                        {packagesInBatch.length === 0 && (
                          <div className="mt-1 text-xs text-amber-600">
                            此批次暂无可用器械包
                          </div>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            <div className="lg:col-span-1">
              <h4 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                <Package className="w-4 h-4" />
                选择器械包
              </h4>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {!selectedBatch ? (
                  <div className="p-4 text-center text-gray-500 bg-gray-50 rounded-lg">
                    请先选择消毒批次
                  </div>
                ) : getPackagesForBatch(selectedBatch).length === 0 ? (
                  <div className="p-4 text-center text-gray-500 bg-gray-50 rounded-lg">
                    此批次暂无可用器械包
                  </div>
                ) : (
                  getPackagesForBatch(selectedBatch).map(pkg => {
                    const isSelected = selectedPackage === pkg.id;

                    return (
                      <button
                        key={pkg.id}
                        onClick={() => setSelectedPackage(pkg.id)}
                        className={cn(
                          'w-full p-3 rounded-lg border text-left transition-all',
                          isSelected
                            ? 'border-orange-500 bg-orange-50 ring-2 ring-orange-200'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        )}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-gray-800">{pkg.name}</span>
                          <span className="font-mono text-xs text-gray-500">{pkg.code}</span>
                        </div>
                        <div className="text-xs text-gray-500">
                          灭菌日期：{formatDateTime(pkg.sterilizationDate)}
                        </div>
                        <div className="text-xs text-gray-500">
                          有效期至：{formatDateTime(pkg.expirationDate)}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {selectedRoom && selectedBatch && selectedPackage ? (
                  <span className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    已选择：{rooms.find(r => r.id === selectedRoom)?.name} · {instrumentPackages.find(p => p.id === selectedPackage)?.name} · {sterilizationBatches.find(b => b.id === selectedBatch)?.batchNumber}
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    请依次选择诊室、消毒批次和器械包
                  </span>
                )}
              </div>
              <button
                onClick={handleBind}
                disabled={!selectedRoom || !selectedBatch || !selectedPackage}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <Link2 className="w-4 h-4" />
                确认绑定
              </button>
            </div>
          </div>

          {selectedRoom && (
            <div className="mt-6">
              <h4 className="font-medium text-gray-800 mb-3">当前绑定</h4>
              <div className="space-y-2">
                {getActiveBindingsByRoom(selectedRoom).length === 0 ? (
                  <div className="p-4 text-center text-gray-500 bg-gray-50 rounded-lg">
                    暂无活跃绑定
                  </div>
                ) : (
                  getActiveBindingsByRoom(selectedRoom).map(binding => (
                    <div key={binding.id} className="p-3 bg-gray-50 rounded-lg flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-gray-400" />
                          <span className="font-medium">{binding.packageName}</span>
                          <span className="font-mono text-sm text-gray-500">{binding.batchNumber}</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          绑定时间：{formatDateTime(binding.boundAt)} · {binding.operatorName}
                        </div>
                      </div>
                      <button
                        onClick={() => handleUnbind(binding.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="解除绑定"
                      >
                        <Unlink className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
