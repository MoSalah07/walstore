import { Suspense } from "react";

import NotFoundView from "@/components/shared/not-found-view";

// Fallback 404 for sections without the storefront header (checkout, admin).
export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col">
      <Suspense>
        <NotFoundView />
      </Suspense>
    </div>
  );
}
