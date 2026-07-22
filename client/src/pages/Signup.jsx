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
  NameField,
  PasswordField,
} from "../components/auth/AuthFields";

export default function Signup() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/signup", form);
      setAuth({ user: data.user, token: data.token });
      navigate("/");
    } catch (err) {
      setError(
        err.response?.data?.errors?.[0] ||
          err.response?.data?.message ||
          "Signup failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create Account"
      subtitle="Sign up to start your AI-powered conversations"
      footer={
        <AuthFooterLink
          prompt="Already have an account?"
          linkText="Sign in"
          to="/login"
        />
      }
    >
      <AuthErrorBanner message={error} />

      <form onSubmit={handleSubmit} className="space-y-5">
        <NameField value={form.name} onChange={update} />
        <EmailField value={form.email} onChange={update} />
        <PasswordField
          value={form.password}
          onChange={update}
          minLength={8}
          autoComplete="new-password"
          hint="At least 8 characters."
        />

        <AuthPrimaryButton loading={loading}>
          {loading ? "Creating account…" : "Sign Up"}
        </AuthPrimaryButton>
      </form>

      <AuthDivider />
      <AuthGoogleButton />
    </AuthLayout>
  );
}
