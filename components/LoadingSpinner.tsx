// components/LoadingSpinner.tsx
interface LoadingSpinnerProps {
  message?: string;
  fullScreen?: boolean;
}

export const LoadingSpinner = ({
  message = "Loading your farm assistant...",
  fullScreen = true
}: LoadingSpinnerProps) => {

  const containerClass = fullScreen
    ? "fixed inset-0 flex justify-center items-center min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 z-50"
    : "flex justify-center items-center py-12 w-full";

  return (
    <div className={containerClass}>
      <div className="text-center">
        {/* Animated spinner */}
        <div className="relative mx-auto mb-6">
          {/* Outer ring */}
          <div className="w-20 h-20 rounded-full border-4 border-green-200 animate-pulse"></div>
          {/* Inner spinning ring */}
          <div className="absolute top-0 left-0 w-20 h-20 rounded-full border-4 border-green-600 border-t-transparent animate-spin"></div>
          {/* Farm emoji in center */}
          <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-3xl">
            🌾
          </span>
        </div>

        {/* Loading message */}
        <p className="text-xl font-semibold text-green-800 animate-pulse">
          {message}
        </p>

        {/* Sub-message */}
        <p className="text-sm text-gray-600 mt-3 flex items-center justify-center gap-2">
          <span>🌍</span>
          <span>Preparing in your language</span>
          <span>🗣️</span>
        </p>

        {/* Progress dots */}
        <div className="flex justify-center gap-2 mt-4">
          <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
          <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>
    </div>
  );
};