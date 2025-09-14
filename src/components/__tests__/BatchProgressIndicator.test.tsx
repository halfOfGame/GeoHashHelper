/**
 * 批量进度指示器组件测试
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import BatchProgressIndicator from '../BatchProgressIndicator';
import { BatchProgress } from '../../lib/optimized-batch-processor';

describe('BatchProgressIndicator', () => {
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

  it('should not render when not processing and no progress', () => {
    const { container } = render(
      <BatchProgressIndicator
        progress={null}
        isProcessing={false}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('should render loading state when processing but no progress yet', () => {
    render(
      <BatchProgressIndicator
        progress={null}
        isProcessing={true}
      />
    );

    expect(screen.getByText('正在初始化批量处理...')).toBeInTheDocument();
    expect(screen.getByText('批量处理进度')).toBeInTheDocument();
  });

  it('should render progress information correctly', () => {
    render(
      <BatchProgressIndicator
        progress={mockProgress}
        isProcessing={true}
      />
    );

    // Check main progress info
    expect(screen.getByText('已处理: 500 / 1,000')).toBeInTheDocument();
    expect(screen.getByText('50.0%')).toBeInTheDocument();

    // Check detailed stats
    expect(screen.getByText('5 / 10')).toBeInTheDocument(); // Current chunk
    expect(screen.getByText('25.5/秒')).toBeInTheDocument(); // Processing rate
    expect(screen.getByText('2分0秒')).toBeInTheDocument(); // Estimated time
    expect(screen.getByText('45.2MB')).toBeInTheDocument(); // Memory usage
  });

  it('should render progress bar with correct width', () => {
    render(
      <BatchProgressIndicator
        progress={mockProgress}
        isProcessing={true}
      />
    );

    const progressBar = document.querySelector('.bg-blue-600');
    expect(progressBar).toHaveStyle('width: 50%');
  });

  it('should render cancel button when onCancel is provided', () => {
    const mockOnCancel = jest.fn();
    
    render(
      <BatchProgressIndicator
        progress={mockProgress}
        isProcessing={true}
        onCancel={mockOnCancel}
      />
    );

    const cancelButton = screen.getByText('取消处理');
    expect(cancelButton).toBeInTheDocument();

    fireEvent.click(cancelButton);
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('should not render cancel button when onCancel is not provided', () => {
    render(
      <BatchProgressIndicator
        progress={mockProgress}
        isProcessing={true}
      />
    );

    expect(screen.queryByText('取消处理')).not.toBeInTheDocument();
  });

  it('should format time correctly for different durations', () => {
    const progressWithShortTime: BatchProgress = {
      ...mockProgress,
      estimatedTimeRemaining: 45,
    };

    const { rerender } = render(
      <BatchProgressIndicator
        progress={progressWithShortTime}
        isProcessing={true}
      />
    );

    expect(screen.getByText('45秒')).toBeInTheDocument();

    const progressWithLongTime: BatchProgress = {
      ...mockProgress,
      estimatedTimeRemaining: 3665, // 1 hour, 1 minute, 5 seconds
    };

    rerender(
      <BatchProgressIndicator
        progress={progressWithLongTime}
        isProcessing={true}
      />
    );

    expect(screen.getByText('1小时1分钟')).toBeInTheDocument();
  });

  it('should format memory usage correctly for different sizes', () => {
    const progressWithSmallMemory: BatchProgress = {
      ...mockProgress,
      memoryUsage: 0.5, // 0.5 MB
    };

    const { rerender } = render(
      <BatchProgressIndicator
        progress={progressWithSmallMemory}
        isProcessing={true}
      />
    );

    expect(screen.getByText('512KB')).toBeInTheDocument();

    const progressWithLargeMemory: BatchProgress = {
      ...mockProgress,
      memoryUsage: 1536, // 1.5 GB
    };

    rerender(
      <BatchProgressIndicator
        progress={progressWithLargeMemory}
        isProcessing={true}
      />
    );

    expect(screen.getByText('1.5GB')).toBeInTheDocument();
  });

  it('should format processing rate correctly for different speeds', () => {
    const progressWithSlowRate: BatchProgress = {
      ...mockProgress,
      processingRate: 0.5, // 0.5 per second
    };

    const { rerender } = render(
      <BatchProgressIndicator
        progress={progressWithSlowRate}
        isProcessing={true}
      />
    );

    expect(screen.getByText('30.0/分钟')).toBeInTheDocument();

    const progressWithFastRate: BatchProgress = {
      ...mockProgress,
      processingRate: 150, // 150 per second
    };

    rerender(
      <BatchProgressIndicator
        progress={progressWithFastRate}
        isProcessing={true}
      />
    );

    expect(screen.getByText('2.5K/秒')).toBeInTheDocument();
  });

  it('should show performance indicators based on processing rate', () => {
    const progressWithHighRate: BatchProgress = {
      ...mockProgress,
      processingRate: 150,
    };

    const { rerender } = render(
      <BatchProgressIndicator
        progress={progressWithHighRate}
        isProcessing={true}
      />
    );

    expect(screen.getByText('高速处理')).toBeInTheDocument();

    const progressWithLowRate: BatchProgress = {
      ...mockProgress,
      processingRate: 5,
    };

    rerender(
      <BatchProgressIndicator
        progress={progressWithLowRate}
        isProcessing={true}
      />
    );

    expect(screen.getByText('处理较慢')).toBeInTheDocument();
  });

  it('should show memory warning for high memory usage', () => {
    const progressWithHighMemory: BatchProgress = {
      ...mockProgress,
      memoryUsage: 150, // 150 MB
    };

    render(
      <BatchProgressIndicator
        progress={progressWithHighMemory}
        isProcessing={true}
      />
    );

    expect(screen.getByText('内存使用较高')).toBeInTheDocument();
  });

  it('should handle zero estimated time remaining', () => {
    const progressWithZeroTime: BatchProgress = {
      ...mockProgress,
      estimatedTimeRemaining: 0,
    };

    render(
      <BatchProgressIndicator
        progress={progressWithZeroTime}
        isProcessing={true}
      />
    );

    expect(screen.getByText('计算中...')).toBeInTheDocument();
  });

  it('should handle progress without memory usage', () => {
    const progressWithoutMemory: BatchProgress = {
      processed: 300,
      total: 1000,
      percentage: 30,
      currentChunk: 3,
      totalChunks: 10,
      processingRate: 20,
      estimatedTimeRemaining: 35,
    };

    render(
      <BatchProgressIndicator
        progress={progressWithoutMemory}
        isProcessing={true}
      />
    );

    // Should not show memory usage section
    expect(screen.queryByText('内存使用')).not.toBeInTheDocument();
    
    // But should show other stats
    expect(screen.getByText('已处理: 300 / 1,000')).toBeInTheDocument();
    expect(screen.getByText('30.0%')).toBeInTheDocument();
  });

  it('should handle 100% progress correctly', () => {
    const completeProgress: BatchProgress = {
      ...mockProgress,
      processed: 1000,
      total: 1000,
      percentage: 100,
      currentChunk: 10,
      totalChunks: 10,
      estimatedTimeRemaining: 0,
    };

    render(
      <BatchProgressIndicator
        progress={completeProgress}
        isProcessing={false}
      />
    );

    expect(screen.getByText('已处理: 1,000 / 1,000')).toBeInTheDocument();
    expect(screen.getByText('100.0%')).toBeInTheDocument();
    
    const progressBar = document.querySelector('.bg-blue-600');
    expect(progressBar).toHaveStyle('width: 100%');
  });
});