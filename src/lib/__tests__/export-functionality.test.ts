import { ConversionResult } from '../../components/ResultsDisplay';

// Mock DOM APIs for testing
Object.assign(global, {
  URL: {
    createObjectURL: jest.fn(() => 'mock-url'),
    revokeObjectURL: jest.fn(),
  },
  Blob: jest.fn((content, options) => ({
    content,
    options,
  })),
});

// Mock document.createElement and related DOM methods
const mockLink = {
  setAttribute: jest.fn(),
  click: jest.fn(),
  style: {},
};

Object.defineProperty(document, 'createElement', {
  value: jest.fn(() => mockLink),
});

Object.defineProperty(document.body, 'appendChild', {
  value: jest.fn(),
});

Object.defineProperty(document.body, 'removeChild', {
  value: jest.fn(),
});

describe('Export Functionality', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createMockResults = (): ConversionResult[] => [
    {
      input: 'wx4g0ec1',
      success: true,
      longitude: 116.397428,
      latitude: 39.90923,
      coordinateSystem: 'BD09',
    },
    {
      input: 'invalid',
      success: false,
      error: 'Invalid geohash format',
      coordinateSystem: 'BD09',
    },
    {
      input: 'wx4g0ec2',
      success: true,
      longitude: 116.397500,
      latitude: 39.909300,
      coordinateSystem: 'GPS84',
    },
  ];

  const simulateExport = (results: ConversionResult[]) => {
    // Simulate the export logic from MainLayout
    if (results.length === 0) {
      return { success: false, message: '没有可导出的结果' };
    }

    try {
      // Prepare CSV content
      const headers = ['输入GeoHash', '转换状态', '经度', '纬度', '坐标系', '错误信息'];
      const csvRows = [headers.join(',')];

      results.forEach(result => {
        const row = [
          `"${result.input}"`,
          result.success ? '成功' : '失败',
          result.success && result.longitude !== undefined ? result.longitude.toFixed(6) : '',
          result.success && result.latitude !== undefined ? result.latitude.toFixed(6) : '',
          result.coordinateSystem === 'BD09' ? '百度09' : 'GPS84',
          result.error ? `"${result.error}"` : ''
        ];
        csvRows.push(row.join(','));
      });

      // Add statistics
      const successCount = results.filter(r => r.success).length;
      const errorCount = results.filter(r => !r.success).length;
      csvRows.push(''); // Empty line
      csvRows.push('统计信息');
      csvRows.push(`总计,${results.length}`);
      csvRows.push(`成功,${successCount}`);
      csvRows.push(`失败,${errorCount}`);
      csvRows.push(`导出时间,"${new Date().toLocaleString('zh-CN')}"`);

      const csvContent = csvRows.join('\n');

      // Create blob and download
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const filename = `geohash_conversion_${timestamp}.csv`;
      
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);

      return { 
        success: true, 
        message: `导出完成！文件名: ${filename}`,
        csvContent,
        filename
      };

    } catch (error) {
      return { success: false, message: '导出失败，请重试' };
    }
  };

  test('should export CSV with correct format and headers', () => {
    const results = createMockResults();
    const exportResult = simulateExport(results);

    expect(exportResult.success).toBe(true);
    expect(exportResult.csvContent).toContain('输入GeoHash,转换状态,经度,纬度,坐标系,错误信息');
    expect(exportResult.csvContent).toContain('"wx4g0ec1",成功,116.397428,39.909230,百度09,');
    expect(exportResult.csvContent).toContain('"invalid",失败,,,百度09,"Invalid geohash format"');
    expect(exportResult.csvContent).toContain('"wx4g0ec2",成功,116.397500,39.909300,GPS84,');
  });

  test('should include statistics in CSV export', () => {
    const results = createMockResults();
    const exportResult = simulateExport(results);

    expect(exportResult.success).toBe(true);
    expect(exportResult.csvContent).toContain('统计信息');
    expect(exportResult.csvContent).toContain('总计,3');
    expect(exportResult.csvContent).toContain('成功,2');
    expect(exportResult.csvContent).toContain('失败,1');
    expect(exportResult.csvContent).toContain('导出时间');
  });

  test('should generate filename with timestamp', () => {
    const results = createMockResults();
    const exportResult = simulateExport(results);

    expect(exportResult.success).toBe(true);
    expect(exportResult.filename).toMatch(/^geohash_conversion_\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.csv$/);
  });

  test('should handle empty results', () => {
    const results: ConversionResult[] = [];
    const exportResult = simulateExport(results);

    expect(exportResult.success).toBe(false);
    expect(exportResult.message).toBe('没有可导出的结果');
  });

  test('should create proper DOM elements for download', () => {
    const results = createMockResults();
    simulateExport(results);

    expect(document.createElement).toHaveBeenCalledWith('a');
    expect(mockLink.setAttribute).toHaveBeenCalledWith('href', 'mock-url');
    expect(mockLink.setAttribute).toHaveBeenCalledWith('download', expect.stringMatching(/geohash_conversion_.*\.csv/));
    expect(document.body.appendChild).toHaveBeenCalledWith(mockLink);
    expect(mockLink.click).toHaveBeenCalled();
    expect(document.body.removeChild).toHaveBeenCalledWith(mockLink);
  });

  test('should handle coordinate system labels correctly', () => {
    const bd09Result: ConversionResult = {
      input: 'test1',
      success: true,
      longitude: 116.0,
      latitude: 39.0,
      coordinateSystem: 'BD09',
    };

    const gps84Result: ConversionResult = {
      input: 'test2',
      success: true,
      longitude: 116.0,
      latitude: 39.0,
      coordinateSystem: 'GPS84',
    };

    const exportResult = simulateExport([bd09Result, gps84Result]);

    expect(exportResult.success).toBe(true);
    expect(exportResult.csvContent).toContain('百度09');
    expect(exportResult.csvContent).toContain('GPS84');
  });

  test('should format coordinates with 6 decimal places', () => {
    const result: ConversionResult = {
      input: 'test',
      success: true,
      longitude: 116.123456789,
      latitude: 39.987654321,
      coordinateSystem: 'BD09',
    };

    const exportResult = simulateExport([result]);

    expect(exportResult.success).toBe(true);
    expect(exportResult.csvContent).toContain('116.123457'); // Rounded to 6 decimal places
    expect(exportResult.csvContent).toContain('39.987654'); // Rounded to 6 decimal places
  });

  test('should include BOM for proper UTF-8 encoding', () => {
    const results = createMockResults();
    simulateExport(results);

    expect(Blob).toHaveBeenCalledWith(
      [expect.stringMatching(/^\ufeff/)], // Should start with BOM
      { type: 'text/csv;charset=utf-8;' }
    );
  });
});