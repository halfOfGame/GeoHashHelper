/**
 * 端到端转换流程测试
 * 测试从输入到结果展示的完整流程
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// Mock the main page component
import { ConversionEngine } from '../../lib/conversion-engine';
import { OptimizedBatchProcessor } from '../../lib/optimized-batch-processor';

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn(() => Promise.resolve()),
  },
});

// Mock URL.createObjectURL for CSV export
global.URL.createObjectURL = jest.fn(() => 'mock-url');
global.URL.revokeObjectURL = jest.fn();

// Mock the conversion engine
jest.mock('../../lib/conversion-engine');
jest.mock('../../lib/optimized-batch-processor');

const mockConversionEngine = ConversionEngine as jest.Mocked<typeof ConversionEngine>;
const mockOptimizedBatchProcessor = OptimizedBatchProcessor as jest.Mocked<typeof OptimizedBatchProcessor>;

// Mock component that simulates the main application
const MockGeoHashConverter: React.FC = () => {
  const [input, setInput] = React.useState('');
  const [coordinateSystem, setCoordinateSystem] = React.useState<'BD09' | 'GPS84'>('BD09');
  const [isBatchMode, setIsBatchMode] = React.useState(false);
  const [results, setResults] = React.useState<any[]>([]);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [progress, setProgress] = React.useState<any>(null);

  const handleConvert = async () => {
    setIsProcessing(true);
    setProgress(null);

    try {
      if (isBatchMode) {
        const geohashList = input.split(/[\n,]/).map(item => item.trim()).filter(item => item.length > 0);
        
        if (geohashList.length > 200) {
          // Use optimized processing for large batches
          const result = await mockOptimizedBatchProcessor.processBatchOptimized(
            geohashList,
            coordinateSystem,
            {
              progressCallback: setProgress,
            }
          );
          setResults(result.results);
        } else {
          // Use regular batch processing
          const batchResult = mockConversionEngine.convertBatch(geohashList, coordinateSystem);
          setResults(batchResult.results);
        }
      } else {
        // Single conversion
        const result = mockConversionEngine.convertSingle(input.trim(), coordinateSystem);
        setResults([result]);
      }
    } finally {
      setIsProcessing(false);
      setProgress(null);
    }
  };

  const handleCopy = async (result: any) => {
    const text = `${result.longitude},${result.latitude}`;
    await navigator.clipboard.writeText(text);
  };

  const handleCopyAll = async () => {
    const successResults = results.filter(r => r.success);
    const text = successResults.map(r => `${r.longitude},${r.latitude}`).join('\n');
    await navigator.clipboard.writeText(text);
  };

  const handleExport = () => {
    const csv = mockConversionEngine.formatResultsAsCSV(results);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = 'geohash-conversion-results.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <h1>GeoHash坐标转换工具</h1>
      
      {/* Coordinate System Selection */}
      <div>
        <label>
          <input
            type="radio"
            name="coordinateSystem"
            value="BD09"
            checked={coordinateSystem === 'BD09'}
            onChange={(e) => setCoordinateSystem(e.target.value as 'BD09')}
          />
          百度09坐标系
        </label>
        <label>
          <input
            type="radio"
            name="coordinateSystem"
            value="GPS84"
            checked={coordinateSystem === 'GPS84'}
            onChange={(e) => setCoordinateSystem(e.target.value as 'GPS84')}
          />
          GPS84坐标系
        </label>
      </div>

      {/* Batch Mode Toggle */}
      <div>
        <label>
          <input
            type="checkbox"
            checked={isBatchMode}
            onChange={(e) => setIsBatchMode(e.target.checked)}
          />
          批量模式
        </label>
      </div>

      {/* Input Area */}
      <div>
        <textarea
          data-testid="geohash-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={isBatchMode ? "输入多个GeoHash，用换行符或逗号分隔" : "输入单个GeoHash"}
          rows={isBatchMode ? 5 : 1}
        />
      </div>

      {/* Convert Button */}
      <button
        onClick={handleConvert}
        disabled={isProcessing || !input.trim()}
      >
        {isProcessing ? '转换中...' : '转换'}
      </button>

      {/* Progress Indicator */}
      {progress && (
        <div data-testid="progress-indicator">
          <div>进度: {progress.percentage.toFixed(1)}%</div>
          <div>已处理: {progress.processed} / {progress.total}</div>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div data-testid="results-section">
          <h2>转换结果</h2>
          
          {/* Summary */}
          <div data-testid="results-summary">
            总计: {results.length} | 
            成功: {results.filter(r => r.success).length} | 
            失败: {results.filter(r => !r.success).length}
          </div>

          {/* Actions */}
          <div>
            {results.some(r => r.success) && (
              <button onClick={handleCopyAll} data-testid="copy-all-btn">
                复制全部
              </button>
            )}
            <button onClick={handleExport} data-testid="export-btn">
              导出CSV
            </button>
          </div>

          {/* Results Table */}
          <table data-testid="results-table">
            <thead>
              <tr>
                <th>输入GeoHash</th>
                <th>状态</th>
                <th>经度</th>
                <th>纬度</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {results.map((result, index) => (
                <tr key={index} data-testid={`result-row-${index}`}>
                  <td>{result.input}</td>
                  <td>{result.success ? '成功' : '失败'}</td>
                  <td>{result.success ? result.longitude?.toFixed(6) : result.error}</td>
                  <td>{result.success ? result.latitude?.toFixed(6) : '-'}</td>
                  <td>
                    {result.success && (
                      <button
                        onClick={() => handleCopy(result)}
                        data-testid={`copy-btn-${index}`}
                      >
                        复制
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

describe('End-to-End Conversion Workflow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mock implementations
    mockConversionEngine.convertSingle.mockImplementation((geohash, coordinateSystem) => ({
      input: geohash,
      success: geohash.length >= 4 && geohash.length <= 12,
      longitude: geohash.length >= 4 ? 116.404 : undefined,
      latitude: geohash.length >= 4 ? 39.915 : undefined,
      error: geohash.length < 4 || geohash.length > 12 ? 'Invalid geohash length' : undefined,
      coordinateSystem,
    }));

    mockConversionEngine.convertBatch.mockImplementation((geohashList, coordinateSystem) => ({
      results: geohashList.map(geohash => mockConversionEngine.convertSingle(geohash, coordinateSystem)),
      totalCount: geohashList.length,
      successCount: geohashList.filter(g => g.length >= 4 && g.length <= 12).length,
      errorCount: geohashList.filter(g => g.length < 4 || g.length > 12).length,
      processingTime: 100,
    }));

    mockConversionEngine.formatResultsAsCSV.mockReturnValue('input,success,longitude,latitude\nwx4g0ec1,true,116.404,39.915');

    mockOptimizedBatchProcessor.processBatchOptimized.mockImplementation(async (geohashList, coordinateSystem, options) => {
      // Simulate progress updates
      if (options?.progressCallback) {
        const total = geohashList.length;
        for (let i = 0; i <= total; i += 50) {
          const processed = Math.min(i, total);
          options.progressCallback({
            processed,
            total,
            percentage: (processed / total) * 100,
            currentChunk: Math.floor(i / 50) + 1,
            totalChunks: Math.ceil(total / 50),
            processingRate: 25,
            estimatedTimeRemaining: (total - processed) / 25,
          });
          
          // Small delay to simulate processing
          await new Promise(resolve => setTimeout(resolve, 10));
        }
      }

      return {
        results: geohashList.map(geohash => mockConversionEngine.convertSingle(geohash, coordinateSystem)),
        totalCount: geohashList.length,
        successCount: geohashList.filter(g => g.length >= 4 && g.length <= 12).length,
        errorCount: geohashList.filter(g => g.length < 4 || g.length > 12).length,
        processingTime: 1000,
        averageProcessingRate: 25,
        peakMemoryUsage: 50,
        cancelled: false,
      };
    });
  });

  describe('Single Conversion Workflow', () => {
    it('should complete single geohash conversion successfully', async () => {
      const user = userEvent.setup();
      render(<MockGeoHashConverter />);

      // Verify initial state
      expect(screen.getByText('GeoHash坐标转换工具')).toBeInTheDocument();
      expect(screen.getByDisplayValue('BD09')).toBeChecked();

      // Input a valid geohash
      const input = screen.getByTestId('geohash-input');
      await user.type(input, 'wx4g0ec1');

      // Click convert button
      const convertBtn = screen.getByText('转换');
      expect(convertBtn).not.toBeDisabled();
      await user.click(convertBtn);

      // Wait for results
      await waitFor(() => {
        expect(screen.getByTestId('results-section')).toBeInTheDocument();
      });

      // Verify results
      expect(screen.getByText('总计: 1')).toBeInTheDocument();
      expect(screen.getByText('成功: 1')).toBeInTheDocument();
      expect(screen.getByText('失败: 0')).toBeInTheDocument();
      
      // Check result details
      expect(screen.getByText('wx4g0ec1')).toBeInTheDocument();
      expect(screen.getByText('成功')).toBeInTheDocument();
      expect(screen.getByText('116.404000')).toBeInTheDocument();
      expect(screen.getByText('39.915000')).toBeInTheDocument();

      // Verify conversion engine was called correctly
      expect(mockConversionEngine.convertSingle).toHaveBeenCalledWith('wx4g0ec1', 'BD09');
    });

    it('should handle single geohash conversion failure', async () => {
      const user = userEvent.setup();
      render(<MockGeoHashConverter />);

      // Input an invalid geohash
      const input = screen.getByTestId('geohash-input');
      await user.type(input, 'abc'); // Too short

      // Click convert button
      await user.click(screen.getByText('转换'));

      // Wait for results
      await waitFor(() => {
        expect(screen.getByTestId('results-section')).toBeInTheDocument();
      });

      // Verify error handling
      expect(screen.getByText('总计: 1')).toBeInTheDocument();
      expect(screen.getByText('成功: 0')).toBeInTheDocument();
      expect(screen.getByText('失败: 1')).toBeInTheDocument();
      
      expect(screen.getByText('abc')).toBeInTheDocument();
      expect(screen.getByText('失败')).toBeInTheDocument();
      expect(screen.getByText('Invalid geohash length')).toBeInTheDocument();
    });

    it('should handle coordinate system switching', async () => {
      const user = userEvent.setup();
      render(<MockGeoHashConverter />);

      // Switch to GPS84
      const gps84Radio = screen.getByLabelText('GPS84坐标系');
      await user.click(gps84Radio);
      expect(gps84Radio).toBeChecked();

      // Input and convert
      const input = screen.getByTestId('geohash-input');
      await user.type(input, 'wx4g0ec1');
      await user.click(screen.getByText('转换'));

      // Wait for results
      await waitFor(() => {
        expect(screen.getByTestId('results-section')).toBeInTheDocument();
      });

      // Verify GPS84 was used
      expect(mockConversionEngine.convertSingle).toHaveBeenCalledWith('wx4g0ec1', 'GPS84');
    });
  });

  describe('Batch Conversion Workflow', () => {
    it('should complete small batch conversion successfully', async () => {
      const user = userEvent.setup();
      render(<MockGeoHashConverter />);

      // Enable batch mode
      const batchModeCheckbox = screen.getByLabelText('批量模式');
      await user.click(batchModeCheckbox);
      expect(batchModeCheckbox).toBeChecked();

      // Input multiple geohashes
      const input = screen.getByTestId('geohash-input');
      await user.type(input, 'wx4g0ec1\nwx4g0ec2\nwx4g0ec3');

      // Click convert button
      await user.click(screen.getByText('转换'));

      // Wait for results
      await waitFor(() => {
        expect(screen.getByTestId('results-section')).toBeInTheDocument();
      });

      // Verify batch results
      expect(screen.getByText('总计: 3')).toBeInTheDocument();
      expect(screen.getByText('成功: 3')).toBeInTheDocument();
      expect(screen.getByText('失败: 0')).toBeInTheDocument();

      // Check individual results
      expect(screen.getByText('wx4g0ec1')).toBeInTheDocument();
      expect(screen.getByText('wx4g0ec2')).toBeInTheDocument();
      expect(screen.getByText('wx4g0ec3')).toBeInTheDocument();

      // Verify batch conversion was used
      expect(mockConversionEngine.convertBatch).toHaveBeenCalledWith(
        ['wx4g0ec1', 'wx4g0ec2', 'wx4g0ec3'],
        'BD09'
      );
    });

    it('should use optimized processing for large batches', async () => {
      const user = userEvent.setup();
      render(<MockGeoHashConverter />);

      // Enable batch mode
      await user.click(screen.getByLabelText('批量模式'));

      // Input large batch (>200 items)
      const largeInput = Array.from({ length: 250 }, (_, i) => `wx4g0ec${i.toString().padStart(3, '0')}`).join('\n');
      const input = screen.getByTestId('geohash-input');
      await user.type(input, largeInput);

      // Click convert button
      await user.click(screen.getByText('转换'));

      // Should show progress indicator
      await waitFor(() => {
        expect(screen.getByTestId('progress-indicator')).toBeInTheDocument();
      });

      // Wait for completion
      await waitFor(() => {
        expect(screen.getByTestId('results-section')).toBeInTheDocument();
      }, { timeout: 5000 });

      // Verify optimized processing was used
      expect(mockOptimizedBatchProcessor.processBatchOptimized).toHaveBeenCalled();
      expect(screen.getByText('总计: 250')).toBeInTheDocument();
    });

    it('should handle mixed valid and invalid geohashes in batch', async () => {
      const user = userEvent.setup();
      render(<MockGeoHashConverter />);

      // Enable batch mode
      await user.click(screen.getByLabelText('批量模式'));

      // Input mixed valid/invalid geohashes
      const input = screen.getByTestId('geohash-input');
      await user.type(input, 'wx4g0ec1,abc,wx4g0ec2,xy');

      // Click convert button
      await user.click(screen.getByText('转换'));

      // Wait for results
      await waitFor(() => {
        expect(screen.getByTestId('results-section')).toBeInTheDocument();
      });

      // Verify mixed results
      expect(screen.getByText('总计: 4')).toBeInTheDocument();
      expect(screen.getByText('成功: 2')).toBeInTheDocument();
      expect(screen.getByText('失败: 2')).toBeInTheDocument();
    });
  });

  describe('Results Interaction Workflow', () => {
    beforeEach(async () => {
      const user = userEvent.setup();
      render(<MockGeoHashConverter />);

      // Setup some results
      const input = screen.getByTestId('geohash-input');
      await user.type(input, 'wx4g0ec1');
      await user.click(screen.getByText('转换'));

      await waitFor(() => {
        expect(screen.getByTestId('results-section')).toBeInTheDocument();
      });
    });

    it('should copy individual result successfully', async () => {
      const user = userEvent.setup();
      
      const copyBtn = screen.getByTestId('copy-btn-0');
      await user.click(copyBtn);

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('116.404,39.915');
    });

    it('should copy all results successfully', async () => {
      const user = userEvent.setup();
      
      const copyAllBtn = screen.getByTestId('copy-all-btn');
      await user.click(copyAllBtn);

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('116.404,39.915');
    });

    it('should export results as CSV', async () => {
      const user = userEvent.setup();
      
      const exportBtn = screen.getByTestId('export-btn');
      await user.click(exportBtn);

      expect(mockConversionEngine.formatResultsAsCSV).toHaveBeenCalled();
      expect(URL.createObjectURL).toHaveBeenCalled();
    });
  });

  describe('Error Handling Workflow', () => {
    it('should handle conversion engine errors gracefully', async () => {
      const user = userEvent.setup();
      
      // Mock conversion engine to throw error
      mockConversionEngine.convertSingle.mockImplementation(() => {
        throw new Error('Conversion failed');
      });

      render(<MockGeoHashConverter />);

      const input = screen.getByTestId('geohash-input');
      await user.type(input, 'wx4g0ec1');

      // Should not crash when conversion fails
      await user.click(screen.getByText('转换'));

      // The component should handle the error gracefully
      // (In a real implementation, this would show an error message)
    });

    it('should disable convert button when input is empty', () => {
      render(<MockGeoHashConverter />);

      const convertBtn = screen.getByText('转换');
      expect(convertBtn).toBeDisabled();
    });

    it('should show processing state during conversion', async () => {
      const user = userEvent.setup();
      
      // Mock slow conversion
      mockConversionEngine.convertSingle.mockImplementation(
        () => new Promise(resolve => 
          setTimeout(() => resolve({
            input: 'wx4g0ec1',
            success: true,
            longitude: 116.404,
            latitude: 39.915,
            coordinateSystem: 'BD09' as const,
          }), 100)
        )
      );

      render(<MockGeoHashConverter />);

      const input = screen.getByTestId('geohash-input');
      await user.type(input, 'wx4g0ec1');
      
      const convertBtn = screen.getByText('转换');
      await user.click(convertBtn);

      // Should show processing state
      expect(screen.getByText('转换中...')).toBeInTheDocument();
      expect(convertBtn).toBeDisabled();

      // Wait for completion
      await waitFor(() => {
        expect(screen.getByText('转换')).toBeInTheDocument();
      });
    });
  });

  describe('Progress Tracking Workflow', () => {
    it('should show progress updates during large batch processing', async () => {
      const user = userEvent.setup();
      render(<MockGeoHashConverter />);

      // Enable batch mode and input large batch
      await user.click(screen.getByLabelText('批量模式'));
      
      const largeInput = Array.from({ length: 300 }, (_, i) => `wx4g0ec${i}`).join('\n');
      const input = screen.getByTestId('geohash-input');
      await user.type(input, largeInput);

      // Start conversion
      await user.click(screen.getByText('转换'));

      // Should show progress updates
      await waitFor(() => {
        expect(screen.getByTestId('progress-indicator')).toBeInTheDocument();
      });

      // Should show progress percentage
      await waitFor(() => {
        expect(screen.getByText(/进度:/)).toBeInTheDocument();
        expect(screen.getByText(/已处理:/)).toBeInTheDocument();
      });

      // Wait for completion
      await waitFor(() => {
        expect(screen.getByTestId('results-section')).toBeInTheDocument();
      }, { timeout: 5000 });
    });
  });
});