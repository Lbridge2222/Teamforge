"use client";

import { Toaster, toast } from "sonner";

export { toast };

export function ToastProvider() {
  return (
    <Toaster
      position="bottom-right"
      toastOptions={{
        className:
          "border border-gray-200 rounded-md font-medium",
      }}
    />
  );
}
