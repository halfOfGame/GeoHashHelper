/**
 * GeoHash解码器
 * 实现Base32字符验证和转换，以及二进制位交替提取经纬度的核心算法
 */

// Base32字符集（geohash使用的字符）
const BASE32_CHARS = '0123456789bcdefghjkmnpqrstuvwxyz';

// 创建字符到索引的映射
const BASE32_MAP: { [key: string]: number } = {};
for (let i = 0; i < BASE32_CHARS.length; i++) {
  BASE32_MAP[BASE32_CHARS[i]] = i;
}

export interface GeoHashDecodeResult {
  latitude: number;
  longitude: number;
}

export class GeoHashDecoder {
  /**
   * 验证geohash字符串格式是否有效
   * @param geohash - 待验证的geohash字符串
   * @returns 是否为有效的geohash格式
   */
  static validate(geohash: string): boolean {
    if (!geohash || typeof geohash !== 'string') {
      return false;
    }

    // 检查长度（通常1-12位）
    if (geohash.length < 1 || geohash.length > 12) {
      return false;
    }

    // 检查是否只包含有效的Base32字符
    for (const char of geohash.toLowerCase()) {
      if (!(char in BASE32_MAP)) {
        return false;
      }
    }

    return true;
  }

  /**
   * 将Base32字符转换为5位二进制字符串
   * @param char - Base32字符
   * @returns 5位二进制字符串
   */
  private static charToBinary(char: string): string {
    const index = BASE32_MAP[char.toLowerCase()];
    return index.toString(2).padStart(5, '0');
  }

  /**
   * 解码geohash为经纬度坐标
   * @param geohash - geohash字符串
   * @returns 解码结果或null（如果解码失败）
   */
  static decode(geohash: string): GeoHashDecodeResult | null {
    if (!this.validate(geohash)) {
      return null;
    }

    // 将geohash转换为二进制字符串
    let binaryString = '';
    for (const char of geohash.toLowerCase()) {
      binaryString += this.charToBinary(char);
    }

    // 初始化经纬度范围
    let lonRange = [-180.0, 180.0];
    let latRange = [-90.0, 90.0];

    // 交替处理经度和纬度位
    let isEvenBit = true; // 偶数位是经度，奇数位是纬度

    for (const bit of binaryString) {
      if (isEvenBit) {
        // 处理经度位
        const mid = (lonRange[0] + lonRange[1]) / 2;
        if (bit === '1') {
          lonRange[0] = mid;
        } else {
          lonRange[1] = mid;
        }
      } else {
        // 处理纬度位
        const mid = (latRange[0] + latRange[1]) / 2;
        if (bit === '1') {
          latRange[0] = mid;
        } else {
          latRange[1] = mid;
        }
      }
      isEvenBit = !isEvenBit;
    }

    // 计算最终的经纬度（取范围中点）
    const longitude = (lonRange[0] + lonRange[1]) / 2;
    const latitude = (latRange[0] + latRange[1]) / 2;

    // 保留6位小数精度
    return {
      longitude: Math.round(longitude * 1000000) / 1000000,
      latitude: Math.round(latitude * 1000000) / 1000000,
    };
  }
}