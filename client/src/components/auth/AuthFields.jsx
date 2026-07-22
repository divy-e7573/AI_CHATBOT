import { useState } from "react";
import { Eye, EyeOff, Lock, Mail, User } from "lucide-react";

const fieldClass =
  "w-full rounded-2xl border border-gray-200 bg-gray-50 py-3 pl-11 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-pink-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-pink-200";

export function AuthField({ label, icon: Icon, className = "", ...inputProps }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-gray-700">
        {label}
      </label>
      <div className="relative">
        <Icon
          className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-400"
          strokeWidth={1.75}
        />
        <input className={`${fieldClass} ${className}`} {...inputProps} />
      </div>
    </div>
  );
}

export function EmailField(props) {
  return (
    <AuthField
      label="Email"
      icon={Mail}
      type="email"
      name="email"
      placeholder="you@example.com"
      autoComplete="email"
      required
      {...props}
    />
  );
}

export function NameField(props) {
  return (
    <AuthField
      label="Name"
      icon={User}
      type="text"
      name="name"
      placeholder="Your name"
      autoComplete="name"
      required
      {...props}
    />
  );
}

export function PasswordField({
  label = "Password",
  hint,
  minLength,
  autoComplete = "current-password",
  ...props
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-gray-700">
        {label}
      </label>
      <div className="relative">
        <Lock
          className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-400"
          strokeWidth={1.75}
        />
        <input
          type={visible ? "text" : "password"}
          name="password"
          placeholder="••••••••••"
          autoComplete={autoComplete}
          required
          minLength={minLength}
          className={`${fieldClass} pr-11`}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-gray-400 hover:text-gray-600"
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? (
            <EyeOff className="h-[18px] w-[18px]" strokeWidth={1.75} />
          ) : (
            <Eye className="h-[18px] w-[18px]" strokeWidth={1.75} />
          )}
        </button>
      </div>
      {hint && <p className="mt-1.5 text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

export function RememberForgotRow({ remember, onRememberChange }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <label className="flex cursor-pointer items-center gap-2 text-gray-600">
        <input
          type="checkbox"
          checked={remember}
          onChange={(e) => onRememberChange(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-pink-500 focus:ring-pink-400"
        />
        Remember me
      </label>
      <button
        type="button"
        className="font-medium text-gray-700 hover:text-gray-900"
        onClick={() => {}}
      >
        Forgot Password?
      </button>
    </div>
  );
}
