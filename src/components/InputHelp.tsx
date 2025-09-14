/**
 * 输入帮助组件
 * 提供GeoHash格式示例、使用说明和常见问题解答
 */

'use client';

import React, { useState } from 'react';

interface InputHelpProps {
  coordinateSystem: 'BD09' | 'GPS84';
  isBatchMode: boolean;
  className?: string;
}

const InputHelp: React.FC<InputHelpProps> = ({
  coordinateSystem,
  isBatchMode,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState<'examples' | 'format' | 'faq'>('examples');

  // GeoHash示例数据
  const geohashExamples = {
    BD09: [
      { geohash: 'wx4g0ec1', description: '北京天安门广场附近', lat: 39.9042, lng: 116.4074 },
      { geohash: 'wtw3sjq6', description: '上海外滩附近', lat: 31.2304, lng: 121.4737 },
      { geohash: 'ws10578h', description: '广州塔附近', lat: 23.1291, lng: 113.3240 },
      { geohash: 'wm6n2j8r', description: '深圳平安大厦附近', lat: 22.5431, lng: 114.0579 }
    ],
    GPS84: [
      { geohash: 'wx4g0b8q', description: '北京天安门广场附近 (WGS84)', lat: 39.9042, lng: 116.4074 },
      { geohash: 'wtw3s7qs', description: '上海外滩附近 (WGS84)', lat: 31.2304, lng: 121.4737 },
      { geohash: 'ws105dxp', description: '广州塔附近 (WGS84)', lat: 23.1291, lng: 113.3240 },
      { geohash: 'wm6n2gb5', description: '深圳平安大厦附近 (WGS84)', lat: 22.5431, lng: 114.0579 }
    ]
  };

  const currentExamples = geohashExamples[coordinateSystem];

  const formatRules = [
    {
      title: '字符要求',
      rules: [
        'GeoHash只能包含以下字符: 0-9, b-z',
        '不能包含字母: a, i, l, o (容易混淆)',
        '大小写不敏感，建议使用小写'
      ]
    },
    {
      title: '长度要求',
      rules: [
        '最短1位，最长12位',
        '长度越长，精度越高',
        '8位精度约为19米，适合大多数应用'
      ]
    },
    {
      title: '精度对照',
      rules: [
        '1位: ±2500公里',
        '3位: ±78公里',
        '5位: ±2.4公里',
        '8位: ±19米',
        '12位: ±0.037米'
      ]
    }
  ];

  const faqItems = [
    {
      question: '什么是GeoHash？',
      answer: 'GeoHash是一种地理编码系统，将经纬度坐标编码为短字符串。它具有就近性质，相近的地理位置有相似的GeoHash前缀。'
    },
    {
      question: 'BD09和GPS84坐标系有什么区别？',
      answer: 'BD09是百度地图使用的坐标系，GPS84是国际标准坐标系。同一地点在不同坐标系下的坐标值会有偏差，需要进行转换。'
    },
    {
      question: '为什么转换结果不准确？',
      answer: '可能原因：1) GeoHash长度太短导致精度不足；2) 坐标系选择错误；3) 原始GeoHash数据有误。建议使用8位以上的GeoHash。'
    },
    {
      question: '批量转换有数量限制吗？',
      answer: '理论上没有严格限制，但为了保证性能，建议单次处理不超过1000个GeoHash。大量数据会分批处理。'
    },
    {
      question: '转换失败怎么办？',
      answer: '1) 检查GeoHash格式是否正确；2) 确认坐标系选择是否正确；3) 尝试使用较短的GeoHash前缀；4) 参考错误提示进行修正。'
    },
    {
      question: '如何提高转换精度？',
      answer: '1) 使用更长的GeoHash（8位以上）；2) 确保坐标系选择正确；3) 验证原始数据来源的可靠性。'
    }
  ];

  const handleExampleClick = (geohash: string) => {
    // 触发自定义事件，让父组件知道用户选择了示例
    const event = new CustomEvent('selectExample', { detail: { geohash } });
    window.dispatchEvent(event);
  };

  const renderExamples = () => (
    <div className="space-y-4">
      <div className="text-sm text-gray-600 mb-3">
        点击下方示例可快速填入输入框：
      </div>
      <div className="grid gap-3">
        {currentExamples.map((example, index) => (
          <div
            key={index}
            className="border border-gray-200 rounded-lg p-3 hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-colors"
            onClick={() => handleExampleClick(example.geohash)}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="font-mono text-sm font-medium text-blue-600 mb-1">
                  {example.geohash}
                </div>
                <div className="text-sm text-gray-600 mb-1">
                  {example.description}
                </div>
                <div className="text-xs text-gray-500">
                  约 {example.lat.toFixed(4)}, {example.lng.toFixed(4)}
                </div>
              </div>
              <div className="ml-3">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isBatchMode && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-sm font-medium text-blue-800 mb-2">
            批量输入示例：
          </div>
          <div className="font-mono text-xs text-blue-700 bg-white p-2 rounded border">
            {currentExamples.slice(0, 3).map(ex => ex.geohash).join('\n')}
          </div>
          <div className="text-xs text-blue-600 mt-2">
            支持换行符或逗号分隔多个GeoHash
          </div>
        </div>
      )}
    </div>
  );

  const renderFormat = () => (
    <div className="space-y-4">
      {formatRules.map((section, index) => (
        <div key={index} className="border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-3">{section.title}</h4>
          <ul className="space-y-2">
            {section.rules.map((rule, ruleIndex) => (
              <li key={ruleIndex} className="flex items-start text-sm text-gray-600">
                <span className="inline-block w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                <span>{rule}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <div>
            <div className="text-sm font-medium text-yellow-800 mb-1">
              注意事项
            </div>
            <div className="text-sm text-yellow-700">
              不同坐标系下的同一地点会有不同的GeoHash值，请确保选择正确的坐标系类型。
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderFAQ = () => (
    <div className="space-y-4">
      {faqItems.map((item, index) => (
        <div key={index} className="border border-gray-200 rounded-lg">
          <div className="p-4">
            <h4 className="font-medium text-gray-900 mb-2">
              {item.question}
            </h4>
            <p className="text-sm text-gray-600 leading-relaxed">
              {item.answer}
            </p>
          </div>
        </div>
      ))}
    </div>
  );

  const tabs = [
    { id: 'examples', label: '示例', icon: '📍' },
    { id: 'format', label: '格式说明', icon: '📋' },
    { id: 'faq', label: '常见问题', icon: '❓' }
  ] as const;

  return (
    <div className={`bg-white border border-gray-200 rounded-lg ${className}`}>
      {/* Tab Headers */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-4" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                py-3 px-1 border-b-2 font-medium text-sm transition-colors
                ${activeTab === tab.id
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

      {/* Tab Content */}
      <div className="p-4">
        {activeTab === 'examples' && renderExamples()}
        {activeTab === 'format' && renderFormat()}
        {activeTab === 'faq' && renderFAQ()}
      </div>
    </div>
  );
};

export default InputHelp;