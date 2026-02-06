interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  text?: string;
}

export default function LoadingSpinner({ size = "md", text }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div
        className={`${sizeClasses[size]} border-2 border-gray-200 border-t-brand-600 rounded-full animate-spin`}
      />
      {text && <p className="text-sm text-gray-500">{text}</p>}
    </div>
  );
}
