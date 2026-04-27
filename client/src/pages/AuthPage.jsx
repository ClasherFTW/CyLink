import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "../features/auth/AuthContext";
import { useToast } from "../features/ui/ToastContext";
import { signInWithGooglePopup } from "../features/auth/firebase";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

const registerSchema = loginSchema.extend({
  username: z.string().min(3, "Username must be at least 3 characters.").max(30),
});

function AuthPage() {
  const [mode, setMode] = useState("login");
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const { login, register, loginWithGoogle } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const schema = useMemo(() => (mode === "login" ? loginSchema : registerSchema), [mode]);

  const {
    register: bind,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
    },
  });

  const redirectPath = location.state?.from?.pathname || "/app";

  async function onSubmit(values) {
    try {
      if (mode === "login") {
        await login({
          email: values.email,
          password: values.password,
        });
        toast.success("Welcome back", "Login successful.");
      } else {
        await register({
          username: values.username,
          email: values.email,
          password: values.password,
        });
        toast.success("Account created", "You are now logged in.");
      }

      navigate(redirectPath, { replace: true });
    } catch (error) {
      toast.error("Authentication failed", error.message || "Please try again.");
    }
  }

  async function onGoogleLogin() {
    try {
      setIsGoogleLoading(true);
      const googleUser = await signInWithGooglePopup();

      await loginWithGoogle({
        uid: googleUser.uid,
        email: googleUser.email,
        displayName: googleUser.displayName,
      });

      toast.success("Welcome", "Google login successful.");
      navigate(redirectPath, { replace: true });
    } catch (error) {
      toast.error("Google login failed", error.message || "Please try again.");
    } finally {
      setIsGoogleLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <section className="auth-card">
        <Link to="/" className="brand-link auth-brand">
          citrus
          <span className="brand-link__dot" />
        </Link>

        <h1>{mode === "login" ? "Login" : "Create Account"}</h1>
        <p>Enter your credentials to continue to Citrus.</p>

        <form className="auth-form" onSubmit={handleSubmit(onSubmit)}>
          {mode === "register" ? (
            <label>
              Username
              <input {...bind("username")} placeholder="developer_name" />
              {errors.username ? <span className="inline-error">{errors.username.message}</span> : null}
            </label>
          ) : null}

          <label>
            Email
            <input {...bind("email")} type="email" placeholder="you@example.com" />
            {errors.email ? <span className="inline-error">{errors.email.message}</span> : null}
          </label>

          <label>
            Password
            <input {...bind("password")} type="password" placeholder="At least 8 characters" />
            {errors.password ? <span className="inline-error">{errors.password.message}</span> : null}
          </label>

          <button type="submit" className="btn btn--primary" disabled={isSubmitting}>
            {isSubmitting ? "Please wait..." : mode === "login" ? "Login" : "Create Account"}
          </button>
        </form>

        <div className="auth-separator">
          <span>or</span>
        </div>

        <button
          type="button"
          className="btn btn--ghost auth-google-btn"
          onClick={onGoogleLogin}
          disabled={isGoogleLoading}
        >
          {isGoogleLoading ? "Connecting Google..." : "Continue with Google"}
        </button>

        <button
          type="button"
          className="text-button"
          onClick={() => {
            setMode((prev) => (prev === "login" ? "register" : "login"));
            reset();
          }}
        >
          {mode === "login" ? "Need an account? Register" : "Already have an account? Login"}
        </button>
      </section>
    </div>
  );
}

export default AuthPage;
