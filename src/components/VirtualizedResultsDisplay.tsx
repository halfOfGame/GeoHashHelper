'use client';

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { ConversionResult } from '../lib/conversion-engine';

export interface VirtualizedResultsDisplayProps {
  results: ConversionResult[];
  onCopy: (result: ConversionResult) => void;
  onCopyAll: () => void;
  onExport: () => void;
  itemHeight?: number;
  containerHeight?: number;
  overscan?: number;
}

type SortField = 'input' | 'longitude' | 'latitude' | 'success';
type SortDirection = 'asc' | 'desc';
type FilterType = 'all' | 'success' | 'error';

interface VirtualItem {
  index: number;
  result: ConversionResult;
  top: number;
  height: number;
}

const VirtualizedResultsDisplay: React.FC<VirtualizedResultsDisplayProps> = ({
  results,
  onCopy,
  onCopyAll,
  onExport,
  itemHeight = 60,
  containerHeight = 400,
  overscan = 5,
}) => {
  const [sortField, setSortField] = useState<SortField>('input');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [filter, setFilter] = useState<FilterType>('all');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [scrollTop, setScrollTop] = useState(0);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollElementRef = useRef<HTMLDivElement>(null);

  // Filter and sort results
  const filteredAndSortedResults = useMemo(() => {
    let filtered = results;

    // Apply filter
    if (filter === 'success') {
      filtered = results.filter(result => result.success);
    } else if (filter === 'error') {
      filtered = results.filter(result => !result.success);
    }

    // Apply sort
    return filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'input':
          aValue = a.input.toLowerCase();
          bValue = b.input.toLowerCase();
          break;
        case 'longitude':
          aValue = a.longitude ?? (a.success ? 0 : -Infinity);
          bValue = b.longitude ?? (b.success ? 0 : -Infinity);
          break;
        case 'latitude':
          aValue = a.latitude ?? (a.success ? 0 : -Infinity);
          bValue = b.latitude ?? (b.success ? 0 : -Infinity);
          break;
        case 'success':
          aValue = a.success ? 1 : 0;
          bValue = b.success ? 1 : 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [results, sortField, sortDirection, filter]);

  // Calculate visible items
  const visibleItems = useMemo(() => {
    const totalHeight = filteredAndSortedResults.length * itemHeight;
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + overscan,
      filteredAndSortedResults.length
    );
    
    const visibleStartIndex = Math.max(0, startIndex - overscan);
    const items: VirtualItem[] = [];
    
    for (let i = visibleStartIndex; i < endIndex; i++) {
      if (filteredAndSortedResults[i]) {
        items.push({
          index: i,
          result: filteredAndSortedResults[i],
          top: i * itemHeight,
          height: itemHeight,
        });
      }
    }
    
    return {
      items,
      totalHeight,
      offsetY: visibleStartIndex * itemHeight,
    };
  }, [filteredAndSortedResults, scrollTop, itemHeight, containerHeight, overscan]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleCopy = async (result: ConversionResult, index: number) => {
    onCopy(result);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleCopyAll = () => {
    onCopyAll();
    setCopiedIndex(-1);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    
    return sortDirection === 'asc' ? (
      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  const successCount = results.filter(r => r.success).length;
  const errorCount = results.filter(r => !r.success).length;

  // Performance indicator
  const shouldUseVirtualization = results.length > 100;

  if (results.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <p className="text-gray-500">暂无转换结果</p>
        <p className="text-sm text-gray-400 mt-2">输入GeoHash编码并点击转换按钮开始</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Performance Notice */}
      {shouldUseVirtualization && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center text-sm text-green-800">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            已启用虚拟化渲染以优化大批量数据显示性能
          </div>
        </div>
      )}

      {/* Summary and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-4 text-sm">
          <span className="text-gray-600">
            总计: <span className="font-medium">{results.length.toLocaleString()}</span>
          </span>
          <span className="text-green-600">
            成功: <span className="font-medium">{successCount.toLocaleString()}</span>
          </span>
          {errorCount > 0 && (
            <span className="text-red-600">
              失败: <span className="font-medium">{errorCount.toLocaleString()}</span>
            </span>
          )}
          <span className="text-blue-600">
            显示: <span className="font-medium">{filteredAndSortedResults.length.toLocaleString()}</span>
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {/* Filter */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as FilterType)}
            className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">全部结果</option>
            <option value="success">仅成功</option>
            <option value="error">仅失败</option>
          </select>

          {/* Copy All Button */}
          {successCount > 0 && (
            <button
              onClick={handleCopyAll}
              className="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {copiedIndex === -1 ? '已复制!' : '复制全部'}
            </button>
          )}

          {/* Export Button */}
          <button
            onClick={onExport}
            className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            导出CSV
          </button>
        </div>
      </div>

      {/* Virtualized Results Table */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-5 gap-4 px-4 py-3">
            <button
              onClick={() => handleSort('input')}
              className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider hover:bg-gray-100 rounded px-2 py-1 flex items-center space-x-1"
            >
              <span>输入GeoHash</span>
              {getSortIcon('input')}
            </button>
            <button
              onClick={() => handleSort('success')}
              className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider hover:bg-gray-100 rounded px-2 py-1 flex items-center space-x-1"
            >
              <span>状态</span>
              {getSortIcon('success')}
            </button>
            <button
              onClick={() => handleSort('longitude')}
              className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider hover:bg-gray-100 rounded px-2 py-1 flex items-center space-x-1"
            >
              <span>经度</span>
              {getSortIcon('longitude')}
            </button>
            <button
              onClick={() => handleSort('latitude')}
              className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider hover:bg-gray-100 rounded px-2 py-1 flex items-center space-x-1"
            >
              <span>纬度</span>
              {getSortIcon('latitude')}
            </button>
            <div className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-2 py-1">
              操作
            </div>
          </div>
        </div>

        {/* Virtual Scroll Container */}
        <div
          ref={containerRef}
          className="relative overflow-auto"
          style={{ height: containerHeight }}
          onScroll={handleScroll}
        >
          <div style={{ height: visibleItems.totalHeight, position: 'relative' }}>
            <div
              style={{
                transform: `translateY(${visibleItems.offsetY}px)`,
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
              }}
            >
              {visibleItems.items.map((item) => (
                <div
                  key={`${item.result.input}-${item.index}`}
                  className={`grid grid-cols-5 gap-4 px-4 py-3 border-b border-gray-100 hover:bg-gray-50 ${
                    item.result.success ? '' : 'bg-red-50'
                  }`}
                  style={{ height: itemHeight }}
                >
                  <div className="text-sm font-mono text-gray-900 truncate">
                    {item.result.input}
                  </div>
                  <div className="text-sm">
                    {item.result.success ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        成功
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        失败
                      </span>
                    )}
                  </div>
                  <div className="text-sm font-mono text-gray-900 truncate">
                    {item.result.success && item.result.longitude !== undefined
                      ? item.result.longitude.toFixed(6)
                      : item.result.error || '-'}
                  </div>
                  <div className="text-sm font-mono text-gray-900 truncate">
                    {item.result.success && item.result.latitude !== undefined
                      ? item.result.latitude.toFixed(6)
                      : '-'}
                  </div>
                  <div className="text-sm">
                    {item.result.success ? (
                      <button
                        onClick={() => handleCopy(item.result, item.index)}
                        className="text-blue-600 hover:text-blue-800 text-xs underline"
                      >
                        {copiedIndex === item.index ? '已复制!' : '复制'}
                      </button>
                    ) : (
                      <span className="text-gray-400 text-xs">-</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {filteredAndSortedResults.length === 0 && results.length > 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>没有符合筛选条件的结果</p>
        </div>
      )}
    </div>
  );
};

export default VirtualizedResultsDisplay;