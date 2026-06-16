import { useState } from 'react';
import { Package, AlertTriangle, CheckCircle, XCircle, RefreshCw, Clock, Search } from 'lucide-react';
import { useClinicStore } from '@/store/clinicStore';
import { cn } from '@/lib/utils';
import type { InstrumentPackage } from '@/types';

const statusConfig = {
  available: { label: '可用', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  'in-use': { label: '使用中', color: 'bg-blue-100 text-blue-700', icon: Clock },
  missing: { label: '缺失', color: 'bg-red-100 text-red-700', icon: XCircle },
  replaced: { label: '已替换', color: 'bg-gray-100 text-gray-500', icon: RefreshCw },
};

const formatDate = (date?: Date) => {
  if (!date) return '--';
  return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
};

export default function InstrumentPackageComponent() {
  const { instrumentPackages, rooms, replaceInstrumentPackage } = useClinicStore();
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPackages = instrumentPackages.filter(pkg =>
    pkg.name.includes(searchTerm) || pkg.code.includes(searchTerm)
  );

  const availableForReplacement = instrumentPackages.filter(p => p.status === 'available');

  const handleReplace = (oldPackageId: string, newPackageId: string) => {
    replaceInstrumentPackage(oldPackageId, newPackageId, '器械室管理员');
    setSelectedPackage(null);
  };

  const stats = {
    total: instrumentPackages.length,
    available: instrumentPackages.filter(p => p.status === 'available').length,
    inUse: instrumentPackages.filter(p => p.status === 'in-use').length,
    missing: instrumentPackages.filter(p => p.status === 'missing').length,
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
              <Package className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-800">器械包管理</h3>
              <p className="text-sm text-gray-500">
                共 {stats.total} 个 · 可用 {stats.available} · 使用中 {stats.inUse} · 缺失 {stats.missing}
              </p>
            </div>
          </div>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="搜索器械包名称或编号..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
        {filteredPackages.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Package className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p>未找到匹配的器械包</p>
          </div>
        ) : (
          filteredPackages.map(pkg => (
            <PackageCard
              key={pkg.id}
              pkg={pkg}
              roomName={rooms.find(r => r.id === pkg.roomId)?.name}
              isSelected={selectedPackage === pkg.id}
              onSelect={() => pkg.status === 'missing' && setSelectedPackage(pkg.id)}
              onReplace={(newId) => handleReplace(pkg.id, newId)}
              availablePackages={availableForReplacement}
              showReplaceOptions={selectedPackage === pkg.id}
            />
          ))
        )}
      </div>
    </div>
  );
}

function PackageCard({
  pkg,
  roomName,
  isSelected,
  onSelect,
  onReplace,
  availablePackages,
  showReplaceOptions,
}: {
  pkg: InstrumentPackage;
  roomName?: string;
  isSelected: boolean;
  onSelect: () => void;
  onReplace: (newId: string) => void;
  availablePackages: InstrumentPackage[];
  showReplaceOptions: boolean;
}) {
  const [newPackageId, setNewPackageId] = useState('');
  const config = statusConfig[pkg.status];
  const StatusIcon = config.icon;

  const isExpired = pkg.expirationDate && new Date() > pkg.expirationDate;

  return (
    <div className={cn(
      'p-4 transition-colors',
      pkg.status === 'missing' && 'cursor-pointer hover:bg-red-50',
      isSelected && 'bg-red-50'
    )}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', config.color)}>
            <Package className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-800">{pkg.name}</span>
              <span className="text-sm text-gray-500 font-mono">{pkg.code}</span>
              <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1', config.color)}>
                <StatusIcon className="w-3 h-3" />
                {config.label}
              </span>
              {isExpired && (
                <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  已过期
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
              {roomName && <span>所属诊室：{roomName}</span>}
              <span>灭菌日期：{formatDate(pkg.sterilizationDate)}</span>
              <span className={isExpired ? 'text-red-600 font-medium' : ''}>
                有效期至：{formatDate(pkg.expirationDate)}
              </span>
            </div>
            {pkg.replacedBy && (
              <div className="mt-1 text-xs text-gray-500">
                已被替换 · {formatDate(pkg.replacedAt)}
              </div>
            )}
          </div>
        </div>

        {pkg.status === 'missing' && (
          <button
            onClick={onSelect}
            className={cn(
              'flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
              isSelected
                ? 'bg-gray-200 text-gray-700'
                : 'bg-orange-600 hover:bg-orange-700 text-white'
            )}
          >
            <RefreshCw className="w-4 h-4" />
            替换
          </button>
        )}
      </div>

      {showReplaceOptions && (
        <div className="mt-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
          <p className="text-sm font-medium text-orange-800 mb-2">选择替换的器械包：</p>
          <div className="flex gap-2">
            <select
              value={newPackageId}
              onChange={(e) => setNewPackageId(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">请选择可用器械包</option>
              {availablePackages.map(p => (
                <option key={p.id} value={p.id}>
                  {p.code} - {p.name}
                </option>
              ))}
            </select>
            <button
              onClick={() => newPackageId && onReplace(newPackageId)}
              disabled={!newPackageId}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-300 text-white rounded-lg text-sm font-medium transition-colors"
            >
              确认替换
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
