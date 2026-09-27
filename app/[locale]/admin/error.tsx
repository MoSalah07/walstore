"use client";

import ErrorView from "@/components/shared/error-view";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorView error={error} reset={reset} home="/admin/overview" />;
}
