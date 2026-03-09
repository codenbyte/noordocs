import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Divider,
  Alert,
  Link as MuiLink,
} from "@mui/material";
import { Google } from "@mui/icons-material";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth, getFriendlyAuthError } from "@/contexts/AuthContext";

export default function AuthPage() {
  return <LoginForm />;
}

export function LoginPage() {
  return <LoginForm />;
}

export function SignupPage() {
  return <SignupForm />;
}

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || "/";

  const handleForgotPassword = async () => {
    setError("");
    setResetSent(false);
    if (!email.trim()) {
      setError("Please enter your email address first.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setResetSent(true);
    } catch (err: any) {
      setError(getFriendlyAuthError(err));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(getFriendlyAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError("");
    try {
      await loginWithGoogle();
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(getFriendlyAuthError(err));
    }
  };

  return (
    <Box
      sx={{
        minHeight: "80vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: 2,
      }}
    >
      <Card sx={{ maxWidth: 440, width: "100%" }}>
        <CardContent sx={{ p: 4 }}>
          {/* Bismillah */}
          <Typography
            variant="body2"
            textAlign="center"
            sx={{ mb: 1, fontFamily: "serif", opacity: 0.6 }}
          >
            &#1576;&#1587;&#1605; &#1575;&#1604;&#1604;&#1607; &#1575;&#1604;&#1585;&#1581;&#1605;&#1606; &#1575;&#1604;&#1585;&#1581;&#1610;&#1605;
          </Typography>

          <Typography variant="h5" fontWeight={700} textAlign="center" gutterBottom>
            Welcome Back
          </Typography>
          <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mb: 3 }}>
            Sign in to your NoorDocs account
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {resetSent && <Alert severity="success" sx={{ mb: 2 }}>Password reset email sent. Check your inbox.</Alert>}

          <Button
            fullWidth
            variant="outlined"
            startIcon={<Google />}
            onClick={handleGoogle}
            sx={{ mb: 2, py: 1.2 }}
          >
            Continue with Google
          </Button>

          <Divider sx={{ my: 2 }}>or</Divider>

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              sx={{ mb: 1 }}
            />
            <Box sx={{ textAlign: "right", mb: 2 }}>
              <MuiLink
                component="button"
                type="button"
                variant="body2"
                onClick={handleForgotPassword}
                sx={{ cursor: "pointer" }}
              >
                Forgot password?
              </MuiLink>
            </Box>
            <Button
              fullWidth
              type="submit"
              variant="contained"
              disabled={loading}
              sx={{ py: 1.2 }}
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </Box>

          <Typography variant="body2" textAlign="center" sx={{ mt: 3 }}>
            Don't have an account?{" "}
            <MuiLink
              component="button"
              onClick={() => navigate("/signup")}
              sx={{ cursor: "pointer" }}
            >
              Sign Up
            </MuiLink>
          </Typography>

          <Typography variant="caption" color="text.secondary" textAlign="center" sx={{ display: "block", mt: 2 }}>
            By signing in, you agree to our{" "}
            <MuiLink href="#" underline="hover">Terms of Service</MuiLink>
            {" "}and{" "}
            <MuiLink href="#" underline="hover">Privacy Policy</MuiLink>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}

function SignupForm() {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signup, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      await signup(email, password, displayName);
      navigate("/", { replace: true });
    } catch (err: any) {
      setError(getFriendlyAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError("");
    try {
      await loginWithGoogle();
      navigate("/", { replace: true });
    } catch (err: any) {
      setError(getFriendlyAuthError(err));
    }
  };

  return (
    <Box
      sx={{
        minHeight: "80vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: 2,
      }}
    >
      <Card sx={{ maxWidth: 440, width: "100%" }}>
        <CardContent sx={{ p: 4 }}>
          {/* Bismillah */}
          <Typography
            variant="body2"
            textAlign="center"
            sx={{ mb: 1, fontFamily: "serif", opacity: 0.6 }}
          >
            &#1576;&#1587;&#1605; &#1575;&#1604;&#1604;&#1607; &#1575;&#1604;&#1585;&#1581;&#1605;&#1606; &#1575;&#1604;&#1585;&#1581;&#1610;&#1605;
          </Typography>

          <Typography variant="h5" fontWeight={700} textAlign="center" gutterBottom>
            Join NoorDocs
          </Typography>
          <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mb: 3 }}>
            Create your account to manage Islamic documents
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Button
            fullWidth
            variant="outlined"
            startIcon={<Google />}
            onClick={handleGoogle}
            sx={{ mb: 2, py: 1.2 }}
          >
            Continue with Google
          </Button>

          <Divider sx={{ my: 2 }}>or</Divider>

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Display Name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              helperText="At least 6 characters"
              sx={{ mb: 3 }}
            />
            <Button
              fullWidth
              type="submit"
              variant="contained"
              disabled={loading}
              sx={{ py: 1.2 }}
            >
              {loading ? "Creating account..." : "Create Account"}
            </Button>
          </Box>

          <Typography variant="body2" textAlign="center" sx={{ mt: 3 }}>
            Already have an account?{" "}
            <MuiLink
              component="button"
              onClick={() => navigate("/login")}
              sx={{ cursor: "pointer" }}
            >
              Sign In
            </MuiLink>
          </Typography>

          <Typography variant="caption" color="text.secondary" textAlign="center" sx={{ display: "block", mt: 2 }}>
            By signing up, you agree to our{" "}
            <MuiLink href="#" underline="hover">Terms of Service</MuiLink>
            {" "}and{" "}
            <MuiLink href="#" underline="hover">Privacy Policy</MuiLink>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
