import { useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../api/axios";
import { useAuthStore } from "../store/authStore";
import AuthLayout, {
  AuthDivider,
  AuthErrorBanner,
  AuthFooterLink,
  AuthGoogleButton,
  AuthPrimaryButton,
} from "../components/auth/AuthLayout";
import {
  EmailField,
  PasswordField,
  RememberForgotRow,
} from "../components/auth/AuthFields";

export default function Login() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [form, setForm] = useState({ email: "", password: "" });
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", form);
      setAuth({ user: data.user, token: data.token });
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Sign in to access your unified inbox"
      footer={
        <AuthFooterLink
          prompt="Don't have an account?"
          linkText="Sign up"
          to="/signup"
        />
      }
    >
      <AuthErrorBanner message={error} />

      <form onSubmit={handleSubmit} className="space-y-5">
        <EmailField value={form.email} onChange={update} />
        <PasswordField value={form.password} onChange={update} />

        <RememberForgotRow
          remember={remember}
          onRememberChange={setRemember}
        />

        <AuthPrimaryButton loading={loading}>
          {loading ? "Signing in…" : "Sign In"}
        </AuthPrimaryButton>
      </form>

      <AuthDivider />
      <AuthGoogleButton />
    </AuthLayout>
  );
}
