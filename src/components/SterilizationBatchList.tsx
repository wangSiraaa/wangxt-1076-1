import { useState } from 'react';
import { Thermometer, Plus, Search, CheckCircle, XCircle, Eye, Package } from 'lucide-react';
import { useClinicStore } from '@/store/clinicStore';
import { cn } from '@/lib/utils';
import BatchStatusBadge from './BatchStatusBadge';
import UnqualifiedBatchModal from './UnqualifiedBatchModal';
import type { SterilizationBatch } from '@/types';

const formatDate = (date?: Date) => {
  if (!date) return '--';
  return date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
};

export default function SterilizationBatchList() {
  const { sterilizationBatches, addSterilizationBatch, markBatchQualified, markBatchUnqualified } = useClinicStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<SterilizationBatch | null>(null);
  const [showUnqualifiedModal, setShowUnqualifiedModal] = useState(false);

  const filteredBatches = sterilizationBatches.filter(batch =>
    batch.batchNumber.includes(searchTerm) ||
    batch.operatorName.includes(searchTerm) ||
    batch.sterilizerName.includes(searchTerm)
  );

  const stats = {
    total: sterilizationBatches.length,
    qualified: sterilizationBatches.filter(b => b.status === 'qualified').length,
    unqualified: sterilizationBatches.filter(b => b.status === 'unqualified').length,
    pending: sterilizationBatches.filter(b => b.status === 'pending').length,
  };

  const handleMarkQualified = (batchId: string) => {
    markBatchQualified(batchId, '感控管理员');
  };

  const handleMarkUnqualified = (batch: SterilizationBatch) => {
    setSelectedBatch(batch);
    setShowUnqualifiedModal(true);
  };

  const confirmUnqualified = (reason: string) => {
    if (selectedBatch) {
      markBatchUnqualified(selectedBatch.id, reason, '感控管理员');
      setShowUnqualifiedModal(false);
      setSelectedBatch(null);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center">
              <Thermometer className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-800">消毒批次管理</h3>
              <p className="text-sm text-gray-500">
                共 {stats.total} 批 · 合格 {stats.qualified} · 不合格 {stats.unqualified} · 待检 {stats.pending}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            新增批次
          </button>
        </div>

        {showForm && (
          <BatchForm
            onSubmit={(data) => {
              addSterilizationBatch(data);
              setShowForm(false);
            }}
            onCancel={() => setShowForm(false)}
          />
        )}

        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="搜索批次号、操作员、灭菌器..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </div>

      <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
        {filteredBatches.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Thermometer className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p>未找到匹配的消毒批次</p>
          </div>
        ) : (
          filteredBatches.map(batch => (
            <BatchCard
              key={batch.id}
              batch={batch}
              onMarkQualified={() => handleMarkQualified(batch.id)}
              onMarkUnqualified={() => handleMarkUnqualified(batch)}
            />
          ))
        )}
      </div>

      {showUnqualifiedModal && selectedBatch && (
        <UnqualifiedBatchModal
          batch={selectedBatch}
          onConfirm={confirmUnqualified}
          onCancel={() => {
            setShowUnqualifiedModal(false);
            setSelectedBatch(null);
          }}
        />
      )}
    </div>
  );
}

function BatchCard({
  batch,
  onMarkQualified,
  onMarkUnqualified,
}: {
  batch: SterilizationBatch;
  onMarkQualified: () => void;
  onMarkUnqualified: () => void;
}) {
  const [showDetails, setShowDetails] = useState(false);
  const { instrumentPackages } = useClinicStore();

  const relatedPackages = instrumentPackages.filter(p => batch.packageIds.includes(p.id));
  const isExpired = batch.expirationDate && new Date() > batch.expirationDate;

  return (
    <div className={cn(
      'p-4 transition-colors',
      batch.status === 'unqualified' && 'bg-red-50/50'
    )}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className="font-mono font-bold text-gray-800">{batch.batchNumber}</span>
            <BatchStatusBadge status={isExpired ? 'expired' : batch.status} size="sm" />
            {batch.status === 'unqualified' && (
              <span className="text-xs text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                原因：{batch.unqualifiedReason}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
            <span>灭菌器：{batch.sterilizerName}</span>
            <span>操作员：{batch.operatorName}</span>
            <span>灭菌日期：{formatDate(batch.sterilizationDate)}</span>
            <span className={isExpired ? 'text-red-600 font-medium' : ''}>
              有效期至：{formatDate(batch.expirationDate)}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Package className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">
              包含器械包：{relatedPackages.length} 个
              {relatedPackages.slice(0, 3).map(p => (
                <span key={p.id} className="ml-2 bg-gray-100 px-2 py-0.5 rounded text-xs">
                  {p.name}
                </span>
              ))}
              {relatedPackages.length > 3 && (
                <span className="text-xs text-gray-500 ml-1">等 {relatedPackages.length} 个</span>
              )}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 ml-4">
          {batch.status === 'pending' && (
            <>
              <button
                onClick={onMarkQualified}
                className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                合格
              </button>
              <button
                onClick={onMarkUnqualified}
                className="flex items-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <XCircle className="w-4 h-4" />
                不合格
              </button>
            </>
          )}
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
          >
            <Eye className="w-4 h-4" />
            详情
          </button>
        </div>
      </div>

      {showDetails && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">批次ID：</span>
              <span className="font-mono text-gray-800">{batch.id}</span>
            </div>
            <div>
              <span className="text-gray-500">创建时间：</span>
              <span className="text-gray-800">{formatDate(batch.createdAt)}</span>
            </div>
            <div>
              <span className="text-gray-500">灭菌器ID：</span>
              <span className="font-mono text-gray-800">{batch.sterilizerId}</span>
            </div>
            {batch.unqualifiedAt && (
              <div>
                <span className="text-gray-500">不合格判定时间：</span>
                <span className="text-red-600">{formatDate(batch.unqualifiedAt)}</span>
              </div>
            )}
            {batch.notes && (
              <div className="col-span-2">
                <span className="text-gray-500">备注：</span>
                <span className="text-gray-800">{batch.notes}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function BatchForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (data: Omit<SterilizationBatch, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
}) {
  const { instrumentPackages } = useClinicStore();
  const [formData, setFormData] = useState({
    batchNumber: '',
    sterilizationDate: new Date(),
    expirationDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    sterilizerId: 'STER-001',
    sterilizerName: '高压灭菌器1号',
    operatorName: '',
    notes: '',
    packageIds: [] as string[],
    status: 'pending' as const,
  });

  const availablePackages = instrumentPackages.filter(p => p.status === 'available');

  const handlePackageToggle = (packageId: string) => {
    setFormData(prev => ({
      ...prev,
      packageIds: prev.packageIds.includes(packageId)
        ? prev.packageIds.filter(id => id !== packageId)
        : [...prev.packageIds, packageId]
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.batchNumber || !formData.operatorName || formData.packageIds.length === 0) {
      alert('请填写完整信息并选择器械包');
      return;
    }
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="mb-4 p-4 bg-teal-50 rounded-lg border border-teal-200">
      <h4 className="font-medium text-teal-800 mb-3">新增消毒批次</h4>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">批次号 *</label>
          <input
            type="text"
            value={formData.batchNumber}
            onChange={(e) => setFormData(prev => ({ ...prev, batchNumber: e.target.value }))}
            placeholder="如：DIS-20240101-001"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">操作员 *</label>
          <input
            type="text"
            value={formData.operatorName}
            onChange={(e) => setFormData(prev => ({ ...prev, operatorName: e.target.value }))}
            placeholder="输入操作员姓名"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">灭菌器</label>
          <select
            value={formData.sterilizerId}
            onChange={(e) => {
              const sterilizer = e.target.value;
              setFormData(prev => ({
                ...prev,
                sterilizerId: sterilizer,
                sterilizerName: sterilizer === 'STER-001' ? '高压灭菌器1号' : '高压灭菌器2号'
              }));
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="STER-001">高压灭菌器1号</option>
            <option value="STER-002">高压灭菌器2号</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">有效期至</label>
          <input
            type="datetime-local"
            value={new Date(formData.expirationDate.getTime() - formData.expirationDate.getTimezoneOffset() * 60000).toISOString().slice(0, 16)}
            onChange={(e) => setFormData(prev => ({ ...prev, expirationDate: new Date(e.target.value) }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </div>

      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-2">选择器械包 *（已选 {formData.packageIds.length} 个）</label>
        <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
          {availablePackages.map(pkg => (
            <label
              key={pkg.id}
              className={cn(
                'flex items-center gap-1 px-3 py-1.5 rounded-full text-sm cursor-pointer border transition-colors',
                formData.packageIds.includes(pkg.id)
                  ? 'bg-teal-100 text-teal-800 border-teal-300'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              )}
            >
              <input
                type="checkbox"
                checked={formData.packageIds.includes(pkg.id)}
                onChange={() => handlePackageToggle(pkg.id)}
                className="sr-only"
              />
              <Package className="w-3.5 h-3.5" />
              {pkg.name}
            </label>
          ))}
        </div>
      </div>

      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
      </div>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm font-medium transition-colors"
        >
          取消
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          确认提交
        </button>
      </div>
    </form>
  );
}
