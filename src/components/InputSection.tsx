'use client';

import React, { useState, useEffect } from 'react';
import InputHelp from './InputHelp';
import SmartInputValidator from './SmartInputValidator';

export interface ConversionProgress {
  current: number;
  total: number;
  message: string;
}

export interface InputSectionProps {
  value: string;
  onChange: (value: string) => void;
  coordinateSystem: 'BD09' | 'GPS84';
  onCoordinateSystemChange: (system: 'BD09' | 'GPS84') => void;
  isBatchMode: boolean;
  onBatchModeChange: (isBatch: boolean) => void;
  onConvert: () => void;
  isConverting?: boolean;
  conversionProgress?: ConversionProgress | null;
}

const InputSection: React.FC<InputSectionProps> = ({
  value,
  onChange,
  coordinateSystem,
  onCoordinateSystemChange,
  isBatchMode,
  onBatchModeChange,
  onConvert,
  isConverting = false,
  conversionProgress = null,
}) => {
  const [showHelp, setShowHelp] = useState(false);
  const [showValidator, setShowValidator] = useState(false);

  // 监听示例选择事件
  useEffect(() => {
    const handleSelectExample = (event: CustomEvent) => {
      const { geohash } = event.detail;
      if (isBatchMode) {
        // 批量模式：添加到现有内容
        const newValue = value ? `${value}\n${geohash}` : geohash;
        onChange(newValue);
      } else {
        // 单个模式：替换内容
        onChange(geohash);
      }
    };

    const handleApplyCorrection = (event: CustomEvent) => {
      const { correctedValue } = event.detail;
      onChange(correctedValue);
    };

    window.addEventListener('selectExample', handleSelectExample as EventListener);
    window.addEventListener('applyCorrection', handleApplyCorrection as EventListener);

    return () => {
      window.removeEventListener('selectExample', handleSelectExample as EventListener);
      window.removeEventListener('applyCorrection', handleApplyCorrection as EventListener);
    };
  }, [value, isBatchMode, onChange]);

  // 当输入内容变化时，自动显示验证器
  useEffect(() => {
    setShowValidator(value.trim().length > 0);
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className="space-y-6">
      {/* Coordinate System Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          选择坐标系
        </label>
        <div className="flex space-x-4">
          <label className="flex items-center">
            <input
              type="radio"
              name="coordinateSystem"
              value="BD09"
              checked={coordinateSystem === 'BD09'}
              onChange={(e) => onCoordinateSystemChange(e.target.value as 'BD09')}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
            />
            <span className="ml-2 text-sm text-gray-700">百度09坐标系 (BD09)</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="coordinateSystem"
              value="GPS84"
              checked={coordinateSystem === 'GPS84'}
              onChange={(e) => onCoordinateSystemChange(e.target.value as 'GPS84')}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
            />
            <span className="ml-2 text-sm text-gray-700">GPS84坐标系 (WGS84)</span>
          </label>
        </div>
      </div>

      {/* Batch Mode Toggle */}
      <div>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={isBatchMode}
            onChange={(e) => onBatchModeChange(e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <span className="ml-2 text-sm text-gray-700">批量模式</span>
          <span className="ml-2 text-xs text-gray-500">
            (支持多个GeoHash，用换行符或逗号分隔)
          </span>
        </label>
      </div>

      {/* Input Area */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            {isBatchMode ? '输入多个GeoHash编码' : '输入GeoHash编码'}
          </label>
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={() => setShowValidator(!showValidator)}
              className="text-xs text-green-600 hover:text-green-800 underline"
            >
              {showValidator ? '隐藏验证' : '显示验证'}
            </button>
            <button
              type="button"
              onClick={() => setShowHelp(!showHelp)}
              className="text-xs text-blue-600 hover:text-blue-800 underline"
            >
              {showHelp ? '隐藏帮助' : '显示帮助'}
            </button>
          </div>
        </div>
        
        <textarea
          value={value}
          onChange={handleInputChange}
          placeholder={
            isBatchMode
              ? `输入多个GeoHash编码，例如：\nwx4g0ec19\nwx4g0ec1b\n或用逗号分隔：wx4g0ec19,wx4g0ec1b`
              : '输入单个GeoHash编码，例如：wx4g0ec19'
          }
          rows={isBatchMode ? 6 : 3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical"
        />
        
        {/* Character count for batch mode */}
        {isBatchMode && value && (
          <div className="mt-1 text-xs text-gray-500">
            输入长度: {value.length} 字符
            {value.split(/[\n,]/).filter(line => line.trim().length > 0).length > 1 && (
              <span className="ml-2">
                • 共 {value.split(/[\n,]/).filter(line => line.trim().length > 0).length} 个项目
              </span>
            )}
          </div>
        )}
      </div>

      {/* Smart Input Validator */}
      {showValidator && value.trim() && (
        <SmartInputValidator
          value={value}
          isBatchMode={isBatchMode}
          coordinateSystem={coordinateSystem}
          className="mt-3"
        />
      )}

      {/* Help Section */}
      {showHelp && (
        <InputHelp
          coordinateSystem={coordinateSystem}
          isBatchMode={isBatchMode}
          className="mt-4"
        />
      )}

      {/* Convert Button */}
      <div className="flex justify-center">
        <button
          onClick={onConvert}
          disabled={!value.trim() || isConverting}
          className={`px-8 py-3 rounded-md font-medium text-white transition-colors ${
            !value.trim() || isConverting
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
          }`}
        >
          {isConverting ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              转换中...
            </span>
          ) : (
            '开始转换'
          )}
        </button>
      </div>

      {/* Progress Indicator */}
      {conversionProgress && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-800">
              {conversionProgress.message}
            </span>
            {conversionProgress.total > 0 && (
              <span className="text-sm text-blue-600">
                {conversionProgress.current}/{conversionProgress.total}
              </span>
            )}
          </div>
          
          {conversionProgress.total > 1 && (
            <div className="w-full bg-blue-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                style={{
                  width: `${conversionProgress.total > 0 ? (conversionProgress.current / conversionProgress.total) * 100 : 0}%`
                }}
              ></div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default InputSection;