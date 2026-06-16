import { useState } from 'react';
import { Clock, User, Stethoscope, AlertTriangle, CheckCircle, Wrench, Pause, Play, X, ChevronDown, ChevronUp } from 'lucide-react';
import type { Room, TimelineEvent } from '@/types';
import { useClinicStore } from '@/store/clinicStore';
import { cn } from '@/lib/utils';

interface RoomCardProps {
  room: Room;
  onCallPatient?: () => void;
  onCompleteTreatment?: () => void;
  onStartMaintenance?: () => void;
  onCompleteMaintenance?: () => void;
}

const statusConfig = {
  available: { label: '空闲可用', color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle },
  occupied: { label: '使用中', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: User },
  cleaning: { label: '清洁消毒中', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock },
  maintenance: { label: '维护中', color: 'bg-orange-100 text-orange-800 border-orange-200', icon: Wrench },
  paused: { label: '已暂停', color: 'bg-red-100 text-red-800 border-red-200', icon: Pause },
};

const formatTime = (date?: Date) => {
  if (!date) return '--:--';
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
};

const getRemainingMinutes = (target?: Date, now?: Date) => {
  if (!target || !now) return 0;
  return Math.max(0, Math.ceil((target.getTime() - now.getTime()) / 60000));
};

const getElapsedMinutes = (start?: Date, now?: Date) => {
  if (!start || !now) return 0;
  return Math.max(0, Math.floor((now.getTime() - start.getTime()) / 60000));
};

export default function RoomCard({
  room,
  onCallPatient,
  onCompleteTreatment,
  onStartMaintenance,
  onCompleteMaintenance,
}: RoomCardProps) {
  const [showTimeline, setShowTimeline] = useState(false);
  const { currentTime, getRoomTimeline, canRoomAcceptPatient, pauseRoom, resumeRoom } = useClinicStore();

  const config = statusConfig[room.status];
  const StatusIcon = config.icon;
  const timeline = getRoomTimeline(room.id);
  const canAccept = canRoomAcceptPatient(room.id);

  const treatmentRemaining = getRemainingMinutes(room.estimatedEndTime, currentTime);
  const cleaningElapsed = getElapsedMinutes(room.cleaningStartTime, currentTime);
  const cleaningRemaining = getRemainingMinutes(room.estimatedCleaningEndTime, currentTime);
  const isCleaningOverdue = room.status === 'cleaning' && room.estimatedCleaningEndTime && currentTime > room.estimatedCleaningEndTime;

  const handlePause = () => {
    const reason = prompt('请输入暂停原因：');
    if (reason) {
      pauseRoom(room.id, reason, '系统操作');
    }
  };

  const handleResume = () => {
    resumeRoom(room.id, '系统操作');
  };

  return (
    <div className={cn(
      'rounded-xl border-2 shadow-sm transition-all hover:shadow-md',
      config.color,
      isCleaningOverdue && 'animate-pulse'
    )}>
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-sm">
              <StatusIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg">{room.name}</h3>
              <span className="text-sm font-medium opacity-80">{config.label}</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {room.status === 'paused' ? (
              <button
                onClick={handleResume}
                className="p-2 rounded-lg bg-white hover:bg-green-50 transition-colors"
                title="恢复使用"
              >
                <Play className="w-4 h-4 text-green-600" />
              </button>
            ) : (
              <button
                onClick={handlePause}
                className="p-2 rounded-lg bg-white hover:bg-red-50 transition-colors"
                title="暂停使用"
              >
                <Pause className="w-4 h-4 text-red-500" />
              </button>
            )}
          </div>
        </div>

        {room.status === 'occupied' && (
          <div className="space-y-2 mb-4">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1">
                <User className="w-4 h-4" />
                患者：{room.currentPatientName}
              </span>
              <span className="flex items-center gap-1">
                <Stethoscope className="w-4 h-4" />
                {room.currentDoctorName}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>开始：{formatTime(room.treatmentStartTime)}</span>
              <span>预计结束：{formatTime(room.estimatedEndTime)}</span>
            </div>
            <div className="bg-white/50 rounded-lg p-2">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="font-medium">剩余时间</span>
                <span className="font-bold text-blue-700">{treatmentRemaining} 分钟</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${Math.min(100, (treatmentRemaining / 40) * 100)}%` }}
                />
              </div>
            </div>
            {onCompleteTreatment && (
              <button
                onClick={onCompleteTreatment}
                className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                完成治疗
              </button>
            )}
          </div>
        )}

        {room.status === 'cleaning' && (
          <div className="space-y-2 mb-4">
            <div className="flex items-center justify-between text-sm">
              <span>开始时间：{formatTime(room.cleaningStartTime)}</span>
              <span>预计完成：{formatTime(room.estimatedCleaningEndTime)}</span>
            </div>
            <div className="bg-white/50 rounded-lg p-2">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="font-medium">已用时</span>
                <span className={cn(
                  'font-bold',
                  isCleaningOverdue ? 'text-red-600' : 'text-yellow-700'
                )}>
                  {cleaningElapsed} 分钟
                  {isCleaningOverdue && <span className="ml-1 text-xs">（已超时）</span>}
                </span>
              </div>
              <div className="w-full bg-yellow-200 rounded-full h-2">
                <div
                  className={cn('h-2 rounded-full transition-all', isCleaningOverdue ? 'bg-red-600' : 'bg-yellow-600')}
                  style={{ width: `${Math.min(100, (cleaningElapsed / room.timeoutThreshold) * 100)}%` }}
                />
              </div>
              {!isCleaningOverdue && (
                <div className="text-xs text-right mt-1 text-yellow-700">
                  剩余 {cleaningRemaining} 分钟
                </div>
              )}
            </div>
          </div>
        )}

        {room.status === 'maintenance' && (
          <div className="space-y-2 mb-4">
            <div className="bg-white/50 rounded-lg p-2">
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-orange-600" />
                <span className="text-sm font-medium">维护进行中</span>
              </div>
              <div className="text-xs mt-1 opacity-80">
                开始时间：{formatTime(room.treatmentStartTime || room.cleaningStartTime)}
              </div>
            </div>
            {onCompleteMaintenance && (
              <button
                onClick={onCompleteMaintenance}
                className="w-full py-2 px-4 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors"
              >
                完成维护
              </button>
            )}
          </div>
        )}

        {room.status === 'paused' && (
          <div className="space-y-2 mb-4">
            <div className="bg-white/50 rounded-lg p-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span className="text-sm font-medium">暂停原因：{room.pausedReason}</span>
              </div>
              <div className="text-xs mt-1 opacity-80">
                暂停时间：{formatTime(room.pausedAt)}
              </div>
            </div>
          </div>
        )}

        {room.status === 'available' && (
          <div className="space-y-2 mb-4">
            <div className="bg-white/50 rounded-lg p-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium">诊室空闲，可接诊</span>
              </div>
            </div>
            {canAccept.canAccept && onCallPatient && (
              <button
                onClick={onCallPatient}
                className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
              >
                叫号接诊
              </button>
            )}
            {!canAccept.canAccept && (
              <div className="text-sm text-red-700 bg-red-50 rounded-lg p-2 flex items-center gap-1">
                <X className="w-4 h-4" />
                {canAccept.reason}
              </div>
            )}
          </div>
        )}

        <button
          onClick={() => setShowTimeline(!showTimeline)}
          className="w-full flex items-center justify-center gap-1 py-1 text-sm opacity-70 hover:opacity-100 transition-opacity"
        >
          {showTimeline ? (
            <>
              <ChevronUp className="w-4 h-4" />
              收起时间线
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" />
              查看时间线
            </>
          )}
        </button>

        {showTimeline && timeline.length > 0 && (
          <div className="mt-3 pt-3 border-t border-current/20">
            <h4 className="text-sm font-medium mb-2">状态时间线</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {timeline.slice(0, 5).map((event) => (
                <TimelineItem key={event.id} event={event} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function TimelineItem({ event }: { event: TimelineEvent }) {
  const iconMap: Record<TimelineEvent['eventType'], typeof User> = {
    'patient-enter': User,
    'patient-exit': X,
    'cleaning-start': Clock,
    'cleaning-complete': CheckCircle,
    'maintenance-start': Wrench,
    'maintenance-end': Wrench,
    'pause': Pause,
    'resume': Play,
  };

  const colorMap: Record<TimelineEvent['eventType'], string> = {
    'patient-enter': 'text-blue-600 bg-blue-100',
    'patient-exit': 'text-gray-600 bg-gray-100',
    'cleaning-start': 'text-yellow-600 bg-yellow-100',
    'cleaning-complete': 'text-green-600 bg-green-100',
    'maintenance-start': 'text-orange-600 bg-orange-100',
    'maintenance-end': 'text-orange-600 bg-orange-100',
    'pause': 'text-red-600 bg-red-100',
    'resume': 'text-green-600 bg-green-100',
  };

  const Icon = iconMap[event.eventType] || Clock;
  const colorClass = colorMap[event.eventType] || 'text-gray-600 bg-gray-100';

  return (
    <div className="flex items-start gap-2">
      <div className={cn('w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5', colorClass)}>
        <Icon className="w-3 h-3" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{event.description}</p>
        <p className="text-xs opacity-70">
          {formatTime(event.timestamp)} · {event.operatorName}
        </p>
      </div>
    </div>
  );
}
