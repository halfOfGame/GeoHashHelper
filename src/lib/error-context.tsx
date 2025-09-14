/**
 * 全局错误上下文
 * 提供应用级别的错误状态管理和错误处理钩子
 */

'use client';

import React, { createContext, useContext, useReducer, ReactNode, useCallback } from 'react';
import { AppError, ErrorRecoveryAction } from '../types/error-types';

interface ErrorState {
  errors: AppError[];
  isShowingError: boolean;
  currentError: AppError | null;
}

type ErrorAction =
  | { type: 'ADD_ERROR'; payload: AppError }
  | { type: 'REMOVE_ERROR'; payload: string } // timestamp as ID
  | { type: 'CLEAR_ERRORS' }
  | { type: 'SHOW_ERROR'; payload: AppError }
  | { type: 'HIDE_ERROR' }
  | { type: 'DISMISS_CURRENT_ERROR' };

interface ErrorContextType {
  state: ErrorState;
  addError: (error: AppError) => void;
  removeError: (timestamp: string) => void;
  clearErrors: () => void;
  showError: (error: AppError) => void;
  hideError: () => void;
  dismissCurrentError: () => void;
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

const errorReducer = (state: ErrorState, action: ErrorAction): ErrorState => {
  switch (action.type) {
    case 'ADD_ERROR':
      return {
        ...state,
        errors: [action.payload, ...state.errors].slice(0, 10), // 保持最多10个错误
        currentError: state.currentError || action.payload,
        isShowingError: true
      };

    case 'REMOVE_ERROR':
      const filteredErrors = state.errors.filter(
        error => error.timestamp.toISOString() !== action.payload
      );
      return {
        ...state,
        errors: filteredErrors,
        currentError: state.currentError?.timestamp.toISOString() === action.payload 
          ? filteredErrors[0] || null 
          : state.currentError,
        isShowingError: filteredErrors.length > 0 && state.isShowingError
      };

    case 'CLEAR_ERRORS':
      return {
        ...state,
        errors: [],
        currentError: null,
        isShowingError: false
      };

    case 'SHOW_ERROR':
      return {
        ...state,
        currentError: action.payload,
        isShowingError: true
      };

    case 'HIDE_ERROR':
      return {
        ...state,
        isShowingError: false
      };

    case 'DISMISS_CURRENT_ERROR':
      const remainingErrors = state.errors.filter(
        error => error.timestamp.toISOString() !== state.currentError?.timestamp.toISOString()
      );
      return {
        ...state,
        errors: remainingErrors,
        currentError: remainingErrors[0] || null,
        isShowingError: remainingErrors.length > 0
      };

    default:
      return state;
  }
};

interface ErrorProviderProps {
  children: ReactNode;
}

export const ErrorProvider: React.FC<ErrorProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(errorReducer, {
    errors: [],
    isShowingError: false,
    currentError: null
  });

  const addError = useCallback((error: AppError) => {
    dispatch({ type: 'ADD_ERROR', payload: error });
  }, []);

  const removeError = useCallback((timestamp: string) => {
    dispatch({ type: 'REMOVE_ERROR', payload: timestamp });
  }, []);

  const clearErrors = useCallback(() => {
    dispatch({ type: 'CLEAR_ERRORS' });
  }, []);

  const showError = useCallback((error: AppError) => {
    dispatch({ type: 'SHOW_ERROR', payload: error });
  }, []);

  const hideError = useCallback(() => {
    dispatch({ type: 'HIDE_ERROR' });
  }, []);

  const dismissCurrentError = useCallback(() => {
    dispatch({ type: 'DISMISS_CURRENT_ERROR' });
  }, []);

  const contextValue: ErrorContextType = {
    state,
    addError,
    removeError,
    clearErrors,
    showError,
    hideError,
    dismissCurrentError
  };

  return (
    <ErrorContext.Provider value={contextValue}>
      {children}
    </ErrorContext.Provider>
  );
};

export const useError = (): ErrorContextType => {
  const context = useContext(ErrorContext);
  if (context === undefined) {
    throw new Error('useError must be used within an ErrorProvider');
  }
  return context;
};

// 便捷钩子：用于处理常见错误场景
export const useErrorHandler = () => {
  const { addError } = useError();

  const handleConversionError = useCallback((error: AppError) => {
    addError(error);
  }, [addError]);

  const handleSystemError = useCallback((error: AppError) => {
    addError(error);
  }, [addError]);

  const handleBatchError = useCallback((error: AppError) => {
    addError(error);
  }, [addError]);

  return {
    handleConversionError,
    handleSystemError,
    handleBatchError
  };
};