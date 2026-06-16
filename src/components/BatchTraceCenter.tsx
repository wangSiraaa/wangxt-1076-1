import { useState } from 'react';
import { AlertTriangle, Thermometer, Home, Users, CheckCircle, Clock, Package, XCircle, Play, Search, Filter } from 'lucide-react';
import { useClinicStore } from '@/store/clinicStore';
import { cn } from '@/lib/utils';
import BatchStatusBadge from './BatchStatusBadge';
import type { BatchTraceResult } from '@/types';

const formatDateTime = (date?: Date) => {
  if (!date) return '--';
  return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
};

export default function BatchTraceCenter() {
  const {
    batchTraces,
    sterilizationBatches,
    resolveBatchTrace,
    rooms,
    resumeRoom,
  } = useClinicStore();

  const [selectedTrace, setSelectedTrace] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'resolved'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showDetail, setShowDetail] = useState(false);

  const filteredTraces = batchTraces
    .filter(trace => {
      const matchesStatus =
        filterStatus === 'all' ? true :
        filterStatus === 'active' ? !trace.resolved : trace.resolved;

      const batch = sterilizationBatches.find(b => b.id === trace.batchId);
      const matchesSearch =
        trace.batchNumber.includes(searchTerm) ||
        trace.operatorName.includes(searchTerm) ||
        (batch?.unqualifiedReason && batch.unqualifiedReason.includes(searchTerm));

      return matchesStatus && matchesSearch;
    })
    .sort((a, b) => b.tracedAt.getTime() - a.tracedAt.getTime());

  const activeTraceCount = batchTraces.filter(t => !t.resolved).length;

  const getBatch = (batchId: string) => {
    return sterilizationBatches.find(b => b.id === batchId);
  };

  const handleResolve = (traceId: string) => {
    if (confirm('确认该批次的所有问题都已处理完毕？')) {
      resolveBatchTrace(traceId, '感控管理员');
    }
  };

  const handleResumeRoom = (roomId: string, roomName: string) => {
    if (confirm(`确认恢复 ${roomName} 的使用？请确保已更换合格的器械包。`)) {
      resumeRoom(roomId, '感控管理员');
    }
  };

  const getSelectedTraceData = () => {
    if (!selectedTrace) return null;
    return batchTraces.find(t => t.id === selectedTrace) || null;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-800">应急处理中心</h3>
            <p className="text-sm text-gray-500">
              不合格批次追溯与应急处理
            </p>
          </div>
          </div>
          {activeTraceCount > 0 && (
            <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              {activeTraceCount} 个待处理
            </span>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="搜索批次号、操作员、不合格原因..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          <div className="flex gap-2">
            {(['all', 'active', 'resolved'] as const).map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={cn(
                  'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  filterStatus === status
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                )}
              >
                {status === 'all' ? '全部' :
                 status === 'active' ? '待处理' : '已解决'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {activeTraceCount > 0 && (
        <div className="p-4 bg-red-50 border-b border-red-100">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-red-800">紧急处理提醒</h4>
              <p className="text-sm text-red-700">
                当前有 {activeTraceCount} 个不合格批次需要处理。请尽快更换受影响诊室的器械包，
                确认患者安全后再标记为已解决。
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="p-4">
        {filteredTraces.length === 0 ? (
          <div className="py-12 text-center text-gray-500">
            <CheckCircle className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p>暂无追溯记录</p>
          </div>
        ) : (
            <div className="space-y-4">
              {filteredTraces.map(trace => (
                <TraceCard
                  key={trace.id}
                  trace={trace}
                  batch={getBatch(trace.batchId)}
                  isSelected={selectedTrace === trace.id}
                  onClick={() => {
                    setSelectedTrace(trace.id === selectedTrace ? null : trace.id);
                    setShowDetail(trace.id === selectedTrace ? false : true);
                  }}
                  onResolve={() => handleResolve(trace.id)}
                  onResumeRoom={handleResumeRoom}
                />
              ))}
            </div>
          )}
        )}
      </div>

      {showDetail && selectedTrace && getSelectedTraceData() && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <TraceDetail
            trace={getSelectedTraceData()!}
            batch={getBatch(getSelectedTraceData()!.batchId)}
            onClose={() => {
              setShowDetail(false);
              setSelectedTrace(null);
            }}
            onResumeRoom={handleResumeRoom}
          />
        </div>
      )}
    </div>
  );
}

function TraceCard({
  trace,
  batch,
  isSelected,
  onClick,
  onResolve,
  onResumeRoom,
}: {
  trace: BatchTraceResult;
  batch?: ReturnType<typeof useClinicStore>['sterilizationBatches'][number];
  isSelected: boolean;
  onClick: () => void;
  onResolve: () => void;
  onResumeRoom: (roomId: string, roomName: string) => void;
}) {
  const { rooms } = useClinicStore();

  const affectedRoomsInTreatment = trace.affectedRooms.filter(r => r.status === 'occupied');
  const affectedRoomsPaused = trace.affectedRooms.filter(r => r.status === 'paused');
  const affectedPatientsInTreatment = trace.affectedPatients.filter(p => p.status === 'in-treatment');
  const affectedPatientsWaiting = trace.affectedPatients.filter(p => p.status === 'waiting');

  return (
    <div
      onClick={onClick}
      className={cn(
        'p-4 rounded-lg border-2 transition-all cursor-pointer',
        isSelected
          ? 'border-red-500 bg-red-50 ring-2 ring-red-200'
          : trace.resolved
          ? 'border-gray-200 bg-gray-50 hover:border-gray-300'
          : 'border-gray-200 bg-white hover:border-gray-300'
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
          <Thermometer className="w-4 h-4 text-red-500" />
          <span className="font-mono font-bold text-gray-800">{trace.batchNumber}</span>
          <BatchStatusBadge status="unqualified" size="sm" />
          {trace.resolved ? (
            <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              已解决
            </span>
          ) : (
            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-medium flex items-center gap-1 animate-pulse">
              <Clock className="w-3 h-3" />
              处理中
            </span>
          )}
          </div>
          {batch?.unqualifiedReason && (
            <p className="text-sm text-gray-600">
              不合格原因：{batch.unqualifiedReason}
            </p>
          )}
        </div>
        <div className="text-right text-xs text-gray-500">
          <div>追溯时间：{formatDateTime(trace.tracedAt)}</div>
          <div>操作人：{trace.operatorName}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
        <div className="p-2 bg-white/50 rounded-lg">
          <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
            <Home className="w-3.5 h-3.5" />
            受影响诊室
          </div>
          <div className="font-bold text-gray-800">
            {trace.affectedRooms.length} 间
          </div>
        </div>
        <div className="p-2 bg-white/50 rounded-lg">
          <div className="flex items-center gap-1 text-xs text-red-600 mb-1">
            <Users className="w-3.5 h-3.5" />
            治疗中
          </div>
          <div className="font-bold text-red-600">
            {affectedRoomsInTreatment.length} 间
          </div>
        </div>
        <div className="p-2 bg-white/50 rounded-lg">
          <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
            <Users className="w-3.5 h-3.5" />
            受影响患者
          </div>
          <div className="font-bold text-gray-800">
            {trace.affectedPatients.length} 人
          </div>
        </div>
        <div className="p-2 bg-white/50 rounded-lg">
          <div className="flex items-center gap-1 text-xs text-amber-600 mb-1">
            <Clock className="w-3.5 h-3.5" />
            待就诊
          </div>
          <div className="font-bold text-amber-600">
            {affectedPatientsWaiting.length} 人
          </div>
        </div>
        </div>

      {!trace.resolved && (
        <div className="mt-4 pt-3 border-t border-gray-200 flex justify-end gap-2">
          {affectedRoomsPaused.length > 0 && (
            <div className="flex gap-2 mr-auto">
              {affectedRoomsPaused.map(room => {
                const roomData = rooms.find(r => r.id === room.roomId);
                return (
                  <button
                    key={room.roomId}
                    onClick={(e) => {
                      e.stopPropagation();
                      onResumeRoom(room.roomId, room.roomName);
                    }}
                    className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
                  >
                    <Play className="w-3.5 h-3.5" />
                    恢复 {room.roomName}
                  </button>
                );
              })}
            </div>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onResolve();
            }}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
          >
            <CheckCircle className="w-4 h-4" />
            标记已解决
          </button>
        </div>
      </div>
    </div>
  );
}

function TraceDetail({
  trace,
  batch,
  onClose,
  onResumeRoom,
}: {
  trace: BatchTraceResult;
  batch?: ReturnType<typeof useClinicStore>['sterilizationBatches'][number];
  onClose: () => void;
  onResumeRoom: (roomId: string, roomName: string) => void;
}) {
  const { rooms } = useClinicStore();

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-bold text-gray-800">追溯详情</h4>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          <XCircle className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h5 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
            <Home className="w-4 h-4" />
            受影响诊室
          </h5>
          <div className="space-y-2">
            {trace.affectedRooms.length === 0 ? (
              <div className="text-sm text-gray-500 text-center py-4">
              暂无受影响诊室
            </div>
          ) : (
              trace.affectedRooms.map(room => {
                const roomData = rooms.find(r => r.id === room.roomId);
                return (
                  <div
                    key={room.roomId}
                    className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-800">{room.roomName}</span>
                          <span className={cn(
                            'px-2 py-0.5 rounded-full text-xs font-medium',
                            room.status === 'occupied' ? 'bg-blue-100 text-blue-700' :
                            room.status === 'paused' ? 'bg-red-100 text-red-700' :
                            room.status === 'cleaning' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-700'
                          )}>
                            {room.status === 'occupied' ? '使用中' :
                             room.status === 'paused' ? '已暂停' :
                             room.status === 'cleaning' ? '清洁中' : '可用'}
                          </span>
                        </div>
                        {room.currentPatientName && (
                          <div className="text-sm text-gray-600 mt-1">
                          当前患者：{room.currentPatientName}
                        </div>
                      </div>
                      {room.status === 'paused' && (
                        <button
                          onClick={() => onResumeRoom(room.roomId, room.roomName)}
                          className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-medium transition-colors flex items-center gap-1"
                        >
                          <Play className="w-3.5 h-3.5" />
                          恢复
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div>
          <h5 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
            <Users className="w-4 h-4" />
            受影响患者
          </h5>
          <div className="space-y-2">
            {trace.affectedPatients.length === 0 ? (
              <div className="text-sm text-gray-500 text-center py-4">
                暂无受影响患者
              </div>
            ) : (
              trace.affectedPatients.map(patient => (
              <div
                key={patient.patientId}
                className="p-3 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-800">{patient.patientName}</div>
                    <div className="text-sm text-gray-600">
                      {patient.roomName}
                    </div>
                  </div>
                  <span className={cn(
                    'px-2 py-0.5 rounded-full text-xs font-medium',
                    patient.status === 'in-treatment'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-amber-100 text-amber-700'
                  )}>
                    {patient.status === 'in-treatment' ? '治疗中' : '待就诊'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
        <div className="text-gray-500">批次号：</div>
        <span className="font-mono font-medium">{trace.batchNumber}</span>
      </div>
          <div>
            <div className="text-gray-500">不合格原因：</div>
            <span className="text-red-600">{batch?.unqualifiedReason || '--'}</span>
          </div>
          <div>
            <div className="text-gray-500">追溯时间：</div>
            <span>{formatDateTime(trace.tracedAt)}</span>
          </div>
          <div>
            <div className="text-gray-500">操作员：</div>
            <span>{trace.operatorName}</span>
          </div>
          {trace.resolvedAt && (
            <>
            <div>
              <div className="text-gray-500">解决时间：</div>
              <span className="text-green-600">{formatDateTime(trace.resolvedAt)}</span>
            </div>
          </>
          )}
        </div>
      </div>
    </div>
  );
}
