import { AlertTriangle, Clock, CheckCircle, Bell } from 'lucide-react';
import { useClinicStore } from '@/store/clinicStore';
import { cn } from '@/lib/utils';
import type { CleaningTimeoutAlert } from '@/types';

const formatTime = (date?: Date) => {
  if (!date) return '--:--';
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
};

export default function CleaningTimeoutAlertComponent() {
  const { timeoutAlerts, acknowledgeTimeoutAlert, checkCleaningTimeouts, currentTime } = useClinicStore();

  const unacknowledgedAlerts = timeoutAlerts.filter(a => !a.acknowledged);
  const hasUnacknowledged = unacknowledgedAlerts.length > 0;

  const handleAcknowledge = (alertId: string) => {
    acknowledgeTimeoutAlert(alertId);
  };

  const handleCheckTimeouts = () => {
    checkCleaningTimeouts();
  };

  return (
    <div className={cn(
      'bg-white rounded-xl shadow-sm border overflow-hidden transition-all',
      hasUnacknowledged ? 'border-red-300 animate-pulse' : 'border-gray-200'
    )}>
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn(
              'w-10 h-10 rounded-lg flex items-center justify-center',
              hasUnacknowledged ? 'bg-red-100' : 'bg-yellow-100'
            )}>
              <Bell className={cn('w-5 h-5', hasUnacknowledged ? 'text-red-600' : 'text-yellow-600')} />
            </div>
            <div>
              <h3 className="font-bold text-gray-800">清洁超时提醒</h3>
              <p className="text-sm text-gray-500">
                {hasUnacknowledged ? (
                  <span className="text-red-600 font-medium">{unacknowledgedAlerts.length} 条超时未处理</span>
                ) : (
                  '暂无超时提醒'
                )}
              </p>
            </div>
          </div>
          <button
            onClick={handleCheckTimeouts}
            className="flex items-center gap-1 px-3 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Clock className="w-4 h-4" />
            检查超时
          </button>
        </div>
      </div>

      <div className="divide-y divide-gray-100 max-h-64 overflow-y-auto">
        {timeoutAlerts.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <CheckCircle className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p>所有清洁任务均在按时进行</p>
          </div>
        ) : (
          timeoutAlerts.slice().reverse().map(alert => (
            <TimeoutCard
              key={alert.id}
              alert={alert}
              currentTime={currentTime}
              onAcknowledge={() => handleAcknowledge(alert.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

function TimeoutCard({
  alert,
  currentTime,
  onAcknowledge,
}: {
  alert: CleaningTimeoutAlert;
  currentTime: Date;
  onAcknowledge: () => void;
}) {
  const currentOverdue = Math.floor(
    (currentTime.getTime() - alert.expectedEndTime.getTime()) / 60000
  );

  return (
    <div className={cn(
      'p-4 transition-colors',
      alert.acknowledged ? 'bg-gray-50' : 'bg-red-50'
    )}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5',
            alert.acknowledged ? 'bg-gray-200' : 'bg-red-200'
          )}>
            <AlertTriangle className={cn('w-4 h-4', alert.acknowledged ? 'text-gray-600' : 'text-red-700')} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-800">{alert.roomName}</span>
              {alert.acknowledged ? (
                <span className="px-2 py-0.5 bg-gray-200 text-gray-600 text-xs rounded-full">
                  已确认
                </span>
              ) : (
                <span className="px-2 py-0.5 bg-red-200 text-red-700 text-xs rounded-full animate-pulse">
                  超时 {currentOverdue} 分钟
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
              <span>开始：{formatTime(alert.cleaningStartTime)}</span>
              <span>预计完成：{formatTime(alert.expectedEndTime)}</span>
              {alert.acknowledged && (
                <span className="text-gray-400">超时 {alert.overdueMinutes} 分钟</span>
              )}
            </div>
          </div>
        </div>

        {!alert.acknowledged && (
          <button
            onClick={onAcknowledge}
            className="flex items-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <CheckCircle className="w-4 h-4" />
            确认
          </button>
        )}
      </div>
    </div>
  );
}
