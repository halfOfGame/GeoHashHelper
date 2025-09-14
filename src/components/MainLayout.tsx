'use client';

import React, { useState } from 'react';
import InputSection from './InputSection';
import ResultsDisplay, { ConversionResult } from './ResultsDisplay';
import HelpModal from './HelpModal';
import ErrorBoundary from './ErrorBoundary';
import ErrorNotification from './ErrorNotification';
import { ConversionEngine } from '../lib/conversion-engine';
import { processBatchInput, getValidUniqueGeohashes } from '../lib/batch-processor';
import { ErrorProvider, useErrorHandler } from '../lib/error-context';
import { ErrorHandler } from '../lib/error-handler';
import { ErrorType } from '../types/error-types';

const MainLayoutContent: React.FC = () => {
  const [inputValue, setInputValue] = useState('');
  const [coordinateSystem, setCoordinateSystem] = useState<'BD09' | 'GPS84'>('BD09');
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [results, setResults] = useState<ConversionResult[]>([]);
  const [conversionProgress, setConversionProgress] = useState<{
    current: number;
    total: number;
    message: string;
  } | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<{
    type: 'single' | 'batch';
    message: string;
  } | null>(null);
  const [showHelpModal, setShowHelpModal] = useState(false);

  const { handleSystemError, handleBatchError } = useErrorHandler();

  const handleConvert = async () => {
    if (!inputValue.trim()) {
      return;
    }

    setIsConverting(true);
    setConversionProgress(null);
    setResults([]);

    try {
      if (isBatchMode) {
        // 批量处理模式
        setConversionProgress({
          current: 0,
          total: 0,
          message: '正在解析输入...'
        });

        // 解析和验证批量输入
        const batchResult = processBatchInput(inputValue);
        const validGeohashes = getValidUniqueGeohashes(batchResult);

        if (validGeohashes.length === 0) {
          setResults([]);
          setIsConverting(false);
          setConversionProgress(null);
          return;
        }

        setConversionProgress({
          current: 0,
          total: validGeohashes.length,
          message: `开始转换 ${validGeohashes.length} 个GeoHash...`
        });

        // 分批处理以避免UI阻塞
        const batchSize = 50;
        const allResults: ConversionResult[] = [];

        for (let i = 0; i < validGeohashes.length; i += batchSize) {
          const batch = validGeohashes.slice(i, i + batchSize);
          
          // 更新进度
          setConversionProgress({
            current: i,
            total: validGeohashes.length,
            message: `正在转换第 ${i + 1}-${Math.min(i + batchSize, validGeohashes.length)} 个...`
          });

          // 处理当前批次
          const batchResults = batch.map(geohash => 
            ConversionEngine.convertSingle(geohash, coordinateSystem)
          );
          
          allResults.push(...batchResults);

          // 让UI有机会更新
          await new Promise(resolve => setTimeout(resolve, 10));
        }

        setResults(allResults);
        setConversionProgress({
          current: validGeohashes.length,
          total: validGeohashes.length,
          message: `转换完成！成功 ${allResults.filter(r => r.success).length} 个，失败 ${allResults.filter(r => !r.success).length} 个`
        });

        // 3秒后隐藏进度信息
        setTimeout(() => setConversionProgress(null), 3000);

      } else {
        // 单个转换模式
        setConversionProgress({
          current: 0,
          total: 1,
          message: '正在转换...'
        });

        const result = ConversionEngine.convertSingle(inputValue.trim(), coordinateSystem);
        setResults([result]);

        setConversionProgress({
          current: 1,
          total: 1,
          message: result.success ? '转换成功！' : '转换失败'
        });

        // 2秒后隐藏进度信息
        setTimeout(() => setConversionProgress(null), 2000);
      }

    } catch (error) {
      console.error('Conversion error:', error);
      
      // 使用错误处理器处理系统错误
      const systemError = ErrorHandler.handleSystemError(
        ErrorType.UNKNOWN_ERROR,
        error instanceof Error ? error : new Error('Unknown conversion error'),
        {
          component: 'MainLayout',
          action: 'convert',
          userInput: inputValue
        }
      );
      handleSystemError(systemError);
      
      setResults([]);
      setConversionProgress({
        current: 0,
        total: 0,
        message: '转换过程中发生错误，请重试'
      });
      setTimeout(() => setConversionProgress(null), 3000);
    } finally {
      setIsConverting(false);
    }
  };

  const handleCopy = async (result: ConversionResult) => {
    if (result.success && result.longitude !== undefined && result.latitude !== undefined) {
      const copyText = `${result.longitude.toFixed(6)},${result.latitude.toFixed(6)}`;
      try {
        await navigator.clipboard.writeText(copyText);
        setCopyFeedback({
          type: 'single',
          message: `已复制: ${copyText}`
        });
        setTimeout(() => setCopyFeedback(null), 3000);
      } catch (err) {
        console.error('Failed to copy:', err);
        
        // 使用错误处理器处理剪贴板错误
        const clipboardError = ErrorHandler.handleSystemError(
          ErrorType.CLIPBOARD_ERROR,
          err instanceof Error ? err : new Error('Clipboard access failed')
        );
        handleSystemError(clipboardError);
        
        setCopyFeedback({
          type: 'single',
          message: '复制失败，请手动选择文本复制'
        });
        setTimeout(() => setCopyFeedback(null), 3000);
      }
    }
  };

  const handleCopyAll = async () => {
    const successResults = results.filter(r => r.success);
    if (successResults.length === 0) {
      setCopyFeedback({
        type: 'batch',
        message: '没有可复制的成功结果'
      });
      setTimeout(() => setCopyFeedback(null), 3000);
      return;
    }

    const copyText = successResults
      .map(r => `${r.input},${r.longitude!.toFixed(6)},${r.latitude!.toFixed(6)}`)
      .join('\n');
    
    try {
      await navigator.clipboard.writeText(copyText);
      setCopyFeedback({
        type: 'batch',
        message: `已复制 ${successResults.length} 个结果到剪贴板`
      });
      setTimeout(() => setCopyFeedback(null), 3000);
    } catch (err) {
      console.error('Failed to copy all:', err);
      
      // 使用错误处理器处理剪贴板错误
      const clipboardError = ErrorHandler.handleSystemError(
        ErrorType.CLIPBOARD_ERROR,
        err instanceof Error ? err : new Error('Batch clipboard access failed')
      );
      handleSystemError(clipboardError);
      
      setCopyFeedback({
        type: 'batch',
        message: '批量复制失败，请尝试单个复制'
      });
      setTimeout(() => setCopyFeedback(null), 3000);
    }
  };

  const handleExport = async () => {
    if (results.length === 0) {
      setCopyFeedback({
        type: 'batch',
        message: '没有可导出的结果'
      });
      setTimeout(() => setCopyFeedback(null), 3000);
      return;
    }

    try {
      // 显示导出进度
      setCopyFeedback({
        type: 'batch',
        message: '正在准备导出文件...'
      });

      // 准备CSV内容，包含所有结果（成功和失败）
      const headers = ['输入GeoHash', '转换状态', '经度', '纬度', '坐标系', '错误信息'];
      const csvRows = [headers.join(',')];

      results.forEach(result => {
        const row = [
          `"${result.input}"`,
          result.success ? '成功' : '失败',
          result.success && result.longitude !== undefined ? result.longitude.toFixed(6) : '',
          result.success && result.latitude !== undefined ? result.latitude.toFixed(6) : '',
          result.coordinateSystem === 'BD09' ? '百度09' : 'GPS84',
          result.error ? `"${result.error}"` : ''
        ];
        csvRows.push(row.join(','));
      });

      // 添加统计信息
      const successCount = results.filter(r => r.success).length;
      const errorCount = results.filter(r => !r.success).length;
      csvRows.push(''); // 空行
      csvRows.push('统计信息');
      csvRows.push(`总计,${results.length}`);
      csvRows.push(`成功,${successCount}`);
      csvRows.push(`失败,${errorCount}`);
      csvRows.push(`导出时间,"${new Date().toLocaleString('zh-CN')}"`);

      const csvContent = csvRows.join('\n');

      // 创建并下载文件
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const filename = `geohash_conversion_${timestamp}.csv`;
      
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // 清理URL对象
      URL.revokeObjectURL(url);

      // 显示成功消息
      setCopyFeedback({
        type: 'batch',
        message: `导出完成！文件名: ${filename}`
      });
      setTimeout(() => setCopyFeedback(null), 5000);

    } catch (error) {
      console.error('Export error:', error);
      
      // 使用错误处理器处理文件导出错误
      const exportError = ErrorHandler.handleSystemError(
        ErrorType.FILE_EXPORT_ERROR,
        error instanceof Error ? error : new Error('File export failed')
      );
      handleSystemError(exportError);
      
      setCopyFeedback({
        type: 'batch',
        message: '导出失败，请重试'
      });
      setTimeout(() => setCopyFeedback(null), 3000);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Header Section */}
        <header className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            GeoHash坐标转换工具
          </h1>
          <p className="text-base sm:text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
            支持百度09坐标系和GPS84坐标系下的GeoHash编码转换为经纬度坐标，
            提供单个和批量转换功能，支持结果导出
          </p>
        </header>

        {/* Main Content Area */}
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            {/* Input Section */}
            <div className="p-6 sm:p-8 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">
                输入GeoHash编码
              </h2>
              <InputSection
                value={inputValue}
                onChange={setInputValue}
                coordinateSystem={coordinateSystem}
                onCoordinateSystemChange={setCoordinateSystem}
                isBatchMode={isBatchMode}
                onBatchModeChange={setIsBatchMode}
                onConvert={handleConvert}
                isConverting={isConverting}
                conversionProgress={conversionProgress}
              />
            </div>

            {/* Results Section */}
            <div className="p-6 sm:p-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">
                转换结果
              </h2>
              <ResultsDisplay
                results={results}
                onCopy={handleCopy}
                onCopyAll={handleCopyAll}
                onExport={handleExport}
              />
            </div>
          </div>

          {/* Copy Feedback */}
          {copyFeedback && (
            <div className="mt-4 max-w-6xl mx-auto">
              <div className="bg-green-50 border border-green-200 rounded-md p-3">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm text-green-800">{copyFeedback.message}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="text-center mt-12 text-sm text-gray-500">
          <div className="flex items-center justify-center space-x-4">
            <p>
              使用说明：输入有效的GeoHash编码，选择对应的坐标系，点击转换按钮获取经纬度坐标
            </p>
            <button
              onClick={() => setShowHelpModal(true)}
              className="text-blue-600 hover:text-blue-800 underline"
            >
              详细帮助
            </button>
          </div>
        </footer>
      </div>

      {/* Help Modal */}
      <HelpModal
        isOpen={showHelpModal}
        onClose={() => setShowHelpModal(false)}
      />

      {/* Error Notification */}
      <ErrorNotification />
    </main>
  );
};

// 主布局组件，包装错误边界和错误上下文
const MainLayout: React.FC = () => {
  return (
    <ErrorProvider>
      <ErrorBoundary>
        <MainLayoutContent />
      </ErrorBoundary>
    </ErrorProvider>
  );
};

export default MainLayout;