import { describe, it, expect } from 'vitest';
import { getErrorStatus, getErrorMessage } from '@/lib/api-error';

describe('getErrorStatus', () => {
  it('returns status from object with valid HTTP error status 429', () => {
    expect(getErrorStatus({ status: 429 })).toBe(429);
  });

  it('returns status from object with valid HTTP error status 400', () => {
    expect(getErrorStatus({ status: 400 })).toBe(400);
  });

  it('returns status from object with valid HTTP error status 599', () => {
    expect(getErrorStatus({ status: 599 })).toBe(599);
  });

  it('returns 500 for status below 400', () => {
    expect(getErrorStatus({ status: 200 })).toBe(500);
  });

  it('returns 500 for status at 600', () => {
    expect(getErrorStatus({ status: 600 })).toBe(500);
  });

  it('returns 500 for non-number status', () => {
    expect(getErrorStatus({ status: '404' })).toBe(500);
  });

  it('returns 500 for missing status property', () => {
    expect(getErrorStatus({ message: 'error' })).toBe(500);
  });

  it('returns 500 for null input', () => {
    expect(getErrorStatus(null)).toBe(500);
  });

  it('returns 500 for undefined input', () => {
    expect(getErrorStatus(undefined)).toBe(500);
  });

  it('returns 500 for string input', () => {
    expect(getErrorStatus('something went wrong')).toBe(500);
  });

  it('returns 500 for number input', () => {
    expect(getErrorStatus(42)).toBe(500);
  });
});

describe('getErrorMessage', () => {
  it('returns .message from Error instance', () => {
    expect(getErrorMessage(new Error('broken'))).toBe('broken');
  });

  it('returns string directly when error is a string', () => {
    expect(getErrorMessage('oops')).toBe('oops');
  });

  it('returns default fallback for non-Error/non-string', () => {
    expect(getErrorMessage(12345)).toBe('An unexpected error occurred');
  });

  it('returns custom fallback when provided', () => {
    expect(getErrorMessage({}, 'custom fallback')).toBe('custom fallback');
  });

  it('returns default fallback for null', () => {
    expect(getErrorMessage(null)).toBe('An unexpected error occurred');
  });

  it('returns default fallback for undefined', () => {
    expect(getErrorMessage(undefined)).toBe('An unexpected error occurred');
  });
});
