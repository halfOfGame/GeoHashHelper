'use client';

import React, { useState, useMemo } from 'react';

export interface ConversionResult {
  input: string;
  success: boolean;
  longitude?: number;
  latitude?: number;
  error?: string;
  coordinateSystem: 'BD09' | 'GPS84';
}

export interface ResultsDisplayProps {
  results: ConversionResult[];
  onCopy: (result: ConversionResult) => void;
  onCopyAll: () => void;
  onExport: () => void;
}

type SortField = 'input' | 'longitude' | 'latitude' | 'success';
type SortDirection = 'asc' | 'desc';
type FilterType = 'all' | 'success' | 'error';

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({
  results,
  onCopy,
  onCopyAll,
  onExport,
}) => {
  const [sortField, setSortField] = useState<SortField>('input');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [filter, setFilter] = useState<FilterType>('all');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

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
    setCopiedIndex(-1); // Special index for "copy all"
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
      {/* Summary and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-4 text-sm">
          <span className="text-gray-600">
            总计: <span className="font-medium">{results.length}</span>
          </span>
          <span className="text-green-600">
            成功: <span className="font-medium">{successCount}</span>
          </span>
          {errorCount > 0 && (
            <span className="text-red-600">
              失败: <span className="font-medium">{errorCount}</span>
            </span>
          )}
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

      {/* Results Table */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                onClick={() => handleSort('input')}
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              >
                <div className="flex items-center space-x-1">
                  <span>输入GeoHash</span>
                  {getSortIcon('input')}
                </div>
              </th>
              <th
                onClick={() => handleSort('success')}
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              >
                <div className="flex items-center space-x-1">
                  <span>状态</span>
                  {getSortIcon('success')}
                </div>
              </th>
              <th
                onClick={() => handleSort('longitude')}
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              >
                <div className="flex items-center space-x-1">
                  <span>经度</span>
                  {getSortIcon('longitude')}
                </div>
              </th>
              <th
                onClick={() => handleSort('latitude')}
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              >
                <div className="flex items-center space-x-1">
                  <span>纬度</span>
                  {getSortIcon('latitude')}
                </div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredAndSortedResults.map((result, index) => (
              <tr
                key={`${result.input}-${index}`}
                className={`hover:bg-gray-50 ${
                  result.success ? '' : 'bg-red-50'
                }`}
              >
                <td className="px-4 py-3 text-sm font-mono text-gray-900">
                  {result.input}
                </td>
                <td className="px-4 py-3 text-sm">
                  {result.success ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      成功
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      失败
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm font-mono text-gray-900">
                  {result.success && result.longitude !== undefined
                    ? result.longitude.toFixed(6)
                    : result.error || '-'}
                </td>
                <td className="px-4 py-3 text-sm font-mono text-gray-900">
                  {result.success && result.latitude !== undefined
                    ? result.latitude.toFixed(6)
                    : '-'}
                </td>
                <td className="px-4 py-3 text-sm">
                  {result.success ? (
                    <button
                      onClick={() => handleCopy(result, index)}
                      className="text-blue-600 hover:text-blue-800 text-xs underline"
                    >
                      {copiedIndex === index ? '已复制!' : '复制'}
                    </button>
                  ) : (
                    <span className="text-gray-400 text-xs">-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredAndSortedResults.length === 0 && results.length > 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>没有符合筛选条件的结果</p>
        </div>
      )}
    </div>
  );
};

export default ResultsDisplay;