import { useState } from 'react';
import { Search, ArrowUpDown, Link2, Unlink, Home, Package, Thermometer } from 'lucide-react';
import { useClinicStore } from '@/store/clinicStore';
import BatchStatusBadge from './BatchStatusBadge';

const formatDateTime = (date?: Date) => {
  if (!date) return '--';
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export default function BindingHistoryTable() {
  const { roomBindings, sterilizationBatches } = useClinicStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<'boundAt' | 'roomName' | 'batchNumber'>('boundAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

  const filteredBindings = roomBindings
    .filter(binding => {
      const matchesSearch =
        binding.roomName.includes(searchTerm) ||
        binding.packageName.includes(searchTerm) ||
        binding.batchNumber.includes(searchTerm) ||
        binding.operatorName.includes(searchTerm);

      const matchesStatus =
        filterStatus === 'all' ? true :
        filterStatus === 'active' ? binding.isActive : !binding.isActive;

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortField === 'boundAt') {
        comparison = a.boundAt.getTime() - b.boundAt.getTime();
      } else if (sortField === 'roomName') {
        comparison = a.roomName.localeCompare(b.roomName);
      } else if (sortField === 'batchNumber') {
        comparison = a.batchNumber.localeCompare(b.batchNumber);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const getBatchStatus = (batchId: string) => {
    const batch = sterilizationBatches.find(b => b.id === batchId);
    return batch?.status || 'pending';
  };

  const stats = {
    total: roomBindings.length,
    active: roomBindings.filter(b => b.isActive).length,
    inactive: roomBindings.filter(b => !b.isActive).length,
  };

  return (
    <div className="p-4">
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="搜索诊室、器械包、批次号、操作员..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'active', 'inactive'] as const).map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterStatus === status
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status === 'all' ? `全部 (${stats.total})` :
               status === 'active' ? `活跃 (${stats.active})` :
               `已解除 (${stats.inactive})`}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-4 py-3 text-left font-medium text-gray-700">
                <button
                  onClick={() => handleSort('roomName')}
                  className="flex items-center gap-1 hover:text-indigo-600 transition-colors"
                >
                  <Home className="w-3.5 h-3.5" />
                  诊室
                  {sortField === 'roomName' && (
                    <ArrowUpDown className={cn(
                      'w-3 h-3 transition-transform',
                      sortOrder === 'asc' ? '' : 'rotate-180'
                    )} />
                  )}
                </button>
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">
                <div className="flex items-center gap-1">
                  <Package className="w-3.5 h-3.5" />
                  器械包
                </div>
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">
                <button
                  onClick={() => handleSort('batchNumber')}
                  className="flex items-center gap-1 hover:text-indigo-600 transition-colors"
                >
                  <Thermometer className="w-3.5 h-3.5" />
                  消毒批次
                  {sortField === 'batchNumber' && (
                    <ArrowUpDown className={cn(
                      'w-3 h-3 transition-transform',
                      sortOrder === 'asc' ? '' : 'rotate-180'
                    )} />
                  )}
                </button>
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">批次状态</th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">绑定状态</th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">
                <button
                  onClick={() => handleSort('boundAt')}
                  className="flex items-center gap-1 hover:text-indigo-600 transition-colors"
                >
                  绑定时间
                  {sortField === 'boundAt' && (
                    <ArrowUpDown className={cn(
                      'w-3 h-3 transition-transform',
                      sortOrder === 'asc' ? '' : 'rotate-180'
                    )} />
                  )}
                </button>
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">解除时间</th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">操作员</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredBindings.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                  暂无绑定记录
                </td>
              </tr>
            ) : (
              filteredBindings.map(binding => (
                <tr key={binding.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <span className="font-medium text-gray-800">{binding.roomName}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-gray-700">{binding.packageName}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-gray-700">{binding.batchNumber}</span>
                  </td>
                  <td className="px-4 py-3">
                    <BatchStatusBadge status={getBatchStatus(binding.batchId)} size="sm" />
                  </td>
                  <td className="px-4 py-3">
                    {binding.isActive ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                        <Link2 className="w-3 h-3" />
                        已绑定
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                        <Unlink className="w-3 h-3" />
                        已解除
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {formatDateTime(binding.boundAt)}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {binding.unboundAt ? formatDateTime(binding.unboundAt) : '--'}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {binding.operatorName}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {filteredBindings.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200 text-sm text-gray-500 text-center">
          共 {filteredBindings.length} 条记录
        </div>
      )}
    </div>
  );
}

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}
