/**
 * 批量输入处理器
 * 支持换行符和逗号分隔的geohash批量输入处理
 */

import { validateGeohash, sanitizeGeohash, ValidationResult } from './input-validator';

export interface BatchInputItem {
  original: string;
  cleaned: string;
  lineNumber: number;
  validation: ValidationResult;
}

export interface BatchProcessResult {
  items: BatchInputItem[];
  totalCount: number;
  validCount: number;
  invalidCount: number;
  duplicateCount: number;
  emptyCount: number;
}

/**
 * 解析批量输入文本，支持换行符和逗号分隔
 */
export function parseBatchInput(input: string): string[] {
  if (!input || input.trim().length === 0) {
    return [];
  }

  // 首先按换行符分割
  const lines = input.split(/\r?\n/);
  const allItems: string[] = [];

  // 对每行再按逗号分割
  lines.forEach(line => {
    if (line.trim()) {
      // 按逗号分割，同时处理可能的空白字符
      const items = line.split(',').map(item => item.trim()).filter(item => item.length > 0);
      allItems.push(...items);
    }
  });

  return allItems;
}

/**
 * 清理和去重批量输入数据
 */
export function cleanAndDeduplicateInput(items: string[]): string[] {
  const cleaned = items.map(item => sanitizeGeohash(item)).filter(item => item.length > 0);
  
  // 使用Set去重，保持原始顺序
  const seen = new Set<string>();
  const deduplicated: string[] = [];
  
  cleaned.forEach(item => {
    if (!seen.has(item)) {
      seen.add(item);
      deduplicated.push(item);
    }
  });
  
  return deduplicated;
}

/**
 * 处理批量输入，返回详细的处理结果
 */
export function processBatchInput(input: string): BatchProcessResult {
  const rawItems = parseBatchInput(input);
  const processedItems: BatchInputItem[] = [];
  
  let lineNumber = 1;
  let emptyCount = 0;
  
  // 处理每个原始输入项
  rawItems.forEach((original, index) => {
    if (original.trim().length === 0) {
      emptyCount++;
      return;
    }
    
    const cleaned = sanitizeGeohash(original);
    const validation = validateGeohash(cleaned);
    
    processedItems.push({
      original,
      cleaned,
      lineNumber: lineNumber++,
      validation
    });
  });
  
  // 统计信息
  const validItems = processedItems.filter(item => item.validation.isValid);
  const invalidItems = processedItems.filter(item => !item.validation.isValid);
  
  // 检测重复项
  const cleanedValues = validItems.map(item => item.cleaned);
  const uniqueValues = new Set(cleanedValues);
  const duplicateCount = cleanedValues.length - uniqueValues.size;
  
  return {
    items: processedItems,
    totalCount: rawItems.length,
    validCount: validItems.length,
    invalidCount: invalidItems.length,
    duplicateCount,
    emptyCount
  };
}

/**
 * 获取去重后的有效geohash列表
 */
export function getValidUniqueGeohashes(batchResult: BatchProcessResult): string[] {
  const validItems = batchResult.items.filter(item => item.validation.isValid);
  return cleanAndDeduplicateInput(validItems.map(item => item.cleaned));
}

/**
 * 格式化批量处理统计信息
 */
export function formatBatchStats(result: BatchProcessResult): string {
  const { totalCount, validCount, invalidCount, duplicateCount, emptyCount } = result;
  
  const stats = [];
  stats.push(`总计: ${totalCount}项`);
  
  if (validCount > 0) {
    stats.push(`有效: ${validCount}项`);
  }
  
  if (invalidCount > 0) {
    stats.push(`无效: ${invalidCount}项`);
  }
  
  if (duplicateCount > 0) {
    stats.push(`重复: ${duplicateCount}项`);
  }
  
  if (emptyCount > 0) {
    stats.push(`空白: ${emptyCount}项`);
  }
  
  return stats.join(', ');
}

/**
 * 检查批量输入是否超过建议的处理限制
 */
export function checkBatchSizeLimit(items: string[], maxSize: number = 1000): {
  withinLimit: boolean;
  count: number;
  maxSize: number;
  warning?: string;
} {
  const count = items.length;
  const withinLimit = count <= maxSize;
  
  return {
    withinLimit,
    count,
    maxSize,
    warning: withinLimit ? undefined : `输入项数量(${count})超过建议限制(${maxSize})，可能影响性能`
  };
}

/**
 * 生成批量输入示例
 */
export function getBatchInputExamples(): {
  commaDelimited: string;
  lineDelimited: string;
  mixed: string;
} {
  return {
    commaDelimited: 'wx4g0ec1, wx4g0ec2, wx4g0ec3',
    lineDelimited: `wx4g0ec1
wx4g0ec2
wx4g0ec3`,
    mixed: `wx4g0ec1, wx4g0ec2
wx4g0ec3
wx4g0ec4, wx4g0ec5`
  };
}