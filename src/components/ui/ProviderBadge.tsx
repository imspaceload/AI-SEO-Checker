import { AIProvider } from "@/types";
import { getProviderName, getProviderBgClass } from "@/lib/utils";

interface ProviderBadgeProps {
  provider: AIProvider;
}

export default function ProviderBadge({ provider }: ProviderBadgeProps) {
  return (
    <span className={`badge ${getProviderBgClass(provider)}`}>
      {getProviderName(provider)}
    </span>
  );
}
