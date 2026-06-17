with open('src/components/TraceTimeline.tsx', 'r') as f:
    content = f.read()

# 1. 修改导入语句，添加 RefreshCw 图标
old_import = "Home } from 'lucide-react';"
new_import = "Home, RefreshCw } from 'lucide-react';"
content = content.replace(old_import, new_import)

# 2. 修改类型导入，添加 SterilizationBatch
old_type_import = "import type { TimelineEvent, TimelineEventType } from '@/types';"
new_type_import = "import type { TimelineEvent, TimelineEventType, SterilizationBatch } from '@/types';"
content = content.replace(old_type_import, new_type_import)

# 3. 添加二次处理的事件类型配置
old_batch_config = "  'batch-unqualified': { label: '批次不合格', color: 'text-red-600 bg-red-100', icon: XCircle, category: 'batch' },\n};"
new_batch_config = """  'batch-unqualified': { label: '批次不合格', color: 'text-red-600 bg-red-100', icon: XCircle, category: 'batch' },
  'secondary-treatment-start': { label: '二次处理开始', color: 'text-purple-600 bg-purple-100', icon: RefreshCw, category: 'cleaning' },
  'secondary-treatment-complete': { label: '二次处理完成', color: 'text-green-600 bg-green-100', icon: CheckCircle, category: 'cleaning' },
};"""
content = content.replace(old_batch_config, new_batch_config)

# 4. 修改 batch 的类型定义
old_batch_type = "  batch?: ReturnType<typeof useClinicStore>['sterilizationBatches'][number] | null;"
new_batch_type = "  batch?: SterilizationBatch | null;"
content = content.replace(old_batch_type, new_batch_type)

with open('src/components/TraceTimeline.tsx', 'w') as f:
    f.write(content)

print('All modifications completed successfully!')
