import { useEffect, useState } from "react";
import { AlertCircle, Eye, EyeOff, Loader2, Lock, Mail, User } from "lucide-react";

import api from "../../api/axios";
import { useAuthStore } from "../../store/authStore";
import { Button } from "../ui/Button";
import { Dialog } from "../ui/Dialog";
import { Input } from "../ui/Input";
import { Tabs } from "../ui/Tabs";
import { BrandLogo } from "./BrandLogo";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path fill="#4285F4" d="M21.8 12.2c0-.7-.1-1.4-.2-2H12v3.9h5.5a4.7 4.7 0 0 1-2 3v2.6h3.3c1.9-1.8 3-4.4 3-7.5Z" />
      <path fill="#34A853" d="M12 22c2.7 0 5-.9 6.8-2.3L15.5 17c-.9.6-2.1 1-3.5 1a6 6 0 0 1-5.6-4.1H3v2.7A10 10 0 0 0 12 22Z" />
      <path fill="#FBBC05" d="M6.4 13.9A6 6 0 0 1 6.1 12c0-.7.1-1.3.3-1.9V7.4H3A10 10 0 0 0 2 12c0 1.7.4 3.2 1 4.6l3.4-2.7Z" />
      <path fill="#EA4335" d="M12 6c1.6 0 3 .5 4 1.6l3-3A10 10 0 0 0 3 7.4l3.4 2.7A6 6 0 0 1 12 6Z" />
    </svg>
  );
}

function Field({ label, icon: Icon, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-700">{label}</span>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        {children}
      </div>
    </label>
  );
}

export function AuthDialog({ open, mode, onOpenChange, onModeChange, onSuccess }) {
  const setAuth = useAuthStore((state) => state.setAuth);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const signup = mode === "signup";

  useEffect(() => {
    setError("");
    setPasswordVisible(false);
  }, [mode, open]);

  const update = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const payload = signup
        ? { name: form.name, email: form.email, password: form.password }
        : { email: form.email, password: form.password };
      const { data } = await api.post(`/auth/${signup ? "signup" : "login"}`, payload);
      setAuth({ user: data.user, token: data.token });
      onSuccess();
    } catch (requestError) {
      setError(
        requestError.response?.data?.errors?.[0] ||
          requestError.response?.data?.message ||
          `${signup ? "Sign up" : "Login"} failed. Please try again.`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={signup ? "Create your account" : "Welcome back"}
      description="Authenticate to continue to AI Chat Assistant"
    >
      <div className="border-b border-slate-100 bg-slate-50/80 px-6 py-5">
        <BrandLogo />
      </div>
      <div className="p-6 sm:p-7">
        <div className="pr-8">
          <h2 className="text-2xl font-bold tracking-tight text-slate-950">
            {signup ? "Create your account" : "Welcome back"}
          </h2>
          <p className="mt-1.5 text-sm text-slate-500">
            {signup
              ? "Start building your AI knowledge workspace for free."
              : "Sign in to continue your conversations."}
          </p>
        </div>

        <Tabs
          className="mt-6"
          value={mode}
          onValueChange={onModeChange}
          tabs={[
            { value: "login", label: "Log in" },
            { value: "signup", label: "Sign up" },
          ]}
        />

        {error && (
          <div role="alert" className="mt-5 flex gap-2 rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={submit} className="mt-5 space-y-4">
          {signup && (
            <Field label="Full name" icon={User}>
              <Input
                className="pl-10"
                name="name"
                value={form.name}
                onChange={update}
                placeholder="Your name"
                autoComplete="name"
                minLength={2}
                required
              />
            </Field>
          )}
          <Field label="Email address" icon={Mail}>
            <Input
              className="pl-10"
              type="email"
              name="email"
              value={form.email}
              onChange={update}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </Field>
          <Field label="Password" icon={Lock}>
            <Input
              className="pl-10 pr-11"
              type={passwordVisible ? "text" : "password"}
              name="password"
              value={form.password}
              onChange={update}
              placeholder="Enter your password"
              autoComplete={signup ? "new-password" : "current-password"}
              minLength={signup ? 8 : undefined}
              required
            />
            <button
              type="button"
              onClick={() => setPasswordVisible((current) => !current)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              aria-label={passwordVisible ? "Hide password" : "Show password"}
            >
              {passwordVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </Field>

          {signup && <p className="text-xs text-slate-400">Use at least 8 characters.</p>}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? "Please wait..." : signup ? "Create free account" : "Log in"}
          </Button>
        </form>

        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200" /></div>
          <div className="relative flex justify-center text-[11px] uppercase tracking-wider"><span className="bg-white px-3 text-slate-400">or continue with</span></div>
        </div>

        <Button
          variant="outline"
          className="w-full"
          disabled
          title="Google OAuth requires a configured Google client ID and backend token verification"
        >
          <GoogleIcon /> Google <span className="text-[10px] font-medium text-slate-400">Setup required</span>
        </Button>

        <p className="mt-5 text-center text-xs leading-5 text-slate-400">
          By continuing, you agree to use AI Chat Assistant responsibly.
        </p>
      </div>
    </Dialog>
  );
}
