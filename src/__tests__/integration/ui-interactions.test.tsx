/**
 * UI交互集成测试
 * 测试用户界面组件之间的交互和集成
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// Import components for integration testing
import InputSection from '../../components/InputSection';
import ResultsDisplay from '../../components/ResultsDisplay';
import BatchProgressIndicator from '../../components/BatchProgressIndicator';
import VirtualizedResultsDisplay from '../../components/VirtualizedResultsDisplay';
import { ConversionResult } from '../../lib/conversion-engine';
import { BatchProgress } from '../../lib/optimized-batch-processor';

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn(() => Promise.resolve()),
  },
});

describe('UI Interactions Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('InputSection Integration', () => {
    const mockProps = {
      value: '',
      onChange: jest.fn(),
      coordinateSystem: 'BD09' as const,
      onCoordinateSystemChange: jest.fn(),
      isBatchMode: false,
      onBatchModeChange: jest.fn(),
      onConvert: jest.fn(),
      isProcessing: false,
      disabled: false,
    };

    it('should handle coordinate system switching correctly', async () => {
      const user = userEvent.setup();
      render(<InputSection {...mockProps} />);

      // Find and click GPS84 radio button
      const gps84Radio = screen.getByLabelText(/GPS84/);
      await user.click(gps84Radio);

      expect(mockProps.onCoordinateSystemChange).toHaveBeenCalledWith('GPS84');
    });

    it('should handle batch mode toggle correctly', async () => {
      const user = userEvent.setup();
      render(<InputSection {...mockProps} />);

      // Find and click batch mode checkbox
      const batchModeCheckbox = screen.getByLabelText(/批量模式/);
      await user.click(batchModeCheckbox);

      expect(mockProps.onBatchModeChange).toHaveBeenCalledWith(true);
    });

    it('should handle input changes correctly', async () => {
      const user = userEvent.setup();
      render(<InputSection {...mockProps} />);

      // Find input field and type
      const input = screen.getByRole('textbox');
      await user.type(input, 'wx4g0ec1');

      expect(mockProps.onChange).toHaveBeenCalledWith('wx4g0ec1');
    });

    it('should disable convert button when processing', () => {
      render(<InputSection {...mockProps} isProcessing={true} />);

      const convertButton = screen.getByText('转换');
      expect(convertButton).toBeDisabled();
    });

    it('should show different placeholder text for batch mode', () => {
      const { rerender } = render(<InputSection {...mockProps} />);

      // Single mode placeholder
      expect(screen.getByPlaceholderText(/输入单个GeoHash/)).toBeInTheDocument();

      // Batch mode placeholder
      rerender(<InputSection {...mockProps} isBatchMode={true} />);
      expect(screen.getByPlaceholderText(/输入多个GeoHash/)).toBeInTheDocument();
    });
  });

  describe('ResultsDisplay Integration', () => {
    const mockResults: ConversionResult[] = [
      {
        input: 'wx4g0ec1',
        success: true,
        longitude: 116.404,
        latitude: 39.915,
        coordinateSystem: 'BD09',
      },
      {
        input: 'wx4g0ec2',
        success: true,
        longitude: 116.405,
        latitude: 39.916,
        coordinateSystem: 'BD09',
      },
      {
        input: 'invalid',
        success: false,
        error: 'Invalid geohash format',
        coordinateSystem: 'GPS84',
      },
    ];

    const mockProps = {
      results: mockResults,
      onCopy: jest.fn(),
      onCopyAll: jest.fn(),
      onExport: jest.fn(),
    };

    it('should handle sorting interactions correctly', async () => {
      const user = userEvent.setup();
      render(<ResultsDisplay {...mockProps} />);

      // Click on longitude header to sort
      const longitudeHeader = screen.getByText('经度').closest('th');
      await user.click(longitudeHeader!);

      // Results should still be displayed (sorting is internal)
      expect(screen.getByText('wx4g0ec1')).toBeInTheDocument();
      expect(screen.getByText('wx4g0ec2')).toBeInTheDocument();
    });

    it('should handle filtering interactions correctly', async () => {
      const user = userEvent.setup();
      render(<ResultsDisplay {...mockProps} />);

      // Filter to show only successful results
      const filterSelect = screen.getByDisplayValue('全部结果');
      await user.selectOptions(filterSelect, 'success');

      // Should still show successful results
      expect(screen.getByText('wx4g0ec1')).toBeInTheDocument();
      expect(screen.getByText('wx4g0ec2')).toBeInTheDocument();
    });

    it('should handle copy interactions correctly', async () => {
      const user = userEvent.setup();
      render(<ResultsDisplay {...mockProps} />);

      // Click copy button for first result
      const copyButtons = screen.getAllByText('复制');
      await user.click(copyButtons[0]);

      expect(mockProps.onCopy).toHaveBeenCalledWith(mockResults[0]);
    });

    it('should handle copy all interaction correctly', async () => {
      const user = userEvent.setup();
      render(<ResultsDisplay {...mockProps} />);

      // Click copy all button
      const copyAllButton = screen.getByText('复制全部');
      await user.click(copyAllButton);

      expect(mockProps.onCopyAll).toHaveBeenCalledTimes(1);
    });

    it('should handle export interaction correctly', async () => {
      const user = userEvent.setup();
      render(<ResultsDisplay {...mockProps} />);

      // Click export button
      const exportButton = screen.getByText('导出CSV');
      await user.click(exportButton);

      expect(mockProps.onExport).toHaveBeenCalledTimes(1);
    });

    it('should show correct summary statistics', () => {
      render(<ResultsDisplay {...mockProps} />);

      expect(screen.getByText(/总计.*3/)).toBeInTheDocument();
      expect(screen.getByText(/成功.*2/)).toBeInTheDocument();
      expect(screen.getByText(/失败.*1/)).toBeInTheDocument();
    });

    it('should handle empty results correctly', () => {
      render(<ResultsDisplay {...mockProps} results={[]} />);

      expect(screen.getByText('暂无转换结果')).toBeInTheDocument();
      expect(screen.getByText('输入GeoHash编码并点击转换按钮开始')).toBeInTheDocument();
    });
  });

  describe('BatchProgressIndicator Integration', () => {
    const mockProgress: BatchProgress = {
      processed: 500,
      total: 1000,
      percentage: 50,
      currentChunk: 5,
      totalChunks: 10,
      processingRate: 25.5,
      estimatedTimeRemaining: 120,
      memoryUsage: 45.2,
    };

    it('should handle cancel interaction correctly', async () => {
      const user = userEvent.setup();
      const mockOnCancel = jest.fn();

      render(
        <BatchProgressIndicator
          progress={mockProgress}
          isProcessing={true}
          onCancel={mockOnCancel}
        />
      );

      // Click cancel button
      const cancelButton = screen.getByText('取消处理');
      await user.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it('should display progress information correctly', () => {
      render(
        <BatchProgressIndicator
          progress={mockProgress}
          isProcessing={true}
        />
      );

      expect(screen.getByText('已处理: 500 / 1,000')).toBeInTheDocument();
      expect(screen.getByText('50.0%')).toBeInTheDocument();
      expect(screen.getByText('5 / 10')).toBeInTheDocument();
      expect(screen.getByText('25.5/秒')).toBeInTheDocument();
    });

    it('should show performance indicators based on processing rate', () => {
      const highRateProgress = { ...mockProgress, processingRate: 150 };
      const { rerender } = render(
        <BatchProgressIndicator
          progress={highRateProgress}
          isProcessing={true}
        />
      );

      expect(screen.getByText('高速处理')).toBeInTheDocument();

      const lowRateProgress = { ...mockProgress, processingRate: 5 };
      rerender(
        <BatchProgressIndicator
          progress={lowRateProgress}
          isProcessing={true}
        />
      );

      expect(screen.getByText('处理较慢')).toBeInTheDocument();
    });
  });

  describe('VirtualizedResultsDisplay Integration', () => {
    const generateMockResults = (count: number): ConversionResult[] => {
      return Array.from({ length: count }, (_, i) => ({
        input: `wx4g0ec${i.toString().padStart(4, '0')}`,
        success: i % 10 !== 0, // Every 10th item fails
        longitude: i % 10 !== 0 ? 116.404 + i * 0.001 : undefined,
        latitude: i % 10 !== 0 ? 39.915 + i * 0.001 : undefined,
        error: i % 10 === 0 ? 'Test error' : undefined,
        coordinateSystem: 'BD09' as const,
      }));
    };

    const mockProps = {
      results: generateMockResults(1000),
      onCopy: jest.fn(),
      onCopyAll: jest.fn(),
      onExport: jest.fn(),
    };

    it('should show virtualization notice for large datasets', () => {
      render(<VirtualizedResultsDisplay {...mockProps} />);

      expect(screen.getByText('已启用虚拟化渲染以优化大批量数据显示性能')).toBeInTheDocument();
    });

    it('should handle sorting in virtualized display', async () => {
      const user = userEvent.setup();
      render(<VirtualizedResultsDisplay {...mockProps} />);

      // Click on status header to sort
      const statusHeader = screen.getByText('状态').closest('button');
      await user.click(statusHeader!);

      // Should still render without errors
      expect(screen.getByText('总计:')).toBeInTheDocument();
    });

    it('should handle filtering in virtualized display', async () => {
      const user = userEvent.setup();
      render(<VirtualizedResultsDisplay {...mockProps} />);

      // Filter to show only successful results
      const filterSelect = screen.getByDisplayValue('全部结果');
      await user.selectOptions(filterSelect, 'success');

      // Should update display count
      expect(screen.getByText(/显示.*900/)).toBeInTheDocument(); // 900 successful out of 1000
    });

    it('should handle virtual scrolling correctly', () => {
      render(
        <VirtualizedResultsDisplay
          {...mockProps}
          containerHeight={400}
          itemHeight={60}
        />
      );

      // Should render without errors and show correct total
      expect(screen.getByText('1,000')).toBeInTheDocument();
    });
  });

  describe('Component Integration Scenarios', () => {
    // Test how components work together in realistic scenarios
    
    it('should handle input validation and result display integration', async () => {
      const user = userEvent.setup();
      
      // Mock a complete workflow component
      const WorkflowComponent: React.FC = () => {
        const [input, setInput] = React.useState('');
        const [results, setResults] = React.useState<ConversionResult[]>([]);
        const [coordinateSystem, setCoordinateSystem] = React.useState<'BD09' | 'GPS84'>('BD09');

        const handleConvert = () => {
          // Simulate conversion
          const result: ConversionResult = {
            input: input.trim(),
            success: input.length >= 4,
            longitude: input.length >= 4 ? 116.404 : undefined,
            latitude: input.length >= 4 ? 39.915 : undefined,
            error: input.length < 4 ? 'Too short' : undefined,
            coordinateSystem,
          };
          setResults([result]);
        };

        return (
          <div>
            <InputSection
              value={input}
              onChange={setInput}
              coordinateSystem={coordinateSystem}
              onCoordinateSystemChange={setCoordinateSystem}
              isBatchMode={false}
              onBatchModeChange={() => {}}
              onConvert={handleConvert}
              isProcessing={false}
              disabled={false}
            />
            <ResultsDisplay
              results={results}
              onCopy={() => {}}
              onCopyAll={() => {}}
              onExport={() => {}}
            />
          </div>
        );
      };

      render(<WorkflowComponent />);

      // Input valid geohash
      const input = screen.getByRole('textbox');
      await user.type(input, 'wx4g0ec1');

      // Convert
      const convertButton = screen.getByText('转换');
      await user.click(convertButton);

      // Should show successful result
      await waitFor(() => {
        expect(screen.getByText('成功: 1')).toBeInTheDocument();
      });

      // Clear input and try invalid geohash
      await user.clear(input);
      await user.type(input, 'abc');
      await user.click(convertButton);

      // Should show failed result
      await waitFor(() => {
        expect(screen.getByText('失败: 1')).toBeInTheDocument();
      });
    });

    it('should handle progress indicator and results display integration', async () => {
      const user = userEvent.setup();
      
      const ProgressWorkflowComponent: React.FC = () => {
        const [isProcessing, setIsProcessing] = React.useState(false);
        const [progress, setProgress] = React.useState<BatchProgress | null>(null);
        const [results, setResults] = React.useState<ConversionResult[]>([]);

        const handleStartProcessing = async () => {
          setIsProcessing(true);
          setResults([]);

          // Simulate progress updates
          for (let i = 0; i <= 100; i += 20) {
            setProgress({
              processed: i,
              total: 100,
              percentage: i,
              currentChunk: Math.floor(i / 20) + 1,
              totalChunks: 5,
              processingRate: 10,
              estimatedTimeRemaining: (100 - i) / 10,
            });
            await new Promise(resolve => setTimeout(resolve, 100));
          }

          // Complete processing
          setIsProcessing(false);
          setProgress(null);
          setResults([
            {
              input: 'wx4g0ec1',
              success: true,
              longitude: 116.404,
              latitude: 39.915,
              coordinateSystem: 'BD09',
            },
          ]);
        };

        return (
          <div>
            <button onClick={handleStartProcessing} disabled={isProcessing}>
              开始处理
            </button>
            <BatchProgressIndicator
              progress={progress}
              isProcessing={isProcessing}
            />
            <ResultsDisplay
              results={results}
              onCopy={() => {}}
              onCopyAll={() => {}}
              onExport={() => {}}
            />
          </div>
        );
      };

      render(<ProgressWorkflowComponent />);

      // Start processing
      const startButton = screen.getByText('开始处理');
      await user.click(startButton);

      // Should show progress indicator
      await waitFor(() => {
        expect(screen.getByText('批量处理进度')).toBeInTheDocument();
      });

      // Wait for completion
      await waitFor(() => {
        expect(screen.getByText('成功: 1')).toBeInTheDocument();
      }, { timeout: 2000 });

      // Progress indicator should be gone
      expect(screen.queryByText('批量处理进度')).not.toBeInTheDocument();
    });

    it('should handle error states across components', async () => {
      const user = userEvent.setup();
      
      const ErrorHandlingComponent: React.FC = () => {
        const [hasError, setHasError] = React.useState(false);
        const [results, setResults] = React.useState<ConversionResult[]>([]);

        const handleConvertWithError = () => {
          setHasError(true);
          setResults([
            {
              input: 'invalid',
              success: false,
              error: 'Conversion failed',
              coordinateSystem: 'BD09',
            },
          ]);
        };

        if (hasError) {
          return (
            <div>
              <div data-testid="error-message">转换过程中发生错误</div>
              <ResultsDisplay
                results={results}
                onCopy={() => {}}
                onCopyAll={() => {}}
                onExport={() => {}}
              />
            </div>
          );
        }

        return (
          <button onClick={handleConvertWithError}>
            触发错误
          </button>
        );
      };

      render(<ErrorHandlingComponent />);

      // Trigger error
      const errorButton = screen.getByText('触发错误');
      await user.click(errorButton);

      // Should show error message and failed result
      expect(screen.getByTestId('error-message')).toBeInTheDocument();
      expect(screen.getByText('失败: 1')).toBeInTheDocument();
      expect(screen.getByText('Conversion failed')).toBeInTheDocument();
    });
  });
});