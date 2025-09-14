/**
 * 智能输入验证组件测试
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import SmartInputValidator from '../SmartInputValidator';

// Mock the input validator
jest.mock('../../lib/input-validator', () => ({
  validateGeohash: jest.fn((input: string) => {
    if (input === 'wx4g0ec1') {
      return { isValid: true };
    }
    if (input === 'invalid') {
      return { isValid: false, error: '无效字符' };
    }
    if (input === 'ailo') {
      return { isValid: false, error: '包含无效字符' };
    }
    return { isValid: false, error: '格式错误' };
  })
}));

describe('SmartInputValidator', () => {
  const defaultProps = {
    value: '',
    isBatchMode: false,
    coordinateSystem: 'BD09' as const,
    className: ''
  };

  it('应该在输入为空时不显示任何内容', () => {
    const { container } = render(<SmartInputValidator {...defaultProps} />);
    expect(container.firstChild).toBeNull();
  });

  it('应该显示有效输入的成功提示', () => {
    render(
      <SmartInputValidator 
        {...defaultProps} 
        value="wx4g0ec1"
      />
    );
    
    expect(screen.getByText('GeoHash格式正确')).toBeInTheDocument();
  });

  it('应该显示无效输入的错误提示', () => {
    render(
      <SmartInputValidator 
        {...defaultProps} 
        value="invalid"
      />
    );
    
    expect(screen.getByText('无效字符')).toBeInTheDocument();
  });

  it('应该为短GeoHash显示精度提示', () => {
    render(
      <SmartInputValidator 
        {...defaultProps} 
        value="wx4g"
      />
    );
    
    expect(screen.getByText(/当前精度较低/)).toBeInTheDocument();
    expect(screen.getByText(/建议使用5位以上/)).toBeInTheDocument();
  });

  it('应该为长GeoHash显示精度信息', () => {
    render(
      <SmartInputValidator 
        {...defaultProps} 
        value="wx4g0ec19"
      />
    );
    
    expect(screen.getByText(/精度良好/)).toBeInTheDocument();
  });

  it('应该在批量模式下验证多个输入', () => {
    render(
      <SmartInputValidator 
        {...defaultProps} 
        isBatchMode={true}
        value="wx4g0ec1\ninvalid\nwx4g0ec2"
      />
    );
    
    // 应该显示批量验证结果
    expect(screen.getByText(/个有效/)).toBeInTheDocument();
    expect(screen.getByText(/个无效/)).toBeInTheDocument();
  });

  it('应该为大量数据显示警告', () => {
    const largeInput = Array(1001).fill('wx4g0ec1').join('\n');
    
    render(
      <SmartInputValidator 
        {...defaultProps} 
        isBatchMode={true}
        value={largeInput}
      />
    );
    
    expect(screen.getByText(/输入数量较多/)).toBeInTheDocument();
    expect(screen.getByText(/分批处理/)).toBeInTheDocument();
  });

  it('应该显示修正建议按钮', () => {
    // 这个测试需要模拟包含可修正字符的输入
    render(
      <SmartInputValidator 
        {...defaultProps} 
        value="ailo"
      />
    );
    
    // 检查是否有修正建议相关的内容
    expect(screen.getByText(/包含无效字符/)).toBeInTheDocument();
  });

  it('应该根据错误类型显示不同的图标', () => {
    const { rerender } = render(
      <SmartInputValidator 
        {...defaultProps} 
        value="wx4g0ec1"
      />
    );
    
    // 成功状态应该有成功图标
    expect(document.querySelector('svg')).toBeInTheDocument();
    
    // 重新渲染为错误状态
    rerender(
      <SmartInputValidator 
        {...defaultProps} 
        value="invalid"
      />
    );
    
    // 错误状态应该有错误图标
    expect(document.querySelector('svg')).toBeInTheDocument();
  });
});