import { ConversionEngine, ConversionErrorType } from '../conversion-engine';

describe('ConversionEngine', () => {
  describe('convertSingle', () => {
    it('should convert BD09 geohash successfully', () => {
      const result = ConversionEngine.convertSingle('wx4g0ec1', 'BD09');
      
      expect(result.success).toBe(true);
      expect(result.input).toBe('wx4g0ec1');
      expect(result.coordinateSystem).toBe('BD09');
      expect(result.longitude).toBeDefined();
      expect(result.latitude).toBeDefined();
      expect(result.error).toBeUndefined();
      
      // 验证坐标范围
      expect(result.longitude!).toBeGreaterThanOrEqual(-180);
      expect(result.longitude!).toBeLessThanOrEqual(180);
      expect(result.latitude!).toBeGreaterThanOrEqual(-90);
      expect(result.latitude!).toBeLessThanOrEqual(90);
    });

    it('should convert GPS84 geohash successfully', () => {
      const result = ConversionEngine.convertSingle('9q9hvu', 'GPS84');
      
      expect(result.success).toBe(true);
      expect(result.input).toBe('9q9hvu');
      expect(result.coordinateSystem).toBe('GPS84');
      expect(result.longitude).toBeDefined();
      expect(result.latitude).toBeDefined();
      expect(result.error).toBeUndefined();
    });

    it('should handle invalid geohash format', () => {
      const result = ConversionEngine.convertSingle('invalid', 'BD09');
      
      expect(result.success).toBe(false);
      expect(result.input).toBe('invalid');
      expect(result.coordinateSystem).toBe('BD09');
      expect(result.longitude).toBeUndefined();
      expect(result.latitude).toBeUndefined();
      expect(result.error).toContain('无效的geohash格式');
    });

    it('should handle empty geohash', () => {
      const result = ConversionEngine.convertSingle('', 'BD09');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('无效的geohash格式');
    });

    it('should handle geohash with invalid characters', () => {
      const result = ConversionEngine.convertSingle('wx4g0ec1o', 'BD09'); // 'o' is invalid
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('无效的geohash格式');
    });
  });

  describe('convertBatch', () => {
    it('should convert multiple valid geohashes', () => {
      const geohashList = ['wx4g0ec1', '9q9hvu', 'u4pruydq'];
      const result = ConversionEngine.convertBatch(geohashList, 'BD09');
      
      expect(result.totalCount).toBe(3);
      expect(result.successCount).toBe(3);
      expect(result.errorCount).toBe(0);
      expect(result.results).toHaveLength(3);
      expect(result.processingTime).toBeGreaterThan(0);
      
      result.results.forEach(res => {
        expect(res.success).toBe(true);
        expect(res.longitude).toBeDefined();
        expect(res.latitude).toBeDefined();
      });
    });

    it('should handle mixed valid and invalid geohashes', () => {
      const geohashList = ['wx4g0ec1', 'invalid', '9q9hvu', ''];
      const result = ConversionEngine.convertBatch(geohashList, 'GPS84');
      
      expect(result.totalCount).toBe(4);
      expect(result.successCount).toBe(2);
      expect(result.errorCount).toBe(2);
      expect(result.results).toHaveLength(4);
      
      // 检查成功的结果
      const successResults = result.results.filter(r => r.success);
      expect(successResults).toHaveLength(2);
      successResults.forEach(res => {
        expect(res.longitude).toBeDefined();
        expect(res.latitude).toBeDefined();
      });
      
      // 检查失败的结果
      const errorResults = result.results.filter(r => !r.success);
      expect(errorResults).toHaveLength(2);
      errorResults.forEach(res => {
        expect(res.error).toBeDefined();
      });
    });

    it('should handle empty array', () => {
      const result = ConversionEngine.convertBatch([], 'BD09');
      
      expect(result.totalCount).toBe(0);
      expect(result.successCount).toBe(0);
      expect(result.errorCount).toBe(0);
      expect(result.results).toHaveLength(0);
    });
  });

  describe('parseInput', () => {
    it('should parse comma-separated input', () => {
      const input = 'wx4g0ec1,9q9hvu,u4pruydq';
      const result = ConversionEngine.parseInput(input);
      
      expect(result).toEqual(['wx4g0ec1', '9q9hvu', 'u4pruydq']);
    });

    it('should parse newline-separated input', () => {
      const input = 'wx4g0ec1\n9q9hvu\nu4pruydq';
      const result = ConversionEngine.parseInput(input);
      
      expect(result).toEqual(['wx4g0ec1', '9q9hvu', 'u4pruydq']);
    });

    it('should parse mixed separators and handle whitespace', () => {
      const input = ' wx4g0ec1 , 9q9hvu \n u4pruydq ';
      const result = ConversionEngine.parseInput(input);
      
      expect(result).toEqual(['wx4g0ec1', '9q9hvu', 'u4pruydq']);
    });

    it('should remove duplicates', () => {
      const input = 'wx4g0ec1,wx4g0ec1,9q9hvu,wx4g0ec1';
      const result = ConversionEngine.parseInput(input);
      
      expect(result).toEqual(['wx4g0ec1', '9q9hvu']);
    });

    it('should filter out empty strings', () => {
      const input = 'wx4g0ec1,,9q9hvu,\n,u4pruydq';
      const result = ConversionEngine.parseInput(input);
      
      expect(result).toEqual(['wx4g0ec1', '9q9hvu', 'u4pruydq']);
    });

    it('should handle null and undefined input', () => {
      expect(ConversionEngine.parseInput(null as any)).toEqual([]);
      expect(ConversionEngine.parseInput(undefined as any)).toEqual([]);
      expect(ConversionEngine.parseInput('')).toEqual([]);
    });
  });

  describe('formatResultsAsCSV', () => {
    it('should format successful results as CSV', () => {
      const results = [
        {
          input: 'wx4g0ec1',
          success: true,
          longitude: 116.391234,
          latitude: 39.907123,
          coordinateSystem: 'BD09' as const
        },
        {
          input: '9q9hvu',
          success: true,
          longitude: -122.419416,
          latitude: 37.774929,
          coordinateSystem: 'GPS84' as const
        }
      ];
      
      const csv = ConversionEngine.formatResultsAsCSV(results);
      const lines = csv.split('\n');
      
      expect(lines).toHaveLength(3); // header + 2 data rows
      expect(lines[0]).toBe('输入GeoHash,转换状态,经度,纬度,坐标系,错误信息');
      expect(lines[1]).toContain('"wx4g0ec1"');
      expect(lines[1]).toContain('成功');
      expect(lines[1]).toContain('116.391234');
      expect(lines[1]).toContain('百度09');
      expect(lines[2]).toContain('"9q9hvu"');
      expect(lines[2]).toContain('GPS84');
    });

    it('should format failed results as CSV', () => {
      const results = [
        {
          input: 'invalid',
          success: false,
          coordinateSystem: 'BD09' as const,
          error: '无效的geohash格式'
        }
      ];
      
      const csv = ConversionEngine.formatResultsAsCSV(results);
      const lines = csv.split('\n');
      
      expect(lines).toHaveLength(2); // header + 1 data row
      expect(lines[1]).toContain('"invalid"');
      expect(lines[1]).toContain('失败');
      expect(lines[1]).toContain('"无效的geohash格式"');
    });
  });

  describe('generateSummary', () => {
    it('should generate correct summary for successful batch', () => {
      const batchResult = {
        results: [],
        totalCount: 10,
        successCount: 8,
        errorCount: 2,
        processingTime: 150
      };
      
      const summary = ConversionEngine.generateSummary(batchResult);
      
      expect(summary).toContain('总计: 10 个');
      expect(summary).toContain('成功: 8 个');
      expect(summary).toContain('失败: 2 个');
      expect(summary).toContain('成功率: 80.0%');
      expect(summary).toContain('处理时间: 150ms');
    });

    it('should handle zero total count', () => {
      const batchResult = {
        results: [],
        totalCount: 0,
        successCount: 0,
        errorCount: 0,
        processingTime: 5
      };
      
      const summary = ConversionEngine.generateSummary(batchResult);
      
      expect(summary).toContain('总计: 0 个');
      expect(summary).toContain('成功率: 0%');
    });
  });

  describe('integration tests', () => {
    it('should handle complete workflow from input to CSV export', () => {
      const input = 'wx4g0ec1,invalid,9q9hvu';
      
      // 解析输入
      const geohashList = ConversionEngine.parseInput(input);
      expect(geohashList).toHaveLength(3);
      
      // 批量转换
      const batchResult = ConversionEngine.convertBatch(geohashList, 'BD09');
      expect(batchResult.totalCount).toBe(3);
      expect(batchResult.successCount).toBe(2);
      expect(batchResult.errorCount).toBe(1);
      
      // 生成CSV
      const csv = ConversionEngine.formatResultsAsCSV(batchResult.results);
      expect(csv).toContain('wx4g0ec1');
      expect(csv).toContain('invalid');
      expect(csv).toContain('9q9hvu');
      
      // 生成摘要
      const summary = ConversionEngine.generateSummary(batchResult);
      expect(summary).toContain('总计: 3 个');
      expect(summary).toContain('成功: 2 个');
    });

    it('should maintain coordinate system consistency', () => {
      const geohash = 'wx4g0ec1';
      
      const bd09Result = ConversionEngine.convertSingle(geohash, 'BD09');
      const gps84Result = ConversionEngine.convertSingle(geohash, 'GPS84');
      
      expect(bd09Result.success).toBe(true);
      expect(gps84Result.success).toBe(true);
      
      // BD09转换后的坐标应该与GPS84直接解码的坐标不同
      expect(bd09Result.longitude).not.toEqual(gps84Result.longitude);
      expect(bd09Result.latitude).not.toEqual(gps84Result.latitude);
      
      // 但都应该在有效范围内
      [bd09Result, gps84Result].forEach(result => {
        expect(result.longitude!).toBeGreaterThanOrEqual(-180);
        expect(result.longitude!).toBeLessThanOrEqual(180);
        expect(result.latitude!).toBeGreaterThanOrEqual(-90);
        expect(result.latitude!).toBeLessThanOrEqual(90);
      });
    });
  });
});