import { Logo } from "./Logo";

export function AuthCard({
  title,
  subtitle,
  error,
  message,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  error?: string;
  message?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <div className="card p-7 shadow-[0_40px_120px_-40px_rgb(109_91_208/0.55)] sm:p-9">
          <h1 className="font-display">{title}</h1>
          {subtitle && <p className="mt-2 text-mist">{subtitle}</p>}
          {error && (
            <p role="alert" className="mt-5 rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">
              {error}
            </p>
          )}
          {message && (
            <p role="status" className="mt-5 rounded-xl border border-violet/30 bg-violet/10 px-4 py-3 text-sm text-moon">
              {message}
            </p>
          )}
          <div className="mt-6">{children}</div>
        </div>
        {footer && <p className="mt-6 text-center text-sm text-mist">{footer}</p>}
      </div>
    </main>
  );
}
