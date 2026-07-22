import { Link } from "react-router-dom";

function DecorativeSphere() {
  return (
    <div className="relative mx-auto flex h-56 w-full max-w-sm items-center justify-center md:h-64">
      {/* Frosted glass horizon line */}
      <div className="absolute left-1/2 top-1/2 z-10 h-px w-[120%] -translate-x-1/2 -translate-y-1/2 bg-white/40 backdrop-blur-sm" />
      <div className="absolute left-1/2 top-1/2 z-10 h-8 w-[110%] -translate-x-1/2 -translate-y-1/2 bg-white/20 backdrop-blur-md" />

      {/* 3D-style sphere */}
      <div
        className="relative z-0 h-44 w-44 rounded-full md:h-52 md:w-52"
        style={{
          background:
            "radial-gradient(circle at 35% 30%, rgba(255,255,255,0.95) 0%, rgba(255,180,220,0.6) 18%, rgba(236,72,153,0.85) 42%, rgba(168,85,247,0.75) 58%, rgba(34,211,238,0.8) 78%, rgba(6,182,212,0.9) 100%)",
          boxShadow:
            "0 25px 60px rgba(168,85,247,0.35), inset -12px -12px 30px rgba(0,0,0,0.08), inset 8px 8px 20px rgba(255,255,255,0.5)",
        }}
      >
        <div className="absolute left-[22%] top-[18%] h-10 w-14 rounded-full bg-white/50 blur-md" />
      </div>
    </div>
  );
}

function TrustIndicator() {
  const avatars = [
    { bg: "bg-violet-400", initials: "AK" },
    { bg: "bg-pink-400", initials: "MR" },
    { bg: "bg-cyan-400", initials: "JS" },
  ];

  return (
    <div className="mt-auto flex items-center gap-3 rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
      <div className="flex -space-x-2">
        {avatars.map((a) => (
          <div
            key={a.initials}
            className={`flex h-9 w-9 items-center justify-center rounded-full border-2 border-white text-[10px] font-semibold text-white ${a.bg}`}
          >
            {a.initials}
          </div>
        ))}
      </div>
      <div>
        <p className="text-sm font-semibold text-gray-900">10 Million+ Users</p>
        <p className="text-xs text-gray-400">worldwide</p>
      </div>
    </div>
  );
}

function AuthLogo() {
  return (
    <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-xl border border-gray-100 bg-white shadow-sm">
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
        <circle
          cx="12"
          cy="12"
          r="9"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-gray-700"
        />
        <path
          d="M12 7v10M8 12h8"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          className="text-gray-700"
        />
      </svg>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

export function AuthDivider() {
  return (
    <div className="relative my-6">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-gray-200" />
      </div>
      <div className="relative flex justify-center text-xs">
        <span className="bg-white px-3 text-gray-400">Or Continue With</span>
      </div>
    </div>
  );
}

export function AuthGoogleButton() {
  return (
    <button
      type="button"
      className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
      onClick={() => {}}
      aria-label="Continue with Google (coming soon)"
    >
      <GoogleIcon />
      Google
    </button>
  );
}

export function AuthPrimaryButton({ children, disabled, loading }) {
  return (
    <button
      type="submit"
      disabled={disabled || loading}
      className="w-full rounded-full bg-gradient-to-r from-pink-500 to-fuchsia-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-pink-500/25 transition hover:from-pink-600 hover:to-fuchsia-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {children}
    </button>
  );
}

export function AuthFooterLink({ prompt, linkText, to }) {
  return (
    <p className="mt-6 text-center text-sm text-gray-500">
      {prompt}{" "}
      <Link
        to={to}
        className="font-semibold text-gray-900 underline-offset-2 hover:underline"
      >
        {linkText}
      </Link>
    </p>
  );
}

export function AuthErrorBanner({ message }) {
  if (!message) return null;
  return (
    <div className="mb-5 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
      {message}
    </div>
  );
}

export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#ececec] p-4 md:p-8">
      <div className="flex w-full max-w-5xl flex-col overflow-hidden rounded-[2rem] border border-gray-200/80 bg-white shadow-2xl lg:min-h-[640px] lg:flex-row">
        {/* Left decorative panel */}
        <div className="relative hidden overflow-hidden lg:flex lg:w-[46%] lg:flex-col">
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(145deg, #ddd6f3 0%, #f0d9ec 35%, #dceef8 70%, #e8f4fc 100%)",
            }}
          />
          <div className="absolute inset-0 backdrop-blur-[2px]" />

          <div className="relative flex flex-1 flex-col px-10 py-10">
            {/* Watermark headline */}
            <div className="relative mb-4">
              <p className="text-5xl font-black tracking-tight text-white drop-shadow-sm xl:text-6xl">
                SMART AI
              </p>
              <p
                className="pointer-events-none absolute -right-2 top-0 select-none text-5xl font-black tracking-tight text-white/20 xl:text-6xl"
                aria-hidden="true"
              >
                SMART AI
              </p>
            </div>

            <DecorativeSphere />

            <div className="mt-auto pt-8">
              <h2 className="text-2xl font-bold tracking-tight text-gray-900">
                Intelligent AI Assistance
              </h2>
              <p className="mt-3 max-w-sm text-sm leading-relaxed text-gray-600">
                Experience smarter conversations with AI-powered responses,
                personalized insights &amp; seamless productivity across every
                interaction.
              </p>
            </div>
          </div>
        </div>

        {/* Mobile compact header */}
        <div
          className="relative overflow-hidden px-6 py-8 lg:hidden"
          style={{
            background:
              "linear-gradient(145deg, #ddd6f3 0%, #f0d9ec 50%, #dceef8 100%)",
          }}
        >
          <p className="text-3xl font-black tracking-tight text-white">SMART AI</p>
          <p className="mt-1 text-sm font-medium text-gray-700">
            Intelligent AI Assistance
          </p>
        </div>

        {/* Right form panel */}
        <div className="flex flex-1 flex-col px-6 py-8 sm:px-10 sm:py-10 lg:px-12">
          <AuthLogo />
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            {title}
          </h1>
          <p className="mt-1 text-sm text-gray-500">{subtitle}</p>

          <div className="mt-8 flex flex-1 flex-col">
            {children}
            {footer}
            <TrustIndicator />
          </div>
        </div>
      </div>
    </div>
  );
}
