'use client';

import React from 'react';
import { BatchProgress } from '../lib/optimized-batch-processor';

export interface BatchProgressIndicatorProps {
  progress: BatchProgress | null;
  isProcessing: boolean;
  onCancel?: () => void;
}

const BatchProgressIndicator: React.FC<BatchProgressIndicatorProps> = ({
  progress,
  isProcessing,
  onCancel,
}) => {
  if (!isProcessing && !progress) {
    return null;
  }

  const formatTime = (seconds: number): string => {
    if (seconds < 60) {
      return `${Math.round(seconds)}秒`;
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = Math.round(seconds % 60);
      return `${minutes}分${remainingSeconds}秒`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return `${hours}小时${minutes}分钟`;
    }
  };

  const formatMemory = (mb: number): string => {
    if (mb < 1) {
      return `${Math.round(mb * 1024)}KB`;
    } else if (mb < 1024) {
      return `${mb.toFixed(1)}MB`;
    } else {
      return `${(mb / 1024).toFixed(1)}GB`;
    }
  };

  const formatRate = (rate: number): string => {
    if (rate < 1) {
      return `${(rate * 60).toFixed(1)}/分钟`;
    } else if (rate < 60) {
      return `${rate.toFixed(1)}/秒`;
    } else {
      return `${(rate / 60).toFixed(1)}K/秒`;
    }
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-blue-900">批量处理进度</h3>
        {onCancel && (
          <button
            onClick={onCancel}
            className="text-xs text-red-600 hover:text-red-800 underline"
          >
            取消处理
          </button>
        )}
      </div>

      {progress && (
        <>
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">
                已处理: {progress.processed.toLocaleString()} / {progress.total.toLocaleString()}
              </span>
              <span className="font-medium text-blue-600">
                {progress.percentage.toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${Math.min(progress.percentage, 100)}%` }}
              />
            </div>
          </div>

          {/* Detailed Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="bg-white rounded p-2">
              <div className="text-gray-500">当前分块</div>
              <div className="font-medium">
                {progress.currentChunk} / {progress.totalChunks}
              </div>
            </div>
            
            <div className="bg-white rounded p-2">
              <div className="text-gray-500">处理速度</div>
              <div className="font-medium">
                {formatRate(progress.processingRate)}
              </div>
            </div>
            
            <div className="bg-white rounded p-2">
              <div className="text-gray-500">预计剩余</div>
              <div className="font-medium">
                {progress.estimatedTimeRemaining > 0 
                  ? formatTime(progress.estimatedTimeRemaining)
                  : '计算中...'
                }
              </div>
            </div>
            
            {progress.memoryUsage !== undefined && (
              <div className="bg-white rounded p-2">
                <div className="text-gray-500">内存使用</div>
                <div className="font-medium">
                  {formatMemory(progress.memoryUsage)}
                </div>
              </div>
            )}
          </div>

          {/* Performance Indicators */}
          <div className="flex items-center space-x-4 text-xs">
            {progress.processingRate > 100 && (
              <div className="flex items-center text-green-600">
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                高速处理
              </div>
            )}
            
            {progress.processingRate < 10 && (
              <div className="flex items-center text-yellow-600">
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                处理较慢
              </div>
            )}
            
            {progress.memoryUsage !== undefined && progress.memoryUsage > 100 && (
              <div className="flex items-center text-orange-600">
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                内存使用较高
              </div>
            )}
          </div>
        </>
      )}

      {/* Loading State */}
      {isProcessing && !progress && (
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span className="text-sm text-gray-600">正在初始化批量处理...</span>
        </div>
      )}
    </div>
  );
};

export default BatchProgressIndicator;