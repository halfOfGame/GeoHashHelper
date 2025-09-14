import {
  parseBatchInput,
  cleanAndDeduplicateInput,
  processBatchInput,
  getValidUniqueGeohashes,
  formatBatchStats,
  checkBatchSizeLimit,
  getBatchInputExamples,
  BatchProcessResult
} from '../batch-processor';

describe('parseBatchInput', () => {
  test('应该解析换行符分隔的输入', () => {
    const input = `wx4g0ec1
wx4g0ec2
wx4g0ec3`;
    const result = parseBatchInput(input);
    expect(result).toEqual(['wx4g0ec1', 'wx4g0ec2', 'wx4g0ec3']);
  });

  test('应该解析逗号分隔的输入', () => {
    const input = 'wx4g0ec1, wx4g0ec2, wx4g0ec3';
    const result = parseBatchInput(input);
    expect(result).toEqual(['wx4g0ec1', 'wx4g0ec2', 'wx4g0ec3']);
  });

  test('应该解析混合分隔符的输入', () => {
    const input = `wx4g0ec1, wx4g0ec2
wx4g0ec3
wx4g0ec4, wx4g0ec5`;
    const result = parseBatchInput(input);
    expect(result).toEqual(['wx4g0ec1', 'wx4g0ec2', 'wx4g0ec3', 'wx4g0ec4', 'wx4g0ec5']);
  });

  test('应该处理空行和空白字符', () => {
    const input = `wx4g0ec1

  wx4g0ec2  
  
wx4g0ec3`;
    const result = parseBatchInput(input);
    expect(result).toEqual(['wx4g0ec1', 'wx4g0ec2', 'wx4g0ec3']);
  });

  test('应该处理空输入', () => {
    expect(parseBatchInput('')).toEqual([]);
    expect(parseBatchInput('   ')).toEqual([]);
    expect(parseBatchInput('\n\n')).toEqual([]);
  });

  test('应该处理Windows和Unix换行符', () => {
    const windowsInput = 'wx4g0ec1\r\nwx4g0ec2\r\nwx4g0ec3';
    const unixInput = 'wx4g0ec1\nwx4g0ec2\nwx4g0ec3';
    
    expect(parseBatchInput(windowsInput)).toEqual(['wx4g0ec1', 'wx4g0ec2', 'wx4g0ec3']);
    expect(parseBatchInput(unixInput)).toEqual(['wx4g0ec1', 'wx4g0ec2', 'wx4g0ec3']);
  });
});

describe('cleanAndDeduplicateInput', () => {
  test('应该清理和标准化输入', () => {
    const input = ['  WX4G0EC1  ', 'wx4g0ec2', '  WX4G0EC3  '];
    const result = cleanAndDeduplicateInput(input);
    expect(result).toEqual(['wx4g0ec1', 'wx4g0ec2', 'wx4g0ec3']);
  });

  test('应该去除重复项', () => {
    const input = ['wx4g0ec1', 'wx4g0ec2', 'wx4g0ec1', 'wx4g0ec3', 'wx4g0ec2'];
    const result = cleanAndDeduplicateInput(input);
    expect(result).toEqual(['wx4g0ec1', 'wx4g0ec2', 'wx4g0ec3']);
  });

  test('应该过滤空字符串', () => {
    const input = ['wx4g0ec1', '', '  ', 'wx4g0ec2'];
    const result = cleanAndDeduplicateInput(input);
    expect(result).toEqual(['wx4g0ec1', 'wx4g0ec2']);
  });

  test('应该保持原始顺序', () => {
    const input = ['wx4g0ec3', 'wx4g0ec1', 'wx4g0ec2'];
    const result = cleanAndDeduplicateInput(input);
    expect(result).toEqual(['wx4g0ec3', 'wx4g0ec1', 'wx4g0ec2']);
  });
});

describe('processBatchInput', () => {
  test('应该处理有效的批量输入', () => {
    const input = `wx4g0ec1
wx4g0ec2
wx4g0ec3`;
    const result = processBatchInput(input);
    
    expect(result.totalCount).toBe(3);
    expect(result.validCount).toBe(3);
    expect(result.invalidCount).toBe(0);
    expect(result.duplicateCount).toBe(0);
    expect(result.items).toHaveLength(3);
    
    result.items.forEach(item => {
      expect(item.validation.isValid).toBe(true);
    });
  });

  test('应该处理包含无效项的批量输入', () => {
    const input = `wx4g0ec1
invalid_geohash
wx4g0ec3`;
    const result = processBatchInput(input);
    
    expect(result.totalCount).toBe(3);
    expect(result.validCount).toBe(2);
    expect(result.invalidCount).toBe(1);
    expect(result.items[1].validation.isValid).toBe(false);
  });

  test('应该检测重复项', () => {
    const input = `wx4g0ec1
wx4g0ec2
wx4g0ec1
wx4g0ec3`;
    const result = processBatchInput(input);
    
    expect(result.totalCount).toBe(4);
    expect(result.validCount).toBe(4);
    expect(result.duplicateCount).toBe(1);
  });

  test('应该统计空白项', () => {
    const input = `wx4g0ec1

wx4g0ec2
  
wx4g0ec3`;
    const result = processBatchInput(input);
    
    expect(result.totalCount).toBe(5);
    expect(result.validCount).toBe(3);
    expect(result.emptyCount).toBe(2);
  });

  test('应该处理混合格式输入', () => {
    const input = `wx4g0ec1, wx4g0ec2
invalid_item
wx4g0ec3, wx4g0ec1`;
    const result = processBatchInput(input);
    
    expect(result.totalCount).toBe(5);
    expect(result.validCount).toBe(4);
    expect(result.invalidCount).toBe(1);
    expect(result.duplicateCount).toBe(1);
  });
});

describe('getValidUniqueGeohashes', () => {
  test('应该返回有效且唯一的geohash列表', () => {
    const batchResult: BatchProcessResult = {
      items: [
        { original: 'wx4g0ec1', cleaned: 'wx4g0ec1', lineNumber: 1, validation: { isValid: true } },
        { original: 'invalid', cleaned: 'invalid', lineNumber: 2, validation: { isValid: false, error: 'Invalid' } },
        { original: 'wx4g0ec2', cleaned: 'wx4g0ec2', lineNumber: 3, validation: { isValid: true } },
        { original: 'wx4g0ec1', cleaned: 'wx4g0ec1', lineNumber: 4, validation: { isValid: true } }
      ],
      totalCount: 4,
      validCount: 3,
      invalidCount: 1,
      duplicateCount: 1,
      emptyCount: 0
    };
    
    const result = getValidUniqueGeohashes(batchResult);
    expect(result).toEqual(['wx4g0ec1', 'wx4g0ec2']);
  });
});

describe('formatBatchStats', () => {
  test('应该格式化批量处理统计信息', () => {
    const result: BatchProcessResult = {
      items: [],
      totalCount: 10,
      validCount: 7,
      invalidCount: 2,
      duplicateCount: 1,
      emptyCount: 0
    };
    
    const formatted = formatBatchStats(result);
    expect(formatted).toBe('总计: 10项, 有效: 7项, 无效: 2项, 重复: 1项');
  });

  test('应该处理只有总计的情况', () => {
    const result: BatchProcessResult = {
      items: [],
      totalCount: 5,
      validCount: 5,
      invalidCount: 0,
      duplicateCount: 0,
      emptyCount: 0
    };
    
    const formatted = formatBatchStats(result);
    expect(formatted).toBe('总计: 5项, 有效: 5项');
  });

  test('应该包含空白项统计', () => {
    const result: BatchProcessResult = {
      items: [],
      totalCount: 8,
      validCount: 5,
      invalidCount: 1,
      duplicateCount: 0,
      emptyCount: 2
    };
    
    const formatted = formatBatchStats(result);
    expect(formatted).toBe('总计: 8项, 有效: 5项, 无效: 1项, 空白: 2项');
  });
});

describe('checkBatchSizeLimit', () => {
  test('应该检查批量大小限制', () => {
    const smallBatch = ['wx4g0ec1', 'wx4g0ec2'];
    const result = checkBatchSizeLimit(smallBatch, 1000);
    
    expect(result.withinLimit).toBe(true);
    expect(result.count).toBe(2);
    expect(result.maxSize).toBe(1000);
    expect(result.warning).toBeUndefined();
  });

  test('应该警告超过限制的批量', () => {
    const largeBatch = new Array(1500).fill('wx4g0ec1');
    const result = checkBatchSizeLimit(largeBatch, 1000);
    
    expect(result.withinLimit).toBe(false);
    expect(result.count).toBe(1500);
    expect(result.maxSize).toBe(1000);
    expect(result.warning).toContain('输入项数量(1500)超过建议限制(1000)');
  });

  test('应该使用默认限制', () => {
    const batch = new Array(500).fill('wx4g0ec1');
    const result = checkBatchSizeLimit(batch);
    
    expect(result.maxSize).toBe(1000);
    expect(result.withinLimit).toBe(true);
  });
});

describe('getBatchInputExamples', () => {
  test('应该返回批量输入示例', () => {
    const examples = getBatchInputExamples();
    
    expect(examples.commaDelimited).toContain('wx4g0ec1, wx4g0ec2');
    expect(examples.lineDelimited).toContain('wx4g0ec1\nwx4g0ec2');
    expect(examples.mixed).toContain('wx4g0ec1, wx4g0ec2\nwx4g0ec3');
  });
});