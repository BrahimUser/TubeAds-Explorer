import React from 'react';

/**
 * Minimal React error boundary.
 *
 * React Native doesn't ship one, and we need a localized fallback for
 * native modules that can fail at render time (e.g. the YouTube iframe
 * WebView throwing "Cannot read property 'WebView' of undefined" if the
 * native module mismatches the JS bundle after a partial install).
 *
 * Usage:
 *   <ErrorBoundary fallback={(err, retry) => <MyFallback />}>
 *     <FlakyComponent />
 *   </ErrorBoundary>
 *
 * The boundary is intentionally simple — no telemetry, no auto-retry on
 * a timer. It re-renders the children when `retry()` is called or when
 * the `resetKey` prop changes (so a parent that swaps out a video can
 * force a re-mount of the boundary state).
 */
type Props = {
  children: React.ReactNode;
  /** Called to render the fallback. Receives the error and a `retry` fn. */
  fallback: (error: Error, retry: () => void) => React.ReactNode;
  /**
   * Optional value — when it changes, the boundary clears its error
   * state. Use this for "next item in the feed" semantics so a busted
   * cell doesn't poison the next one.
   */
  resetKey?: unknown;
  /** Optional dev-time logger. Defaults to `console.warn`. */
  onError?: (error: Error, info: React.ErrorInfo) => void;
};

type State = { error: Error | null };

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidUpdate(prevProps: Props) {
    // Reset state when the caller bumps `resetKey`. We can't compare in
    // getDerivedStateFromProps because we need the previous props.
    if (prevProps.resetKey !== this.props.resetKey && this.state.error) {
      this.setState({ error: null });
    }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    if (this.props.onError) {
      this.props.onError(error, info);
    } else if (__DEV__) {
      // eslint-disable-next-line no-console
      console.warn('[ErrorBoundary]', error.message, info.componentStack);
    }
  }

  retry = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      return this.props.fallback(this.state.error, this.retry);
    }
    return this.props.children;
  }
}
