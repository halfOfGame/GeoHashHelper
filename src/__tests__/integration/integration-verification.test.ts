/**
 * 集成验证测试
 * 验证所有功能模块的集成状态和数据流
 */

import { ConversionEngine } from '../../lib/conversion-engine';
import { GeoHashDecoder } from '../../lib/geohash-decoder';
import { CoordinateConverter } from '../../lib/coordinate-converter';
import { InputValidator } from '../../lib/input-validator';
import { BatchProcessor } from '../../lib/batch-processor';
import { OptimizedBatchProcessor } from '../../lib/optimized-batch-processor';
import { ErrorHandler } from '../../lib/error-handler';
import { ErrorType } from '../../types/error-types';

describe('Integration Verification Tests', () => {
  describe('Core Algorithm Integration', () => {
    it('should integrate geohash decoder with coordinate converter correctly', () => {
      // Test BD09 coordinate system
      const result = ConversionEngine.convertSingle('wx4g0ec1', 'BD09');
      
      expect(result.success).toBe(true);
      expect(result.input).toBe('wx4g0ec1');
      expect(result.coordinateSystem).toBe('BD09');
      expect(typeof result.longitude).toBe('number');
      expect(typeof result.latitude).toBe('number');
    });

    it('should integrate geohash decoder with GPS84 conversion correctly', () => {
      const result = ConversionEngine.convertSingle('wx4g0ec1', 'GPS84');
      
      expect(result.success).toBe(true);
      expect(result.coordinateSystem).toBe('GPS84');
      expect(typeof result.longitude).toBe('number');
      expect(typeof result.latitude).toBe('number');
    });
  });

  describe('Validation and Processing Integration', () => {
    it('should integrate input validator with batch processor', () => {
      const input = 'wx4g0ec1\nwx4g0ec2\ninvalid\nwx4g0ec3';
      const batchResult = BatchProcessor.processBatchInput(input);
      
      expect(batchResult.validGeohashes).toHaveLength(3);
      expect(batchResult.invalidInputs).toHaveLength(1);
      expect(batchResult.duplicates).toHaveLength(0);
    });
  });
});