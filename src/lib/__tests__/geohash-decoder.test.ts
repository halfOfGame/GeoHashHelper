import { GeoHashDecoder } from '../geohash-decoder';

describe('GeoHashDecoder', () => {
  describe('validate', () => {
    it('should validate correct geohash strings', () => {
      expect(GeoHashDecoder.validate('wx4g0ec1')).toBe(true);
      expect(GeoHashDecoder.validate('9q9hvu')).toBe(true);
      expect(GeoHashDecoder.validate('u4pruydqqvj')).toBe(true);
      expect(GeoHashDecoder.validate('s')).toBe(true);
    });

    it('should reject invalid geohash strings', () => {
      expect(GeoHashDecoder.validate('')).toBe(false);
      expect(GeoHashDecoder.validate('invalid')).toBe(false); // contains 'i', 'a', 'l'
      expect(GeoHashDecoder.validate('wx4g0ec1o')).toBe(false); // contains 'o'
      expect(GeoHashDecoder.validate('1234567890123')).toBe(false); // too long
    });

    it('should handle null and undefined inputs', () => {
      expect(GeoHashDecoder.validate(null as any)).toBe(false);
      expect(GeoHashDecoder.validate(undefined as any)).toBe(false);
    });
  });

  describe('decode', () => {
    it('should decode known geohash values correctly', () => {
      // 测试北京天安门广场附近的geohash
      const result1 = GeoHashDecoder.decode('wx4g0ec1');
      expect(result1).not.toBeNull();
      expect(result1!.latitude).toBeCloseTo(39.90625, 3);
      expect(result1!.longitude).toBeCloseTo(116.39404, 3);

      // 测试上海外滩附近的geohash
      const result2 = GeoHashDecoder.decode('wtw3sjq6');
      expect(result2).not.toBeNull();
      expect(result2!.latitude).toBeCloseTo(31.23047, 3);
      expect(result2!.longitude).toBeCloseTo(121.47461, 3);
    });

    it('should handle different geohash lengths', () => {
      // 短geohash（精度较低）
      const shortResult = GeoHashDecoder.decode('wx4');
      expect(shortResult).not.toBeNull();
      expect(typeof shortResult!.latitude).toBe('number');
      expect(typeof shortResult!.longitude).toBe('number');

      // 长geohash（精度较高）
      const longResult = GeoHashDecoder.decode('wx4g0ec19y');
      expect(longResult).not.toBeNull();
      expect(typeof longResult!.latitude).toBe('number');
      expect(typeof longResult!.longitude).toBe('number');
    });

    it('should return null for invalid geohash', () => {
      expect(GeoHashDecoder.decode('invalid')).toBeNull();
      expect(GeoHashDecoder.decode('')).toBeNull();
      expect(GeoHashDecoder.decode('wx4g0ec1o')).toBeNull();
    });

    it('should handle case insensitive input', () => {
      const lowerResult = GeoHashDecoder.decode('wx4g0ec1');
      const upperResult = GeoHashDecoder.decode('WX4G0EC1');
      const mixedResult = GeoHashDecoder.decode('Wx4G0eC1');

      expect(lowerResult).toEqual(upperResult);
      expect(lowerResult).toEqual(mixedResult);
    });

    it('should return coordinates within valid ranges', () => {
      const testCases = [
        'wx4g0ec1',
        '9q9hvu',
        'u4pruydq',
        'gbsuv',
        'c216ne'
      ];

      testCases.forEach(geohash => {
        const result = GeoHashDecoder.decode(geohash);
        expect(result).not.toBeNull();
        expect(result!.latitude).toBeGreaterThanOrEqual(-90);
        expect(result!.latitude).toBeLessThanOrEqual(90);
        expect(result!.longitude).toBeGreaterThanOrEqual(-180);
        expect(result!.longitude).toBeLessThanOrEqual(180);
      });
    });

    it('should maintain precision to 6 decimal places', () => {
      const result = GeoHashDecoder.decode('wx4g0ec1');
      expect(result).not.toBeNull();
      
      // 检查小数位数不超过6位
      const latDecimals = result!.latitude.toString().split('.')[1]?.length || 0;
      const lonDecimals = result!.longitude.toString().split('.')[1]?.length || 0;
      
      expect(latDecimals).toBeLessThanOrEqual(6);
      expect(lonDecimals).toBeLessThanOrEqual(6);
    });
  });
});