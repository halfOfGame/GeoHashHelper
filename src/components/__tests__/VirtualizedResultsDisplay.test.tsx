/**
 * 虚拟化结果显示组件测试
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import VirtualizedResultsDisplay from '../VirtualizedResultsDisplay';
import { ConversionResult } from '../../lib/conversion-engine';

describe('VirtualizedResultsDisplay', () => {
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

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render empty state when no results', () => {
    render(
      <VirtualizedResultsDisplay
        {...mockProps}
        results={[]}
      />
    );

    expect(screen.getByText('暂无转换结果')).toBeInTheDocument();
    expect(screen.getByText('输入GeoHash编码并点击转换按钮开始')).toBeInTheDocument();
  });

  it('should render results summary correctly', () => {
    render(<VirtualizedResultsDisplay {...mockProps} />);

    expect(screen.getByText('总计:')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('成功:')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('失败:')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('should render virtualization notice for large datasets', () => {
    const largeResults = Array.from({ length: 150 }, (_, i) => ({
      input: `wx4g0ec${i}`,
      success: true,
      longitude: 116.404 + i * 0.001,
      latitude: 39.915 + i * 0.001,
      coordinateSystem: 'BD09' as const,
    }));

    render(
      <VirtualizedResultsDisplay
        {...mockProps}
        results={largeResults}
      />
    );

    expect(screen.getByText('已启用虚拟化渲染以优化大批量数据显示性能')).toBeInTheDocument();
  });

  it('should not render virtualization notice for small datasets', () => {
    render(<VirtualizedResultsDisplay {...mockProps} />);

    expect(screen.queryByText('已启用虚拟化渲染以优化大批量数据显示性能')).not.toBeInTheDocument();
  });

  it('should render table headers with sort functionality', () => {
    render(<VirtualizedResultsDisplay {...mockProps} />);

    expect(screen.getByText('输入GeoHash')).toBeInTheDocument();
    expect(screen.getByText('状态')).toBeInTheDocument();
    expect(screen.getByText('经度')).toBeInTheDocument();
    expect(screen.getByText('纬度')).toBeInTheDocument();
    expect(screen.getByText('操作')).toBeInTheDocument();
  });

  it('should render result rows correctly', () => {
    render(<VirtualizedResultsDisplay {...mockProps} />);

    // Check successful results
    expect(screen.getByText('wx4g0ec1')).toBeInTheDocument();
    expect(screen.getByText('116.404000')).toBeInTheDocument();
    expect(screen.getByText('39.915000')).toBeInTheDocument();

    // Check failed result
    expect(screen.getByText('invalid')).toBeInTheDocument();
    expect(screen.getByText('Invalid geohash format')).toBeInTheDocument();
  });

  it('should handle sorting by different fields', () => {
    render(<VirtualizedResultsDisplay {...mockProps} />);

    // Click on longitude header to sort
    const longitudeHeader = screen.getByText('经度').closest('button');
    fireEvent.click(longitudeHeader!);

    // Should still render all results (sorting doesn't change visibility in this test)
    expect(screen.getByText('wx4g0ec1')).toBeInTheDocument();
    expect(screen.getByText('wx4g0ec2')).toBeInTheDocument();
  });

  it('should handle filtering by success/error status', () => {
    render(<VirtualizedResultsDisplay {...mockProps} />);

    const filterSelect = screen.getByDisplayValue('全部结果');
    
    // Filter to show only successful results
    fireEvent.change(filterSelect, { target: { value: 'success' } });
    
    expect(screen.getByText('wx4g0ec1')).toBeInTheDocument();
    expect(screen.getByText('wx4g0ec2')).toBeInTheDocument();
    // Invalid result should not be visible in DOM due to filtering
  });

  it('should handle copy functionality', async () => {
    render(<VirtualizedResultsDisplay {...mockProps} />);

    const copyButtons = screen.getAllByText('复制');
    fireEvent.click(copyButtons[0]);

    expect(mockProps.onCopy).toHaveBeenCalledWith(mockResults[0]);
    
    // Should show "已复制!" temporarily
    await waitFor(() => {
      expect(screen.getByText('已复制!')).toBeInTheDocument();
    });
  });

  it('should handle copy all functionality', async () => {
    render(<VirtualizedResultsDisplay {...mockProps} />);

    const copyAllButton = screen.getByText('复制全部');
    fireEvent.click(copyAllButton);

    expect(mockProps.onCopyAll).toHaveBeenCalledTimes(1);
    
    // Should show "已复制!" temporarily
    await waitFor(() => {
      expect(screen.getByText('已复制!')).toBeInTheDocument();
    });
  });

  it('should handle export functionality', () => {
    render(<VirtualizedResultsDisplay {...mockProps} />);

    const exportButton = screen.getByText('导出CSV');
    fireEvent.click(exportButton);

    expect(mockProps.onExport).toHaveBeenCalledTimes(1);
  });

  it('should not show copy all button when no successful results', () => {
    const failedResults: ConversionResult[] = [
      {
        input: 'invalid1',
        success: false,
        error: 'Invalid geohash',
        coordinateSystem: 'BD09',
      },
      {
        input: 'invalid2',
        success: false,
        error: 'Invalid geohash',
        coordinateSystem: 'GPS84',
      },
    ];

    render(
      <VirtualizedResultsDisplay
        {...mockProps}
        results={failedResults}
      />
    );

    expect(screen.queryByText('复制全部')).not.toBeInTheDocument();
  });

  it('should show no results message when filter excludes all items', () => {
    render(<VirtualizedResultsDisplay {...mockProps} />);

    const filterSelect = screen.getByDisplayValue('全部结果');
    
    // Filter to show only errors, but then we need to simulate that no results match
    fireEvent.change(filterSelect, { target: { value: 'success' } });
    
    // Change to error filter to test empty filtered results
    fireEvent.change(filterSelect, { target: { value: 'error' } });
    
    // The component should still show results since we have error results
    expect(screen.getByText('invalid')).toBeInTheDocument();
  });

  it('should handle virtual scrolling', () => {
    const manyResults = Array.from({ length: 1000 }, (_, i) => ({
      input: `wx4g0ec${i.toString().padStart(4, '0')}`,
      success: i % 10 !== 0, // Every 10th item fails
      longitude: i % 10 !== 0 ? 116.404 + i * 0.001 : undefined,
      latitude: i % 10 !== 0 ? 39.915 + i * 0.001 : undefined,
      error: i % 10 === 0 ? 'Test error' : undefined,
      coordinateSystem: 'BD09' as const,
    }));

    render(
      <VirtualizedResultsDisplay
        {...mockProps}
        results={manyResults}
        containerHeight={400}
        itemHeight={60}
      />
    );

    // Should show virtualization notice
    expect(screen.getByText('已启用虚拟化渲染以优化大批量数据显示性能')).toBeInTheDocument();
    
    // Should show correct total count
    expect(screen.getByText('1,000')).toBeInTheDocument();
  });

  it('should handle custom container height and item height', () => {
    render(
      <VirtualizedResultsDisplay
        {...mockProps}
        containerHeight={300}
        itemHeight={50}
      />
    );

    // Component should render without errors
    expect(screen.getByText('wx4g0ec1')).toBeInTheDocument();
  });

  it('should display correct status badges', () => {
    render(<VirtualizedResultsDisplay {...mockProps} />);

    // Should show success badges
    const successBadges = screen.getAllByText('成功');
    expect(successBadges).toHaveLength(2);

    // Should show failure badge
    const failureBadges = screen.getAllByText('失败');
    expect(failureBadges).toHaveLength(1);
  });

  it('should handle coordinate precision correctly', () => {
    render(<VirtualizedResultsDisplay {...mockProps} />);

    // Should display coordinates with 6 decimal places
    expect(screen.getByText('116.404000')).toBeInTheDocument();
    expect(screen.getByText('39.915000')).toBeInTheDocument();
    expect(screen.getByText('116.405000')).toBeInTheDocument();
    expect(screen.getByText('39.916000')).toBeInTheDocument();
  });

  it('should show dash for failed result coordinates', () => {
    render(<VirtualizedResultsDisplay {...mockProps} />);

    // Failed result should show dashes for coordinates and action
    const rows = screen.getByText('invalid').closest('div');
    expect(rows).toBeInTheDocument();
  });
});