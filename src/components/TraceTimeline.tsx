import { useState } from 'react';
import { Clock, User, X, CheckCircle, Wrench, Pause, Play, Package, Unlink, Thermometer, XCircle, Filter, Search,  Home, RefreshCw } from 'lucide-react';
import { useClinicStore } from '@/store/clinicStore';
import { cn } from '@/lib/utils';
import BatchStatusBadge from './BatchStatusBadge';
import type { TimelineEvent,  TimelineEventType, SterilizationBatch } from '@/types';

const formatTime = (date?: Date) => {
  if (!date) return '--:--';
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
};

const formatDateTime = (date?: Date) => {
  if (!date) return '--';
  return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
};

const eventTypeConfig: Record<TimelineEventType, {
  label: string;
  color: string;
  icon: typeof Clock;
  category: 'patient' | 'cleaning' | 'maintenance' | 'pause' | 'batch' | 'binding';
}> = {
  'patient-enter': { label: '患者进入', color: 'text-blue-600 bg-blue-100', icon: User, category: 'patient' },
  'patient-exit': { label: '患者离开', color: 'text-gray-600 bg-gray-100', icon: X, category: 'patient' },
  'cleaning-start': { label: '清洁开始', color: 'text-yellow-600 bg-yellow-100', icon: Clock, category: 'cleaning' },
  'cleaning-complete': { label: '清洁完成', color: 'text-green-600 bg-green-100', icon: CheckCircle, category: 'cleaning' },
  'maintenance-start': { label: '维护开始', color: 'text-orange-600 bg-orange-100', icon: Wrench, category: 'maintenance' },
  'maintenance-end': { label: '维护结束', color: 'text-orange-600 bg-orange-100', icon: Wrench, category: 'maintenance' },
  'pause': { label: '诊室暂停', color: 'text-red-600 bg-red-100', icon: Pause, category: 'pause' },
  'resume': { label: '诊室恢复', color: 'text-green-600 bg-green-100', icon: Play, category: 'pause' },
  'package-bound': { label: '器械绑定', color: 'text-indigo-600 bg-indigo-100', icon: Package, category: 'binding' },
  'package-unbound': { label: '器械解绑', color: 'text-gray-500 bg-gray-100', icon: Unlink, category: 'binding' },
  'batch-qualified': { label: '批次合格', color: 'text-teal-600 bg-teal-100', icon: Thermometer, category: 'batch' },
  'batch-unqualified': { label: '批次不合格', color: 'text-red-600 bg-red-100', icon: XCircle, category: 'batch' },
  'secondary-treatment-start': { label: '二次处理开始', color: 'text-purple-600 bg-purple-100', icon: RefreshCw, category: 'cleaning' },
  'secondary-treatment-complete': { label: '二次处理完成', color: 'text-green-600 bg-green-100', icon: CheckCircle, category: 'cleaning' },
};

const categoryLabels = {
  patient: '患者流转',
  cleaning: '清洁消毒',
  maintenance: '设备维护',
  pause: '状态变更',
  batch: '批次管理',
  binding: '器械绑定',
};

interface TraceTimelineProps {
  roomId?: string;
  maxItems?: number;
  showTitle?: boolean;
}

export default function TraceTimeline({ roomId, maxItems, showTitle = true }: TraceTimelineProps) {
  const { getAllTimeline, getRoomTimelineWithBatch, rooms, sterilizationBatches } = useClinicStore();
  const [selectedRoom, setSelectedRoom] = useState<string | null>(roomId || null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const timeline = selectedRoom
    ? getRoomTimelineWithBatch(selectedRoom)
    : getAllTimeline();

  const filteredTimeline = timeline
    .filter(event => {
      const matchesCategory = selectedCategories.length === 0 ||
        selectedCategories.includes(eventTypeConfig[event.eventType].category);

      const matchesSearch = event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.operatorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (event.batchNumber && event.batchNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (event.packageName && event.packageName.toLowerCase().includes(searchTerm.toLowerCase()));

      return matchesCategory && matchesSearch;
    })
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  const displayTimeline = maxItems ? filteredTimeline.slice(0, maxItems) : filteredTimeline;

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const getBatch = (batchId?: string) => {
    if (!batchId) return null;
    return sterilizationBatches.find(b => b.id === batchId);
  };

  const getRoom = (roomId?: string) => {
    if (!roomId) return null;
    return rooms.find(r => r.id === roomId);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {showTitle && (
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <Clock className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-800">追溯时间线</h3>
                <p className="text-sm text-gray-500">
                  {selectedRoom
                    ? `${rooms.find(r => r.id === selectedRoom)?.name} 的操作记录`
                    : '全诊室操作记录'}
                  · 共 {filteredTimeline.length} 条
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                'p-2 rounded-lg transition-colors',
                showFilters || selectedCategories.length > 0
                  ? 'bg-purple-100 text-purple-600'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              <Filter className="w-4 h-4" />
            </button>
          </div>

          {showFilters && (
            <div className="space-y-3 mb-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索事件描述、操作员、批次号、器械包..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {!roomId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Home className="w-3.5 h-3.5 inline mr-1" />
                    选择诊室
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedRoom(null)}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                        !selectedRoom
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      )}
                    >
                      全部诊室
                    </button>
                    {rooms.map(room => (
                      <button
                        key={room.id}
                        onClick={() => setSelectedRoom(room.id)}
                        className={cn(
                          'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                          selectedRoom === room.id
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        )}
                      >
                        {room.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">事件类别</label>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(categoryLabels).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => toggleCategory(key)}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                        selectedCategories.includes(key)
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className={cn('divide-y divide-gray-100', maxItems ? '' : 'max-h-[600px] overflow-y-auto')}>
        {displayTimeline.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Clock className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p>暂无时间线记录</p>
          </div>
        ) : (
          displayTimeline.map((event, index) => (
            <TimelineItem
              key={event.id}
              event={event}
              batch={getBatch(event.batchId)}
              roomName={getRoom(event.roomId)?.name}
              isLast={index === displayTimeline.length - 1}
            />
          ))
        )}
      </div>

      {maxItems && filteredTimeline.length > maxItems && (
        <div className="p-4 border-t border-gray-100 text-center">
          <span className="text-sm text-gray-500">
            还有 {filteredTimeline.length - maxItems} 条记录
          </span>
        </div>
      )}
    </div>
  );
}

function TimelineItem({
  event,
  batch,
  roomName,
  isLast,
}: {
  event: TimelineEvent;
  batch?: SterilizationBatch | null;
  roomName?: string;
  isLast?: boolean;
}) {
  const config = eventTypeConfig[event.eventType];
  const Icon = config.icon;

  return (
    <div className="relative p-4">
      <div className="flex gap-3">
        <div className="relative flex flex-col items-center">
          <div className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10',
            config.color
          )}>
            <Icon className="w-4 h-4" />
          </div>
          {!isLast && (
            <div className="w-0.5 h-full bg-gray-200 absolute top-8" />
          )}
        </div>

        <div className="flex-1 min-w-0 pb-2">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-gray-800">{event.description}</span>
                <span className={cn(
                  'px-2 py-0.5 rounded-full text-xs font-medium',
                  config.color
                )}>
                  {config.label}
                </span>
                {roomName && (
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                    {roomName}
                  </span>
                )}
              </div>

              <div className="mt-1 flex items-center gap-3 text-xs text-gray-500 flex-wrap">
                <span>{formatDateTime(event.timestamp)}</span>
                <span>操作人：{event.operatorName}</span>
              </div>

              {(event.batchNumber || event.packageName) && (
                <div className="mt-2 flex items-center gap-3 flex-wrap">
                  {event.batchNumber && (
                    <div className="flex items-center gap-1.5">
                      <Thermometer className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-xs font-mono text-gray-600">{event.batchNumber}</span>
                      {batch && <BatchStatusBadge status={batch.status} size="sm" />}
                    </div>
                  )}
                  {event.packageName && (
                    <div className="flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-xs text-gray-600">{event.packageName}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="text-right flex-shrink-0">
              <span className="text-xs text-gray-400 font-mono">
                {formatTime(event.timestamp)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
