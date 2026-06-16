import { AlertTriangle, CheckCircle, Clock, Play, XCircle } from 'lucide-react';
import { useClinicStore } from '@/store/clinicStore';
import { cn } from '@/lib/utils';
import type { PauseAlert, DoctorRequest } from '@/types';

const formatTime = (date?: Date) => {
  if (!date) return '--:--';
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
};

const formatDate = (date?: Date) => {
  if (!date) return '--';
  return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
};

export default function PauseAlerts() {
  const { pauseAlerts, doctorRequests, resumeRoom, processDoctorRequest, currentTime } = useClinicStore();

  const unresolvedAlerts = pauseAlerts.filter(a => !a.resolved);
  const pendingRequests = doctorRequests.filter(r => r.status === 'pending');

  const handleResume = (roomId: string) => {
    resumeRoom(roomId, '护士长');
  };

  const handleApproveRequest = (requestId: string) => {
    processDoctorRequest(requestId, true);
  };

  const handleRejectRequest = (requestId: string) => {
    const reason = prompt('请输入拒绝原因：');
    if (reason) {
      processDoctorRequest(requestId, false, reason);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-800">暂停提示</h3>
              <p className="text-sm text-gray-500">
                未解决 {unresolvedAlerts.length} 条
              </p>
            </div>
          </div>
        </div>

        <div className="divide-y divide-gray-100 max-h-48 overflow-y-auto">
          {unresolvedAlerts.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <CheckCircle className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p>暂无暂停提示</p>
            </div>
          ) : (
            unresolvedAlerts.map(alert => (
              <PauseAlertCard key={alert.id} alert={alert} onResume={() => handleResume(alert.roomId)} />
            ))
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-800">医生申请</h3>
              <p className="text-sm text-gray-500">
                待处理 {pendingRequests.length} 条
              </p>
            </div>
          </div>
        </div>

        <div className="divide-y divide-gray-100 max-h-48 overflow-y-auto">
          {pendingRequests.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <Clock className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p>暂无待处理申请</p>
            </div>
          ) : (
            pendingRequests.map(request => (
              <DoctorRequestCard
                key={request.id}
                request={request}
                onApprove={() => handleApproveRequest(request.id)}
                onReject={() => handleRejectRequest(request.id)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function PauseAlertCard({ alert, onResume }: { alert: PauseAlert; onResume: () => void }) {
  const { rooms } = useClinicStore();
  const room = rooms.find(r => r.id === alert.roomId);

  return (
    <div className="p-4 bg-red-50 border-l-4 border-red-500">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-800">{alert.roomName}</span>
              <span className="text-sm text-gray-500">
                {formatDate(alert.createdAt)} {formatTime(alert.createdAt)}
              </span>
            </div>
            <p className="text-sm text-red-700 mt-1">{alert.reason}</p>
          </div>
        </div>
        <button
          onClick={onResume}
          className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Play className="w-4 h-4" />
          恢复
        </button>
      </div>
    </div>
  );
}

function DoctorRequestCard({
  request,
  onApprove,
  onReject,
}: {
  request: DoctorRequest;
  onApprove: () => void;
  onReject: () => void;
}) {
  const { rooms, canRoomAcceptPatient } = useClinicStore();
  const room = rooms.find(r => r.id === request.roomId);
  const checkResult = canRoomAcceptPatient(request.roomId);

  return (
    <div className={cn(
      'p-4 border-l-4',
      checkResult.canAccept ? 'bg-blue-50 border-blue-500' : 'bg-yellow-50 border-yellow-500'
    )}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <Clock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-800">{request.doctorName}</span>
              <span className="text-sm text-gray-500">
                申请 {room?.name} 接诊
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              患者：{request.patientName} · {formatTime(request.requestedAt)}
            </p>
            {!checkResult.canAccept && (
              <p className="text-sm text-yellow-700 mt-1 flex items-center gap-1">
                <AlertTriangle className="w-4 h-4" />
                {checkResult.reason}
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onReject}
            className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm font-medium transition-colors"
          >
            拒绝
          </button>
          <button
            onClick={onApprove}
            disabled={!checkResult.canAccept}
            className={cn(
              'flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
              checkResult.canAccept
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            )}
          >
            <CheckCircle className="w-4 h-4" />
            批准
          </button>
        </div>
      </div>
    </div>
  );
}
