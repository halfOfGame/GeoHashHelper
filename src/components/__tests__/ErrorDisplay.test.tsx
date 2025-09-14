/**
 * 错误显示组件测试
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ErrorDisplay from '../ErrorDisplay';
import { AppError, ErrorType, ErrorSeverity } from '../../types/error-types';

describe('ErrorDisplay', () => {
  const mockError: AppError = {
    type: ErrorType.INVALID_GEOHASH,
    severity: ErrorSeverity.MEDIUM,
    message: 'Test error message',
    details: 'Test error details',
    input: 'test_input',
    suggestions: ['Suggestion 1', 'Suggestion 2'],
    timestamp: new Date('2023-01-01'),
    recoverable: true,
    retryable: true
  };

  it('应该显示错误消息', () => {
    render(<ErrorDisplay error={mockError} />);
    
    expect(screen.getByText('Test error message')).toBeInTheDocument();
  });

  it('应该显示错误详情', () => {
    render(<ErrorDisplay error={mockError} />);
    
    expect(screen.getByText('Test error details')).toBeInTheDocument();
  });

  it('应该显示输入内容', () => {
    render(<ErrorDisplay error={mockError} />);
    
    expect(screen.getByText(/输入内容:/)).toBeInTheDocument();
    expect(screen.getByText('test_input')).toBeInTheDocument();
  });

  it('应该显示建议列表', () => {
    render(<ErrorDisplay error={mockError} />);
    
    expect(screen.getByText('建议解决方案:')).toBeInTheDocument();
    expect(screen.getByText('Suggestion 1')).toBeInTheDocument();
    expect(screen.getByText('Suggestion 2')).toBeInTheDocument();
  });

  it('应该在可重试时显示重试按钮', () => {
    const onRetry = jest.fn();
    render(<ErrorDisplay error={mockError} onRetry={onRetry} />);
    
    const retryButton = screen.getByText('重试');
    expect(retryButton).toBeInTheDocument();
    
    fireEvent.click(retryButton);
    expect(onRetry).toHaveBeenCalled();
  });

  it('应该在不可重试时不显示重试按钮', () => {
    const nonRetryableError = { ...mockError, retryable: false };
    render(<ErrorDisplay error={nonRetryableError} />);
    
    expect(screen.queryByText('重试')).not.toBeInTheDocument();
  });

  it('应该显示关闭按钮', () => {
    const onDismiss = jest.fn();
    render(<ErrorDisplay error={mockError} onDismiss={onDismiss} />);
    
    const dismissButton = screen.getByText('关闭');
    expect(dismissButton).toBeInTheDocument();
    
    fireEvent.click(dismissButton);
    expect(onDismiss).toHaveBeenCalled();
  });

  it('应该显示恢复操作按钮', () => {
    const recoveryAction = {
      label: 'Custom Action',
      action: jest.fn(),
      type: 'custom' as const
    };
    
    render(
      <ErrorDisplay 
        error={mockError} 
        recoveryActions={[recoveryAction]} 
      />
    );
    
    const actionButton = screen.getByText('Custom Action');
    expect(actionButton).toBeInTheDocument();
    
    fireEvent.click(actionButton);
    expect(recoveryAction.action).toHaveBeenCalled();
  });

  it('应该显示时间戳', () => {
    render(<ErrorDisplay error={mockError} />);
    
    expect(screen.getByText(/发生时间:/)).toBeInTheDocument();
  });

  it('应该根据严重程度应用不同样式', () => {
    const { rerender } = render(<ErrorDisplay error={mockError} />);
    
    // 测试中等严重程度
    expect(document.querySelector('.bg-orange-50')).toBeInTheDocument();
    
    // 测试高严重程度
    const highSeverityError = { ...mockError, severity: ErrorSeverity.HIGH };
    rerender(<ErrorDisplay error={highSeverityError} />);
    expect(document.querySelector('.bg-red-50')).toBeInTheDocument();
    
    // 测试低严重程度
    const lowSeverityError = { ...mockError, severity: ErrorSeverity.LOW };
    rerender(<ErrorDisplay error={lowSeverityError} />);
    expect(document.querySelector('.bg-yellow-50')).toBeInTheDocument();
  });

  it('应该处理没有详情和建议的错误', () => {
    const minimalError: AppError = {
      type: ErrorType.UNKNOWN_ERROR,
      severity: ErrorSeverity.MEDIUM,
      message: 'Minimal error',
      timestamp: new Date(),
      recoverable: true,
      retryable: false
    };
    
    render(<ErrorDisplay error={minimalError} />);
    
    expect(screen.getByText('Minimal error')).toBeInTheDocument();
    expect(screen.queryByText('建议解决方案:')).not.toBeInTheDocument();
    expect(screen.queryByText(/输入内容:/)).not.toBeInTheDocument();
  });
});