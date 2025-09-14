import {
  validateGeohash,
  validateInputRealtime,
  sanitizeGeohash,
  getGeohashExamples,
  isPotentiallyValidGeohash,
  ValidationResult
} from '../input-validator';

describe('validateGeohash', () => {
  test('应该验证有效的geohash', () => {
    const validGeohashes = [
      'wx4g0ec1',
      'wx4g0ec19ydr',
      'wx4g',
      '9q5',
      'u4pruydqqvj',
      '0',
      'z'
    ];

    validGeohashes.forEach(geohash => {
      const result = validateGeohash(geohash);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });

  test('应该拒绝空输入', () => {
    const result = validateGeohash('');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('请输入geohash编码');
    expect(result.suggestions).toContain('示例: wx4g0ec1');
  });

  test('应该拒绝只包含空白字符的输入', () => {
    const result = validateGeohash('   ');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('输入不能只包含空白字符');
  });

  test('应该拒绝过长的geohash', () => {
    const result = validateGeohash('wx4g0ec19ydrabcdef'); // 17位
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('geohash长度应为1-12位');
    expect(result.suggestions).toContain('长geohash示例: wx4g0ec19ydr (精度较高)');
  });

  test('应该拒绝包含无效字符的geohash', () => {
    const invalidCases = [
      { input: 'wx4g0eca', char: 'a' },
      { input: 'wx4g0eci', char: 'i' },
      { input: 'wx4g0ecl', char: 'l' },
      { input: 'wx4g0eco', char: 'o' },
      { input: 'wx4g0ec@', char: '@' },
      { input: 'wx4g0ec!', char: '!' }
    ];

    invalidCases.forEach(({ input, char }) => {
      const result = validateGeohash(input);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain(`包含无效字符: ${char}`);
      expect(result.suggestions).toContain('有效字符: 0-9, b-z (除了a,i,l,o)');
    });
  });

  test('应该提供字符替换建议', () => {
    const testCases = [
      { input: 'wx4ga', expectedSuggestion: '字符 "a" 不在geohash字符集中，可能是 "b"' },
      { input: 'wx4gi', expectedSuggestion: '字符 "i" 不在geohash字符集中，可能是 "j"' },
      { input: 'wx4gl', expectedSuggestion: '字符 "l" 不在geohash字符集中，可能是 "1"' },
      { input: 'wx4go', expectedSuggestion: '字符 "o" 不在geohash字符集中，可能是 "0"' }
    ];

    testCases.forEach(({ input, expectedSuggestion }) => {
      const result = validateGeohash(input);
      expect(result.isValid).toBe(false);
      expect(result.suggestions).toContain(expectedSuggestion);
    });
  });

  test('应该处理大写字符', () => {
    const result = validateGeohash('WX4G0EC1');
    expect(result.isValid).toBe(true);
  });

  test('应该处理前后空白字符', () => {
    const result = validateGeohash('  wx4g0ec1  ');
    expect(result.isValid).toBe(true);
  });
});

describe('validateInputRealtime', () => {
  test('应该允许空输入', () => {
    const result = validateInputRealtime('');
    expect(result.isValid).toBe(true);
  });

  test('应该验证有效的部分输入', () => {
    const validInputs = ['w', 'wx', 'wx4', 'wx4g0ec1'];
    
    validInputs.forEach(input => {
      const result = validateInputRealtime(input);
      expect(result.isValid).toBe(true);
    });
  });

  test('应该拒绝过长的输入', () => {
    const result = validateInputRealtime('wx4g0ec19ydrabcdef');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('geohash长度不能超过12位');
  });

  test('应该拒绝包含无效字符的输入', () => {
    const result = validateInputRealtime('wx4ga');
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('包含无效字符: a');
  });
});

describe('sanitizeGeohash', () => {
  test('应该清理和标准化geohash', () => {
    expect(sanitizeGeohash('  WX4G0EC1  ')).toBe('wx4g0ec1');
    expect(sanitizeGeohash('WX4G0EC1')).toBe('wx4g0ec1');
    expect(sanitizeGeohash('wx4g0ec1')).toBe('wx4g0ec1');
    expect(sanitizeGeohash('')).toBe('');
  });
});

describe('getGeohashExamples', () => {
  test('应该返回geohash示例', () => {
    const examples = getGeohashExamples();
    expect(examples).toHaveLength(4);
    expect(examples[0]).toContain('wx4g0ec1');
    expect(examples[1]).toContain('wx4g0ec19ydr');
  });
});

describe('isPotentiallyValidGeohash', () => {
  test('应该允许空输入', () => {
    expect(isPotentiallyValidGeohash('')).toBe(true);
  });

  test('应该验证有效的部分geohash', () => {
    const validPartials = ['w', 'wx', 'wx4', 'wx4g0ec1'];
    
    validPartials.forEach(partial => {
      expect(isPotentiallyValidGeohash(partial)).toBe(true);
    });
  });

  test('应该拒绝包含无效字符的部分geohash', () => {
    expect(isPotentiallyValidGeohash('wa')).toBe(false);
    expect(isPotentiallyValidGeohash('wi')).toBe(false);
    expect(isPotentiallyValidGeohash('wl')).toBe(false);
    expect(isPotentiallyValidGeohash('wo')).toBe(false);
  });

  test('应该拒绝过长的部分geohash', () => {
    expect(isPotentiallyValidGeohash('wx4g0ec19ydrabcdef')).toBe(false);
  });

  test('应该处理大小写和空白字符', () => {
    expect(isPotentiallyValidGeohash('  WX4G  ')).toBe(true);
  });
});