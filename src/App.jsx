import { Component } from "react";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import { store } from "./app/store";
import AppRoutes from "./routes/AppRoutes";
import { useThemeSync } from "./hooks/useWorkspace";
import { useIsMobile } from "./hooks/useMediaQuery";

function ThemeBridge() {
  useThemeSync();
  return null;
}

function AppToaster() {
  const mobile = useIsMobile();

  return (
    <Toaster
      position={mobile ? "bottom-center" : "bottom-right"}
      containerStyle={mobile ? { bottom: 16, left: 12, right: 12 } : undefined}
      toastOptions={{
        duration: 3000,
        style: {
          background: "#1c1712",
          color: "#f6f1e8",
          borderRadius: "16px",
          fontSize: "14px",
          maxWidth: "calc(100vw - 24px)",
        },
      }}
    />
  );
}

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Application error:", error, errorInfo);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="grid min-h-screen place-items-center bg-[#f3efe6] p-8 text-center text-[#1c1712]">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[#c6532a]">
              Northline
            </p>

            <h1 className="mt-3 font-display text-4xl">The desk hit a snag.</h1>

            <p className="mt-3 text-sm text-[#7c7368]">
              Something went wrong while loading the application.
            </p>

            <button
              type="button"
              className="mt-6 rounded-2xl bg-[#c6532a] px-4 py-2 text-sm text-white"
              onClick={() => window.location.reload()}
            >
              Reload application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <ErrorBoundary>
          <ThemeBridge />
          <AppRoutes />
          <AppToaster />
        </ErrorBoundary>
      </BrowserRouter>
    </Provider>
  );
}
