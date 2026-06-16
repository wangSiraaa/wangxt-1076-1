import { useState } from 'react';
import { X, AlertTriangle, Thermometer, Users, Home, XCircle } from 'lucide-react';
import type { SterilizationBatch, BatchTraceResult } from '@/types';
import BatchStatusBadge from './BatchStatusBadge';

interface UnqualifiedBatchModalProps {
  batch: SterilizationBatch;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}

const unqualifiedReasons = [
  '灭菌温度不达标',
  '灭菌时间不足',
  '化学指示卡变色异常',
  '生物监测阳性',
  '包装破损',
  '湿包现象',
  '其他原因',
];

export default function UnqualifiedBatchModal({ batch, onConfirm, onCancel }: UnqualifiedBatchModalProps) {
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [previewResult, setPreviewResult] = useState<BatchTraceResult | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const handleReasonSelect = (reason: string) => {
    setSelectedReason(reason);
    if (reason !== '其他原因') {
      setCustomReason('');
    }
  };

  const getFinalReason = () => {
    if (selectedReason === '其他原因') {
      return customReason.trim();
    }
    return selectedReason;
  };

  const canSubmit = selectedReason && (selectedReason !== '其他原因' || customReason.trim());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">判定消毒批次不合格</h2>
                <p className="text-sm text-gray-500 mt-1">此操作将启动追溯流程，自动处理受影响的诊室和患者</p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="mb-6 p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-3 mb-3">
              <Thermometer className="w-5 h-5 text-gray-400" />
              <span className="font-mono font-bold text-gray-800">{batch.batchNumber}</span>
              <BatchStatusBadge status={batch.status} size="sm" />
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-500">灭菌器：</span>
                <span className="text-gray-800">{batch.sterilizerName}</span>
              </div>
              <div>
                <span className="text-gray-500">操作员：</span>
                <span className="text-gray-800">{batch.operatorName}</span>
              </div>
              <div>
                <span className="text-gray-500">灭菌日期：</span>
                <span className="text-gray-800">{batch.sterilizationDate.toLocaleDateString('zh-CN')}</span>
              </div>
              <div>
                <span className="text-gray-500">器械包数量：</span>
                <span className="text-gray-800">{batch.packageIds.length} 个</span>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="font-semibold text-gray-800 mb-3">选择不合格原因 *</h3>
            <div className="grid grid-cols-2 gap-2">
              {unqualifiedReasons.map(reason => (
                <button
                  key={reason}
                  onClick={() => handleReasonSelect(reason)}
                  className={`p-3 rounded-lg border text-left text-sm transition-colors ${
                    selectedReason === reason
                      ? 'border-red-500 bg-red-50 text-red-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  {reason}
                </button>
              ))}
            </div>
            {selectedReason === '其他原因' && (
              <input
                type="text"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="请输入具体原因..."
                className="mt-3 w-full px-3 py-2 border border-red-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            )}
          </div>

          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-amber-800">系统将自动执行以下操作</h4>
                <ul className="mt-2 text-sm text-amber-700 space-y-1">
                  <li className="flex items-center gap-2">
                    <Home className="w-3.5 h-3.5" />
                    正在使用的诊室：治疗完成后自动暂停
                  </li>
                  <li className="flex items-center gap-2">
                    <Home className="w-3.5 h-3.5" />
                    可用/清洁中的诊室：立即暂停使用
                  </li>
                  <li className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5" />
                    待叫号患者：取消诊室分配，重新排队
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <h4 className="font-semibold text-blue-800 mb-2">操作说明</h4>
            <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
              <li>确认不合格原因后，系统将立即启动追溯</li>
              <li>相关诊室会被标记暂停，需更换器械包后才能恢复</li>
              <li>所有操作将记录在时间线中，可随时追溯</li>
              <li>感控管理页面可查看详细的追溯报告</li>
            </ol>
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
          >
            取消
          </button>
          <button
            onClick={() => canSubmit && onConfirm(getFinalReason())}
            disabled={!canSubmit}
            className="px-6 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <XCircle className="w-4 h-4" />
            确认判定不合格
          </button>
        </div>
      </div>
    </div>
  );
}
