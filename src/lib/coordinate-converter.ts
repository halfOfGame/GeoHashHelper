/**
 * 坐标系转换器
 * 实现BD09到GPS84坐标转换功能，包括坐标边界验证和精度控制
 */

// 坐标转换常数
const X_PI = (3.14159265358979324 * 3000.0) / 180.0;
const PI = 3.1415926535897932384626;
const A = 6378245.0;
const EE = 0.00669342162296594323;

export interface CoordinatePoint {
  longitude: number;
  latitude: number;
}

export interface CoordinateValidationResult {
  isValid: boolean;
  error?: string;
}

export class CoordinateConverter {
  /**
   * 验证坐标是否在有效范围内
   * @param longitude - 经度
   * @param latitude - 纬度
   * @returns 验证结果
   */
  static validateCoordinates(longitude: number, latitude: number): CoordinateValidationResult {
    if (typeof longitude !== 'number' || typeof latitude !== 'number') {
      return {
        isValid: false,
        error: '坐标必须为数字类型'
      };
    }

    if (isNaN(longitude) || isNaN(latitude)) {
      return {
        isValid: false,
        error: '坐标不能为NaN'
      };
    }

    if (longitude < -180 || longitude > 180) {
      return {
        isValid: false,
        error: '经度必须在-180到180度之间'
      };
    }

    if (latitude < -90 || latitude > 90) {
      return {
        isValid: false,
        error: '纬度必须在-90到90度之间'
      };
    }

    return { isValid: true };
  }

  /**
   * 控制坐标精度到指定小数位数
   * @param coordinate - 坐标值
   * @param precision - 精度（小数位数），默认6位
   * @returns 精度控制后的坐标值
   */
  static controlPrecision(coordinate: number, precision: number = 6): number {
    const factor = Math.pow(10, precision);
    return Math.round(coordinate * factor) / factor;
  }

  /**
   * BD09坐标系转换为GCJ02坐标系
   * @param longitude - BD09经度
   * @param latitude - BD09纬度
   * @returns GCJ02坐标点
   */
  private static bd09ToGcj02(longitude: number, latitude: number): CoordinatePoint {
    const x = longitude - 0.0065;
    const y = latitude - 0.006;
    const z = Math.sqrt(x * x + y * y) - 0.00002 * Math.sin(y * X_PI);
    const theta = Math.atan2(y, x) - 0.000003 * Math.cos(x * X_PI);
    
    const gcjLon = z * Math.cos(theta);
    const gcjLat = z * Math.sin(theta);
    
    return {
      longitude: gcjLon,
      latitude: gcjLat
    };
  }

  /**
   * GCJ02坐标系转换为WGS84坐标系
   * @param longitude - GCJ02经度
   * @param latitude - GCJ02纬度
   * @returns WGS84坐标点
   */
  private static gcj02ToWgs84(longitude: number, latitude: number): CoordinatePoint {
    const dlat = this.transformLat(longitude - 105.0, latitude - 35.0);
    const dlng = this.transformLng(longitude - 105.0, latitude - 35.0);
    
    const radlat = (latitude / 180.0) * PI;
    let magic = Math.sin(radlat);
    magic = 1 - EE * magic * magic;
    const sqrtmagic = Math.sqrt(magic);
    
    const dlat2 = (dlat * 180.0) / ((A * (1 - EE)) / (magic * sqrtmagic) * PI);
    const dlng2 = (dlng * 180.0) / (A / sqrtmagic * Math.cos(radlat) * PI);
    
    const mglat = latitude - dlat2;
    const mglng = longitude - dlng2;
    
    return {
      longitude: mglng,
      latitude: mglat
    };
  }

  /**
   * 纬度转换辅助函数
   */
  private static transformLat(lng: number, lat: number): number {
    let ret = -100.0 + 2.0 * lng + 3.0 * lat + 0.2 * lat * lat + 
              0.1 * lng * lat + 0.2 * Math.sqrt(Math.abs(lng));
    ret += (20.0 * Math.sin(6.0 * lng * PI) + 20.0 * Math.sin(2.0 * lng * PI)) * 2.0 / 3.0;
    ret += (20.0 * Math.sin(lat * PI) + 40.0 * Math.sin(lat / 3.0 * PI)) * 2.0 / 3.0;
    ret += (160.0 * Math.sin(lat / 12.0 * PI) + 320 * Math.sin(lat * PI / 30.0)) * 2.0 / 3.0;
    return ret;
  }

  /**
   * 经度转换辅助函数
   */
  private static transformLng(lng: number, lat: number): number {
    let ret = 300.0 + lng + 2.0 * lat + 0.1 * lng * lng + 
              0.1 * lng * lat + 0.1 * Math.sqrt(Math.abs(lng));
    ret += (20.0 * Math.sin(6.0 * lng * PI) + 20.0 * Math.sin(2.0 * lng * PI)) * 2.0 / 3.0;
    ret += (20.0 * Math.sin(lng * PI) + 40.0 * Math.sin(lng / 3.0 * PI)) * 2.0 / 3.0;
    ret += (150.0 * Math.sin(lng / 12.0 * PI) + 300.0 * Math.sin(lng / 30.0 * PI)) * 2.0 / 3.0;
    return ret;
  }

  /**
   * BD09坐标系转换为WGS84坐标系（GPS84）
   * @param longitude - BD09经度
   * @param latitude - BD09纬度
   * @returns WGS84坐标点或null（如果输入无效）
   */
  static bd09ToWgs84(longitude: number, latitude: number): CoordinatePoint | null {
    // 验证输入坐标
    const validation = this.validateCoordinates(longitude, latitude);
    if (!validation.isValid) {
      return null;
    }

    // BD09 -> GCJ02 -> WGS84
    const gcj02Point = this.bd09ToGcj02(longitude, latitude);
    const wgs84Point = this.gcj02ToWgs84(gcj02Point.longitude, gcj02Point.latitude);

    // 控制精度
    return {
      longitude: this.controlPrecision(wgs84Point.longitude),
      latitude: this.controlPrecision(wgs84Point.latitude)
    };
  }

  /**
   * WGS84坐标系转换为BD09坐标系
   * @param longitude - WGS84经度
   * @param latitude - WGS84纬度
   * @returns BD09坐标点或null（如果输入无效）
   */
  static wgs84ToBd09(longitude: number, latitude: number): CoordinatePoint | null {
    // 验证输入坐标
    const validation = this.validateCoordinates(longitude, latitude);
    if (!validation.isValid) {
      return null;
    }

    // WGS84 -> GCJ02 -> BD09
    const gcj02Point = this.wgs84ToGcj02(longitude, latitude);
    const bd09Point = this.gcj02ToBd09(gcj02Point.longitude, gcj02Point.latitude);

    // 控制精度
    return {
      longitude: this.controlPrecision(bd09Point.longitude),
      latitude: this.controlPrecision(bd09Point.latitude)
    };
  }

  /**
   * WGS84坐标系转换为GCJ02坐标系
   * @param longitude - WGS84经度
   * @param latitude - WGS84纬度
   * @returns GCJ02坐标点
   */
  private static wgs84ToGcj02(longitude: number, latitude: number): CoordinatePoint {
    const dlat = this.transformLat(longitude - 105.0, latitude - 35.0);
    const dlng = this.transformLng(longitude - 105.0, latitude - 35.0);
    
    const radlat = (latitude / 180.0) * PI;
    let magic = Math.sin(radlat);
    magic = 1 - EE * magic * magic;
    const sqrtmagic = Math.sqrt(magic);
    
    const dlat2 = (dlat * 180.0) / ((A * (1 - EE)) / (magic * sqrtmagic) * PI);
    const dlng2 = (dlng * 180.0) / (A / sqrtmagic * Math.cos(radlat) * PI);
    
    const mglat = latitude + dlat2;
    const mglng = longitude + dlng2;
    
    return {
      longitude: mglng,
      latitude: mglat
    };
  }

  /**
   * GCJ02坐标系转换为BD09坐标系
   * @param longitude - GCJ02经度
   * @param latitude - GCJ02纬度
   * @returns BD09坐标点
   */
  private static gcj02ToBd09(longitude: number, latitude: number): CoordinatePoint {
    const z = Math.sqrt(longitude * longitude + latitude * latitude) + 0.00002 * Math.sin(latitude * X_PI);
    const theta = Math.atan2(latitude, longitude) + 0.000003 * Math.cos(longitude * X_PI);
    
    const bdLng = z * Math.cos(theta) + 0.0065;
    const bdLat = z * Math.sin(theta) + 0.006;
    
    return {
      longitude: bdLng,
      latitude: bdLat
    };
  }
}