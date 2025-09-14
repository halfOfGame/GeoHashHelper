import { CoordinateConverter } from '../coordinate-converter';

describe('CoordinateConverter', () => {
  describe('validateCoordinates', () => {
    it('should validate correct coordinates', () => {
      const result1 = CoordinateConverter.validateCoordinates(116.404, 39.915);
      expect(result1.isValid).toBe(true);
      expect(result1.error).toBeUndefined();

      const result2 = CoordinateConverter.validateCoordinates(-180, -90);
      expect(result2.isValid).toBe(true);

      const result3 = CoordinateConverter.validateCoordinates(180, 90);
      expect(result3.isValid).toBe(true);
    });

    it('should reject coordinates out of range', () => {
      const result1 = CoordinateConverter.validateCoordinates(181, 39.915);
      expect(result1.isValid).toBe(false);
      expect(result1.error).toContain('经度');

      const result2 = CoordinateConverter.validateCoordinates(116.404, 91);
      expect(result2.isValid).toBe(false);
      expect(result2.error).toContain('纬度');

      const result3 = CoordinateConverter.validateCoordinates(-181, 39.915);
      expect(result3.isValid).toBe(false);

      const result4 = CoordinateConverter.validateCoordinates(116.404, -91);
      expect(result4.isValid).toBe(false);
    });

    it('should reject non-numeric coordinates', () => {
      const result1 = CoordinateConverter.validateCoordinates(NaN, 39.915);
      expect(result1.isValid).toBe(false);
      expect(result1.error).toContain('NaN');

      const result2 = CoordinateConverter.validateCoordinates(116.404, NaN);
      expect(result2.isValid).toBe(false);

      const result3 = CoordinateConverter.validateCoordinates('116.404' as any, 39.915);
      expect(result3.isValid).toBe(false);
      expect(result3.error).toContain('数字类型');
    });
  });

  describe('controlPrecision', () => {
    it('should control precision to specified decimal places', () => {
      expect(CoordinateConverter.controlPrecision(116.4043751, 6)).toBe(116.404375);
      expect(CoordinateConverter.controlPrecision(116.4043751, 4)).toBe(116.4044);
      expect(CoordinateConverter.controlPrecision(116.4043751, 2)).toBe(116.40);
      expect(CoordinateConverter.controlPrecision(116.4043751)).toBe(116.404375); // default 6
    });

    it('should handle edge cases', () => {
      expect(CoordinateConverter.controlPrecision(0, 6)).toBe(0);
      expect(CoordinateConverter.controlPrecision(-116.4043751, 6)).toBe(-116.404375);
      expect(CoordinateConverter.controlPrecision(116.9999999, 6)).toBe(117);
    });
  });

  describe('bd09ToWgs84', () => {
    it('should convert BD09 coordinates to WGS84', () => {
      // 测试北京天安门广场坐标转换
      // BD09: 116.404, 39.915 -> WGS84: 约 116.391, 39.907
      const result = CoordinateConverter.bd09ToWgs84(116.404, 39.915);
      expect(result).not.toBeNull();
      expect(result!.longitude).toBeCloseTo(116.391, 2);
      expect(result!.latitude).toBeCloseTo(39.907, 2);
    });

    it('should convert Shanghai coordinates correctly', () => {
      // 测试上海外滩坐标转换
      // BD09: 121.499, 31.239 -> WGS84: 约 121.486, 31.231
      const result = CoordinateConverter.bd09ToWgs84(121.499, 31.239);
      expect(result).not.toBeNull();
      expect(result!.longitude).toBeCloseTo(121.486, 2);
      expect(result!.latitude).toBeCloseTo(31.231, 2);
    });

    it('should return null for invalid coordinates', () => {
      expect(CoordinateConverter.bd09ToWgs84(181, 39.915)).toBeNull();
      expect(CoordinateConverter.bd09ToWgs84(116.404, 91)).toBeNull();
      expect(CoordinateConverter.bd09ToWgs84(NaN, 39.915)).toBeNull();
    });

    it('should maintain precision to 6 decimal places', () => {
      const result = CoordinateConverter.bd09ToWgs84(116.404375123456, 39.915123456789);
      expect(result).not.toBeNull();
      
      const lonStr = result!.longitude.toString();
      const latStr = result!.latitude.toString();
      
      const lonDecimals = lonStr.split('.')[1]?.length || 0;
      const latDecimals = latStr.split('.')[1]?.length || 0;
      
      expect(lonDecimals).toBeLessThanOrEqual(6);
      expect(latDecimals).toBeLessThanOrEqual(6);
    });
  });

  describe('wgs84ToBd09', () => {
    it('should convert WGS84 coordinates to BD09', () => {
      // 测试北京天安门广场坐标转换（反向）
      // WGS84: 116.391, 39.907 -> BD09: 约 116.404, 39.915
      const result = CoordinateConverter.wgs84ToBd09(116.391, 39.907);
      expect(result).not.toBeNull();
      expect(result!.longitude).toBeCloseTo(116.404, 2);
      expect(result!.latitude).toBeCloseTo(39.915, 2);
    });

    it('should convert Shanghai coordinates correctly', () => {
      // 测试上海外滩坐标转换（反向）
      // WGS84: 121.486, 31.231 -> BD09: 约 121.499, 31.239
      const result = CoordinateConverter.wgs84ToBd09(121.486, 31.231);
      expect(result).not.toBeNull();
      expect(result!.longitude).toBeCloseTo(121.499, 2);
      expect(result!.latitude).toBeCloseTo(31.239, 2);
    });

    it('should return null for invalid coordinates', () => {
      expect(CoordinateConverter.wgs84ToBd09(181, 39.907)).toBeNull();
      expect(CoordinateConverter.wgs84ToBd09(116.391, 91)).toBeNull();
      expect(CoordinateConverter.wgs84ToBd09(NaN, 39.907)).toBeNull();
    });
  });

  describe('coordinate conversion consistency', () => {
    it('should maintain consistency in round-trip conversions', () => {
      const originalBd09 = { longitude: 116.404, latitude: 39.915 };
      
      // BD09 -> WGS84 -> BD09
      const wgs84Result = CoordinateConverter.bd09ToWgs84(originalBd09.longitude, originalBd09.latitude);
      expect(wgs84Result).not.toBeNull();
      
      const backToBd09 = CoordinateConverter.wgs84ToBd09(wgs84Result!.longitude, wgs84Result!.latitude);
      expect(backToBd09).not.toBeNull();
      
      // 由于精度控制，允许小的误差
      expect(backToBd09!.longitude).toBeCloseTo(originalBd09.longitude, 4);
      expect(backToBd09!.latitude).toBeCloseTo(originalBd09.latitude, 4);
    });

    it('should handle edge coordinates correctly', () => {
      // 测试边界坐标
      const edgeCases = [
        { longitude: 73.66, latitude: 53.55 }, // 中国西北角
        { longitude: 135.05, latitude: 53.55 }, // 中国东北角
        { longitude: 73.66, latitude: 3.86 }, // 中国西南角
        { longitude: 135.05, latitude: 3.86 }, // 中国东南角
      ];

      edgeCases.forEach(coord => {
        const wgs84Result = CoordinateConverter.bd09ToWgs84(coord.longitude, coord.latitude);
        expect(wgs84Result).not.toBeNull();
        expect(wgs84Result!.longitude).toBeGreaterThanOrEqual(-180);
        expect(wgs84Result!.longitude).toBeLessThanOrEqual(180);
        expect(wgs84Result!.latitude).toBeGreaterThanOrEqual(-90);
        expect(wgs84Result!.latitude).toBeLessThanOrEqual(90);
      });
    });
  });
});