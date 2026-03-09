import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { AuthProvider } from "@/contexts/AuthContext";
import { theme } from "@/theme";

import AppLayout from "@/layouts/AppLayout";
import RequireAuth from "@/components/RequireAuth";
import { LoginPage, SignupPage } from "@/pages/AuthPage";

import DocumentsPage from "@/pages/DocumentsPage";
import DocumentBuilderPage from "@/pages/DocumentBuilderPage";
import DocumentViewPage from "@/pages/DocumentViewPage";
import NikahBuilderPage from "@/pages/NikahBuilderPage";
import WillBuilderPage from "@/pages/WillBuilderPage";

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />

              <Route element={<RequireAuth />}>
                <Route path="/" element={<DocumentsPage />} />
                <Route path="/documents" element={<DocumentsPage />} />
                <Route path="/documents/new/:type" element={<DocumentBuilderPage />} />
                <Route path="/documents/nikah" element={<NikahBuilderPage />} />
                <Route path="/documents/nikah/:id" element={<NikahBuilderPage />} />
                <Route path="/documents/will" element={<WillBuilderPage />} />
                <Route path="/documents/will/:id" element={<WillBuilderPage />} />
                <Route path="/documents/:id" element={<DocumentViewPage />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
