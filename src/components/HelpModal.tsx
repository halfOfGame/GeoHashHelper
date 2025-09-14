/**
 * 帮助模态框组件
 * 提供详细的使用说明、常见问题和故障排除指南
 */

'use client';

import React, { useState } from 'react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  const [activeSection, setActiveSection] = useState<'guide' | 'faq' | 'troubleshoot'>('guide');

  if (!isOpen) return null;

  const renderGuide = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">使用指南</h3>
        
        <div className="space-y-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">1. 选择坐标系</h4>
            <p className="text-sm text-gray-600 mb-2">
              根据您的GeoHash数据来源选择正确的坐标系：
            </p>
            <ul className="text-sm text-gray-600 space-y-1 ml-4">
              <li>• <strong>百度09 (BD09)</strong>: 来自百度地图API或百度相关服务</li>
              <li>• <strong>GPS84 (WGS84)</strong>: 来自GPS设备、谷歌地图或其他国际标准服务</li>
            </ul>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">2. 输入GeoHash</h4>
            <p className="text-sm text-gray-600 mb-2">
              在输入框中输入您要转换的GeoHash编码：
            </p>
            <ul className="text-sm text-gray-600 space-y-1 ml-4">
              <li>• <strong>单个模式</strong>: 输入一个GeoHash，如 wx4g0ec1</li>
              <li>• <strong>批量模式</strong>: 输入多个GeoHash，用换行符或逗号分隔</li>
            </ul>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">3. 查看结果</h4>
            <p className="text-sm text-gray-600 mb-2">
              转换完成后，您可以：
            </p>
            <ul className="text-sm text-gray-600 space-y-1 ml-4">
              <li>• 查看转换后的经纬度坐标</li>
              <li>• 复制单个或批量结果到剪贴板</li>
              <li>• 导出结果为CSV文件</li>
              <li>• 查看转换统计信息</li>
            </ul>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">GeoHash格式要求</h3>
        
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">有效字符</h4>
              <div className="font-mono text-sm bg-white p-2 rounded border">
                0123456789bcdefghjkmnpqrstuvwxyz
              </div>
              <p className="text-xs text-gray-500 mt-1">
                不包含: a, i, l, o (避免混淆)
              </p>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">长度与精度</h4>
              <div className="text-sm space-y-1">
                <div>1位: ±2500公里</div>
                <div>5位: ±2.4公里</div>
                <div>8位: ±19米 (推荐)</div>
                <div>12位: ±1.9厘米</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderFAQ = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">常见问题</h3>
      
      {[
        {
          q: '什么是GeoHash？',
          a: 'GeoHash是一种地理编码系统，将二维的经纬度坐标编码为一维的字符串。它具有就近性质，相近的地理位置有相似的GeoHash前缀，便于索引和搜索。'
        },
        {
          q: 'BD09和GPS84坐标系有什么区别？',
          a: 'BD09是百度地图使用的坐标系，基于GCJ02进行了进一步加密。GPS84(WGS84)是国际标准坐标系，被GPS系统和大多数国际地图服务使用。同一地点在不同坐标系下的坐标值会有偏差。'
        },
        {
          q: '为什么转换结果不准确？',
          a: '可能的原因包括：1) GeoHash长度太短导致精度不足；2) 选择了错误的坐标系类型；3) 原始GeoHash数据本身有误。建议使用8位以上的GeoHash以获得米级精度。'
        },
        {
          q: '批量转换有数量限制吗？',
          a: '理论上没有严格限制，但为了保证浏览器性能和用户体验，建议单次处理不超过1000个GeoHash。大量数据会自动分批处理，避免界面卡顿。'
        },
        {
          q: '转换失败怎么办？',
          a: '首先检查GeoHash格式是否正确，确认坐标系选择是否正确。如果仍然失败，可以尝试使用较短的GeoHash前缀，或参考错误提示进行修正。'
        },
        {
          q: '如何提高转换精度？',
          a: '使用更长的GeoHash（8位以上），确保坐标系选择正确，验证原始数据来源的可靠性。避免使用过短的GeoHash，因为它们的精度有限。'
        },
        {
          q: '导出的CSV文件包含什么内容？',
          a: 'CSV文件包含原始GeoHash、转换状态、经纬度坐标、坐标系类型、错误信息（如有）以及转换统计信息，方便后续数据处理和分析。'
        },
        {
          q: '为什么有些字符不能使用？',
          a: 'GeoHash标准排除了容易混淆的字符：a(与0混淆)、i(与1混淆)、l(与1混淆)、o(与0混淆)，以提高可读性和减少输入错误。'
        }
      ].map((item, index) => (
        <div key={index} className="border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">{item.q}</h4>
          <p className="text-sm text-gray-600 leading-relaxed">{item.a}</p>
        </div>
      ))}
    </div>
  );

  const renderTroubleshoot = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">故障排除</h3>
      
      <div className="space-y-4">
        <div className="border border-red-200 bg-red-50 rounded-lg p-4">
          <h4 className="font-medium text-red-800 mb-2">🚨 转换失败</h4>
          <div className="text-sm text-red-700 space-y-2">
            <p><strong>可能原因：</strong></p>
            <ul className="ml-4 space-y-1">
              <li>• GeoHash格式不正确</li>
              <li>• 包含无效字符 (a, i, l, o)</li>
              <li>• 坐标系选择错误</li>
            </ul>
            <p><strong>解决方案：</strong></p>
            <ul className="ml-4 space-y-1">
              <li>• 检查输入格式，参考示例</li>
              <li>• 使用智能验证功能检查错误</li>
              <li>• 尝试应用系统建议的修正</li>
            </ul>
          </div>
        </div>

        <div className="border border-yellow-200 bg-yellow-50 rounded-lg p-4">
          <h4 className="font-medium text-yellow-800 mb-2">⚠️ 精度不足</h4>
          <div className="text-sm text-yellow-700 space-y-2">
            <p><strong>症状：</strong> 转换成功但坐标精度不够</p>
            <p><strong>解决方案：</strong></p>
            <ul className="ml-4 space-y-1">
              <li>• 使用更长的GeoHash（推荐8位以上）</li>
              <li>• 验证原始数据来源</li>
              <li>• 确认坐标系选择正确</li>
            </ul>
          </div>
        </div>

        <div className="border border-blue-200 bg-blue-50 rounded-lg p-4">
          <h4 className="font-medium text-blue-800 mb-2">ℹ️ 批量处理慢</h4>
          <div className="text-sm text-blue-700 space-y-2">
            <p><strong>原因：</strong> 数据量大或浏览器性能限制</p>
            <p><strong>优化建议：</strong></p>
            <ul className="ml-4 space-y-1">
              <li>• 分批处理，每次不超过500个</li>
              <li>• 关闭其他浏览器标签页</li>
              <li>• 使用现代浏览器（Chrome、Firefox、Safari）</li>
            </ul>
          </div>
        </div>

        <div className="border border-green-200 bg-green-50 rounded-lg p-4">
          <h4 className="font-medium text-green-800 mb-2">✅ 复制/导出问题</h4>
          <div className="text-sm text-green-700 space-y-2">
            <p><strong>复制失败：</strong></p>
            <ul className="ml-4 space-y-1">
              <li>• 检查浏览器剪贴板权限</li>
              <li>• 手动选择文本复制</li>
              <li>• 使用Ctrl+C快捷键</li>
            </ul>
            <p><strong>导出失败：</strong></p>
            <ul className="ml-4 space-y-1">
              <li>• 检查浏览器下载设置</li>
              <li>• 确保有足够磁盘空间</li>
              <li>• 尝试减少导出数据量</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-2">🔧 浏览器兼容性</h4>
        <div className="text-sm text-gray-600">
          <p className="mb-2">推荐使用以下浏览器以获得最佳体验：</p>
          <div className="grid grid-cols-2 gap-2">
            <div>• Chrome 80+</div>
            <div>• Firefox 75+</div>
            <div>• Safari 13+</div>
            <div>• Edge 80+</div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        ></div>

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          {/* Header */}
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                使用帮助
              </h2>
              <button
                onClick={onClose}
                className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Tab navigation */}
            <nav className="flex space-x-8 mt-4" aria-label="Tabs">
              {[
                { id: 'guide', label: '使用指南', icon: '📖' },
                { id: 'faq', label: '常见问题', icon: '❓' },
                { id: 'troubleshoot', label: '故障排除', icon: '🔧' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveSection(tab.id as any)}
                  className={`
                    py-2 px-1 border-b-2 font-medium text-sm transition-colors
                    ${activeSection === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 max-h-96 overflow-y-auto">
            {activeSection === 'guide' && renderGuide()}
            {activeSection === 'faq' && renderFAQ()}
            {activeSection === 'troubleshoot' && renderTroubleshoot()}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
            >
              关闭
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpModal;