import { Component, type ReactNode } from "react";

interface Props {
  children?: ReactNode;
  backgroundColor?: string;
}

interface State {
  hasError: boolean;
}

/**
 * Catches render / effect errors thrown by background components so
 * a single broken background never takes down the entire app.
 */
export class BackgroundErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: unknown) {
    console.error("[background] render error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: this.props.backgroundColor ?? "transparent",
          }}
        >
          <span
            style={{
              fontSize: 11,
              color: "rgba(255,255,255,0.45)",
              letterSpacing: "0.04em",
              fontFamily: "monospace",
            }}
          >
            Background unavailable
          </span>
        </div>
      );
    }
    return this.props.children;
  }
}