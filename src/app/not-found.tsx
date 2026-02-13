import Link from "next/link";
import { MagnifyingGlass, House, Hammer } from "@phosphor-icons/react/dist/ssr";
import { CARD_CLASSES, BUTTON } from "@/lib/design-system";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
      <div className={`${CARD_CLASSES} p-8 max-w-md text-center space-y-4`}>
        <div className="h-12 w-12 mx-auto rounded-xl bg-blue-50 flex items-center justify-center">
          <MagnifyingGlass
            size={24}
            weight="bold"
            className="text-blue-600"
          />
        </div>
        <h1 className="text-4xl font-bold text-slate-900">404</h1>
        <h2 className="text-lg font-bold text-slate-700">Page Not Found</h2>
        <p className="text-sm text-slate-500">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link href="/dashboard" className={`${BUTTON.primary} inline-flex`}>
          <House size={16} weight="bold" />
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
