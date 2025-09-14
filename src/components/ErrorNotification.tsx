/**
 * 全局错误通知组件
 * 在应用顶层显示错误通知，支持自动消失和手动关闭
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useError } from '../lib/error-context';
import ErrorDisplay from './ErrorDisplay';

interface ErrorNotificationProps {
  autoHideDelay?: number; // 自动隐藏延迟（毫秒）
  position?: 'top' | 'bottom';
  maxWidth?: string;
}

const ErrorNotification: React.FC<ErrorNotificationProps> = ({
  autoHideDelay = 5000,
  position = 'top',
  maxWidth = 'max-w-md'
}) => {
  const { state, dismissCurrentError, hideError } = useError();
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (state.isShowingError && state.currentError) {
      setIsVisible(true);
      setIsAnimating(true);

      // 自动隐藏（仅对低严重性错误）
      if (state.currentError.severity === 'low' && autoHideDelay > 0) {
        const timer = setTimeout(() => {
          handleHide();
        }, autoHideDelay);

        return () => clearTimeout(timer);
      }
    } else {
      handleHide();
    }
  }, [state.isShowingError, state.currentError, autoHideDelay]);

  const handleHide = () => {
    setIsAnimating(false);
    setTimeout(() => {
      setIsVisible(false);
      hideError();
    }, 300); // 等待动画完成
  };

  const handleDismiss = () => {
    dismissCurrentError();
  };

  const handleRetry = () => {
    // 这里可以添加重试逻辑
    // 目前只是关闭通知
    handleDismiss();
  };

  if (!isVisible || !state.currentError) {
    return null;
  }

  const positionClasses = position === 'top' 
    ? 'top-4' 
    : 'bottom-4';

  const animationClasses = isAnimating
    ? 'translate-y-0 opacity-100'
    : position === 'top'
      ? '-translate-y-full opacity-0'
      : 'translate-y-full opacity-0';

  return (
    <div className="fixed inset-x-0 z-50 flex justify-center px-4">
      <div 
        className={`
          ${positionClasses} 
          ${maxWidth} 
          w-full
          transform transition-all duration-300 ease-in-out
          ${animationClasses}
        `}
      >
        <ErrorDisplay
          error={state.currentError}
          onDismiss={handleDismiss}
          onRetry={state.currentError.retryable ? handleRetry : undefined}
          className="shadow-lg"
        />
      </div>
    </div>
  );
};

export default ErrorNotification;