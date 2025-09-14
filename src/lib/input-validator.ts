/**
 * GeoHash输入验证工具
 * 提供geohash格式验证、错误检测和修正建议功能
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  suggestions?: string[];
}

export interface ValidationError {
  type: 'INVALID_LENGTH' | 'INVALID_CHARACTERS' | 'EMPTY_INPUT' | 'WHITESPACE_ONLY';
  message: string;
  suggestions: string[];
}

/**
 * GeoHash有效字符集 (Base32)
 */
const GEOHASH_CHARSET = '0123456789bcdefghjkmnpqrstuvwxyz';
const GEOHASH_CHARSET_SET = new Set(GEOHASH_CHARSET);

/**
 * 验证单个geohash字符串
 */
export function validateGeohash(geohash: string): ValidationResult {
  // 检查空输入
  if (!geohash) {
    return {
      isValid: false,
      error: '请输入geohash编码',
      suggestions: ['示例: wx4g0ec1', '示例: wx4g0ec19ydr']
    };
  }

  // 检查是否只包含空白字符
  if (geohash.trim().length === 0) {
    return {
      isValid: false,
      error: '输入不能只包含空白字符',
      suggestions: ['请输入有效的geohash编码']
    };
  }

  const trimmedGeohash = geohash.trim().toLowerCase();

  // 检查长度 (geohash通常为1-12位)
  if (trimmedGeohash.length < 1 || trimmedGeohash.length > 12) {
    return {
      isValid: false,
      error: `geohash长度应为1-12位，当前为${trimmedGeohash.length}位`,
      suggestions: [
        '短geohash示例: wx4g (精度较低)',
        '长geohash示例: wx4g0ec19ydr (精度较高)'
      ]
    };
  }

  // 检查字符有效性
  const invalidChars = [];
  for (let i = 0; i < trimmedGeohash.length; i++) {
    const char = trimmedGeohash[i];
    if (!GEOHASH_CHARSET_SET.has(char)) {
      invalidChars.push(char);
    }
  }

  if (invalidChars.length > 0) {
    const suggestions = [];
    const uniqueInvalidChars = [...new Set(invalidChars)];
    
    // 提供字符替换建议
    uniqueInvalidChars.forEach(char => {
      const upperChar = char.toUpperCase();
      if (char === 'a') suggestions.push('字符 "a" 不在geohash字符集中，可能是 "b"');
      else if (char === 'i') suggestions.push('字符 "i" 不在geohash字符集中，可能是 "j"');
      else if (char === 'l') suggestions.push('字符 "l" 不在geohash字符集中，可能是 "1"');
      else if (char === 'o') suggestions.push('字符 "o" 不在geohash字符集中，可能是 "0"');
      else if (upperChar === 'A') suggestions.push('字符 "A" 不在geohash字符集中，可能是 "b"');
      else if (upperChar === 'I') suggestions.push('字符 "I" 不在geohash字符集中，可能是 "j"');
      else if (upperChar === 'L') suggestions.push('字符 "L" 不在geohash字符集中，可能是 "1"');
      else if (upperChar === 'O') suggestions.push('字符 "O" 不在geohash字符集中，可能是 "0"');
      else suggestions.push(`字符 "${char}" 不在geohash字符集中`);
    });

    suggestions.push('有效字符: 0-9, b-z (除了a,i,l,o)');

    return {
      isValid: false,
      error: `包含无效字符: ${uniqueInvalidChars.join(', ')}`,
      suggestions
    };
  }

  return { isValid: true };
}

/**
 * 实时输入验证 - 用于输入框onChange事件
 */
export function validateInputRealtime(input: string): ValidationResult {
  if (!input) {
    return { isValid: true }; // 空输入在实时验证中是允许的
  }

  const trimmedInput = input.trim().toLowerCase();
  
  // 检查长度
  if (trimmedInput.length > 12) {
    return {
      isValid: false,
      error: 'geohash长度不能超过12位',
      suggestions: ['请删除多余字符']
    };
  }

  // 检查字符有效性
  const invalidChars = [];
  for (let i = 0; i < trimmedInput.length; i++) {
    const char = trimmedInput[i];
    if (!GEOHASH_CHARSET_SET.has(char)) {
      invalidChars.push(char);
    }
  }

  if (invalidChars.length > 0) {
    return {
      isValid: false,
      error: `包含无效字符: ${[...new Set(invalidChars)].join(', ')}`,
      suggestions: ['有效字符: 0-9, b-z (除了a,i,l,o)']
    };
  }

  return { isValid: true };
}

/**
 * 清理和标准化geohash输入
 */
export function sanitizeGeohash(geohash: string): string {
  return geohash.trim().toLowerCase();
}

/**
 * 获取geohash格式示例
 */
export function getGeohashExamples(): string[] {
  return [
    'wx4g0ec1 (8位精度)',
    'wx4g0ec19ydr (12位精度)',
    'wx4g (4位精度，较低)',
    'wx4g0 (5位精度，中等)'
  ];
}

/**
 * 检查geohash是否可能是有效的（用于自动完成等场景）
 */
export function isPotentiallyValidGeohash(partial: string): boolean {
  if (!partial) return true;
  
  const trimmed = partial.trim().toLowerCase();
  if (trimmed.length > 12) return false;
  
  for (let i = 0; i < trimmed.length; i++) {
    if (!GEOHASH_CHARSET_SET.has(trimmed[i])) {
      return false;
    }
  }
  
  return true;
}