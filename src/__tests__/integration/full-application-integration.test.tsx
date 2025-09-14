/**
 * 完整应用集成测试
 * 测试所有功能模块的完整数据流和状态管理
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// Import the main layout component
import MainLayout from '../../components/MainLayout';

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn(() => Promise.resolve()),
  },
});

// Mock URL.createObjectURL for CSV export
global.URL.createObjectURL = jest.fn(() => 'mock-url');
global.URL.revokeObjectURL = jest.fn();

// Mock document.createElement for CSV download
const mockLink = {
  click: jest.fn(),
  setAttribute: jest.fn(),
  style: { visibility: '' },
};
const originalCreateElement = document.createElement;
document.createElement = jest.fn((tagName) => {
  if (tagName === 'a') {
    return mockLink as any;
  }
  return originalCreateElement.call(document, tagName);
});

// Mock document.body methods
const mockAppendChild = jest.fn();
const mockRemoveChild = jest.fn();
Object.defineProperty(document.body, 'appendChild', {
  value: mockAppendChild,
  writable: true,
});
Object.defineProperty(document.body, 'removeChild', {
  value: mockRemoveChild,
  writable: true,
});

describe('Full Application Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mocks
    (navigator.clipboard.writeText as jest.Mock).mockResolvedValue(undefined);
    mockLink.click.mockClear();
    mockLink.setAttribute.mockClear();
    mockAppendChild.mockClear();
    mockRemoveChild.mockClear();
  });

  afterEach(() => {
    // Clean up any timers
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Complete Single Conversion Workflow', () => {
    it('should handle complete single conversion workflow with BD09 coordinate system', async () => {
      jest.useFakeTimers();
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      
      render(<MainLayout />);

      // Verify initial state
      expect(screen.getByText('GeoHash坐标转换工具')).toBeInTheDocument();
      expect(screen.getByDisplayValue('BD09')).toBeChecked();

      // Input a valid geohash
      const input = screen.getByRole('textbox');
      await user.type(input, 'wx4g0ec1');

      // Click convert button
      const convertBtn = screen.getByText('转换');
      expect(convertBtn).not.toBeDisabled();
      
      await user.click(convertBtn);

      // Wait for conversion to complete
      await waitFor(() => {
        expect(screen.getByText('转换结果')).toBeInTheDocument();
      });

      // Verify results are displayed
      expect(screen.getByText('wx4g0ec1')).toBeInTheDocument();
      expect(screen.getByText('成功')).toBeInTheDocument();

      // Test copy functionality
      const copyButton = screen.getByText('复制');
      await user.click(copyButton);

      expect(navigator.clipboard.writeText).toHaveBeenCalled();

      // Fast-forward timers to clear feedback messages
      act(() => {
        jest.advanceTimersByTime(3000);
      });

      jest.useRealTimers();
    });

    it('should handle complete single conversion workflow with GPS84 coordinate system', async () => {
      jest.useFakeTimers();
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      
      render(<MainLayout />);

      // Switch to GPS84 coordinate system
      const gps84Radio = screen.getByLabelText('GPS84坐标系');
      await user.click(gps84Radio);
      expect(gps84Radio).toBeChecked();

      // Input and convert
      const input = screen.getByRole('textbox');
      await user.type(input, 'wx4g0ec1');
      await user.click(screen.getByText('转换'));

      // Wait for results
      await waitFor(() => {
        expect(screen.getByText('转换结果')).toBeInTheDocument();
      });

      // Verify GPS84 conversion worked
      expect(screen.getByText('wx4g0ec1')).toBeInTheDocument();
      expect(screen.getByText('成功')).toBeInTheDocument();

      jest.useRealTimers();
    });
  });

  describe('Complete Batch Conversion Workflow', () => {
    it('should handle complete batch conversion workflow', async () => {
      jest.useFakeTimers();
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      
      render(<MainLayout />);

      // Enable batch mode
      const batchModeCheckbox = screen.getByLabelText('批量模式');
      await user.click(batchModeCheckbox);
      expect(batchModeCheckbox).toBeChecked();

      // Input multiple geohashes
      const input = screen.getByRole('textbox');
      const batchInput = 'wx4g0ec1\nwx4g0ec2\nwx4g0ec3\ninvalid\nwx4g0ec4';
      await user.type(input, batchInput);

      // Start conversion
      await user.click(screen.getByText('转换'));

      // Wait for batch processing to complete
      await waitFor(() => {
        expect(screen.getByText('转换结果')).toBeInTheDocument();
      }, { timeout: 5000 });

      // Verify batch results
      expect(screen.getByText(/总计.*5/)).toBeInTheDocument();
      expect(screen.getByText(/成功.*4/)).toBeInTheDocument();
      expect(screen.getByText(/失败.*1/)).toBeInTheDocument();

      // Test batch copy functionality
      const copyAllButton = screen.getByText('复制全部');
      await user.click(copyAllButton);

      expect(navigator.clipboard.writeText).toHaveBeenCalled();

      // Test export functionality
      const exportButton = screen.getByText('导出CSV');
      await user.click(exportButton);

      expect(mockLink.setAttribute).toHaveBeenCalledWith('href', 'mock-url');
      expect(mockLink.setAttribute).toHaveBeenCalledWith('download', expect.stringMatching(/geohash_conversion_.*\.csv/));
      expect(mockLink.click).toHaveBeenCalled();

      jest.useRealTimers();
    });

    it('should handle large batch processing with progress indication', async () => {
      jest.useFakeTimers();
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      
      render(<MainLayout />);

      // Enable batch mode
      await user.click(screen.getByLabelText('批量模式'));

      // Input large batch (simulate 100 items)
      const largeInput = Array.from({ length: 100 }, (_, i) => `wx4g0ec${i.toString().padStart(3, '0')}`).join('\n');
      const input = screen.getByRole('textbox');
      await user.type(input, largeInput);

      // Start conversion
      await user.click(screen.getByText('转换'));

      // Should show progress during processing
      await waitFor(() => {
        expect(screen.getByText(/正在转换/)).toBeInTheDocument();
      });

      // Wait for completion
      await waitFor(() => {
        expect(screen.getByText('转换结果')).toBeInTheDocument();
      }, { timeout: 10000 });

      // Verify large batch results
      expect(screen.getByText(/总计.*100/)).toBeInTheDocument();

      jest.useRealTimers();
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle input validation errors gracefully', async () => {
      const user = userEvent.setup();
      render(<MainLayout />);

      // Input invalid geohash
      const input = screen.getByRole('textbox');
      await user.type(input, 'abc'); // Too short

      // Convert
      await user.click(screen.getByText('转换'));

      // Wait for results
      await waitFor(() => {
        expect(screen.getByText('转换结果')).toBeInTheDocument();
      });

      // Should show error result
      expect(screen.getByText('失败')).toBeInTheDocument();
      expect(screen.getByText(/无效的GeoHash格式/)).toBeInTheDocument();
    });

    it('should handle clipboard errors gracefully', async () => {
      jest.useFakeTimers();
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      
      // Mock clipboard to fail
      (navigator.clipboard.writeText as jest.Mock).mockRejectedValue(new Error('Clipboard access denied'));

      render(<MainLayout />);

      // Convert a geohash first
      const input = screen.getByRole('textbox');
      await user.type(input, 'wx4g0ec1');
      await user.click(screen.getByText('转换'));

      await waitFor(() => {
        expect(screen.getByText('转换结果')).toBeInTheDocument();
      });

      // Try to copy (should fail)
      const copyButton = screen.getByText('复制');
      await user.click(copyButton);

      // Should show error feedback
      await waitFor(() => {
        expect(screen.getByText(/复制失败/)).toBeInTheDocument();
      });

      jest.useRealTimers();
    });

    it('should handle export errors gracefully', async () => {
      jest.useFakeTimers();
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      
      // Mock URL.createObjectURL to fail
      (global.URL.createObjectURL as jest.Mock).mockImplementation(() => {
        throw new Error('Blob creation failed');
      });

      render(<MainLayout />);

      // Convert a geohash first
      const input = screen.getByRole('textbox');
      await user.type(input, 'wx4g0ec1');
      await user.click(screen.getByText('转换'));

      await waitFor(() => {
        expect(screen.getByText('转换结果')).toBeInTheDocument();
      });

      // Try to export (should fail)
      const exportButton = screen.getByText('导出CSV');
      await user.click(exportButton);

      // Should show error feedback
      await waitFor(() => {
        expect(screen.getByText(/导出失败/)).toBeInTheDocument();
      });

      jest.useRealTimers();
    });
  });

  describe('User Experience Integration', () => {
    it('should show help modal and close it properly', async () => {
      const user = userEvent.setup();
      render(<MainLayout />);

      // Open help modal
      const helpButton = screen.getByText('详细帮助');
      await user.click(helpButton);

      // Should show help modal
      await waitFor(() => {
        expect(screen.getByText('使用帮助')).toBeInTheDocument();
      });

      // Close help modal
      const closeButton = screen.getByLabelText('关闭');
      await user.click(closeButton);

      // Should close help modal
      await waitFor(() => {
        expect(screen.queryByText('使用帮助')).not.toBeInTheDocument();
      });
    });

    it('should handle mode switching correctly', async () => {
      const user = userEvent.setup();
      render(<MainLayout />);

      // Initially in single mode
      expect(screen.getByPlaceholderText(/输入单个GeoHash/)).toBeInTheDocument();

      // Switch to batch mode
      const batchModeCheckbox = screen.getByLabelText('批量模式');
      await user.click(batchModeCheckbox);

      // Should show batch mode placeholder
      expect(screen.getByPlaceholderText(/输入多个GeoHash/)).toBeInTheDocument();

      // Switch back to single mode
      await user.click(batchModeCheckbox);

      // Should show single mode placeholder again
      expect(screen.getByPlaceholderText(/输入单个GeoHash/)).toBeInTheDocument();
    });

    it('should handle coordinate system switching correctly', async () => {
      const user = userEvent.setup();
      render(<MainLayout />);

      // Initially BD09 is selected
      expect(screen.getByDisplayValue('BD09')).toBeChecked();

      // Switch to GPS84
      const gps84Radio = screen.getByLabelText('GPS84坐标系');
      await user.click(gps84Radio);
      expect(gps84Radio).toBeChecked();

      // Switch back to BD09
      const bd09Radio = screen.getByLabelText('百度09坐标系');
      await user.click(bd09Radio);
      expect(bd09Radio).toBeChecked();
    });
  });

  describe('Performance and State Management Integration', () => {
    it('should maintain state consistency during rapid interactions', async () => {
      jest.useFakeTimers();
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      
      render(<MainLayout />);

      const input = screen.getByRole('textbox');
      const convertBtn = screen.getByText('转换');

      // Rapid input changes
      await user.type(input, 'wx4g0ec1');
      await user.clear(input);
      await user.type(input, 'wx4g0ec2');

      // Convert
      await user.click(convertBtn);

      // Wait for results
      await waitFor(() => {
        expect(screen.getByText('转换结果')).toBeInTheDocument();
      });

      // Should show the latest input result
      expect(screen.getByText('wx4g0ec2')).toBeInTheDocument();

      jest.useRealTimers();
    });

    it('should handle concurrent operations correctly', async () => {
      jest.useFakeTimers();
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      
      render(<MainLayout />);

      // Start first conversion
      const input = screen.getByRole('textbox');
      await user.type(input, 'wx4g0ec1');
      await user.click(screen.getByText('转换'));

      // Immediately try another conversion (should be disabled)
      const convertBtn = screen.getByText(/转换/);
      expect(convertBtn).toBeDisabled();

      // Wait for first conversion to complete
      await waitFor(() => {
        expect(screen.getByText('转换结果')).toBeInTheDocument();
      });

      // Button should be enabled again
      expect(convertBtn).not.toBeDisabled();

      jest.useRealTimers();
    });
  });

  describe('Accessibility Integration', () => {
    it('should maintain proper focus management', async () => {
      const user = userEvent.setup();
      render(<MainLayout />);

      // Tab through interactive elements
      await user.tab();
      expect(screen.getByLabelText('百度09坐标系')).toHaveFocus();

      await user.tab();
      expect(screen.getByLabelText('GPS84坐标系')).toHaveFocus();

      await user.tab();
      expect(screen.getByLabelText('批量模式')).toHaveFocus();

      await user.tab();
      expect(screen.getByRole('textbox')).toHaveFocus();

      await user.tab();
      expect(screen.getByText('转换')).toHaveFocus();
    });

    it('should provide proper ARIA labels and descriptions', () => {
      render(<MainLayout />);

      // Check for proper labeling
      expect(screen.getByLabelText('百度09坐标系')).toBeInTheDocument();
      expect(screen.getByLabelText('GPS84坐标系')).toBeInTheDocument();
      expect(screen.getByLabelText('批量模式')).toBeInTheDocument();
      expect(screen.getByRole('textbox')).toHaveAttribute('placeholder');
    });
  });

  describe('Data Flow Integration', () => {
    it('should maintain proper data flow from input to results', async () => {
      const user = userEvent.setup();
      render(<MainLayout />);

      // Test single conversion data flow
      const input = screen.getByRole('textbox');
      await user.type(input, 'wx4g0ec1');
      
      // Select GPS84
      await user.click(screen.getByLabelText('GPS84坐标系'));
      
      // Convert
      await user.click(screen.getByText('转换'));

      // Wait for results
      await waitFor(() => {
        expect(screen.getByText('转换结果')).toBeInTheDocument();
      });

      // Verify data integrity
      expect(screen.getByText('wx4g0ec1')).toBeInTheDocument(); // Original input preserved
      expect(screen.getByText('成功')).toBeInTheDocument(); // Conversion status
      // Coordinates should be displayed (exact values depend on implementation)
    });

    it('should handle state transitions correctly', async () => {
      jest.useFakeTimers();
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      
      render(<MainLayout />);

      // Initial state: no results
      expect(screen.getByText('暂无转换结果')).toBeInTheDocument();

      // Input and convert
      const input = screen.getByRole('textbox');
      await user.type(input, 'wx4g0ec1');
      await user.click(screen.getByText('转换'));

      // Processing state
      expect(screen.getByText('转换中...')).toBeInTheDocument();

      // Wait for completion
      await waitFor(() => {
        expect(screen.getByText('转换结果')).toBeInTheDocument();
      });

      // Results state
      expect(screen.queryByText('暂无转换结果')).not.toBeInTheDocument();
      expect(screen.getByText('wx4g0ec1')).toBeInTheDocument();

      // Clear input and convert again
      await user.clear(input);
      await user.click(screen.getByText('转换'));

      // Should handle empty input gracefully (button should be disabled)
      expect(screen.getByText('转换')).toBeDisabled();

      jest.useRealTimers();
    });
  });
});