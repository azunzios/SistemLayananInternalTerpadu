import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Checkbox } from "./ui/checkbox";
import { Alert, AlertDescription } from "./ui/alert";
import { Eye, EyeOff, AlertCircle, Mail } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import {
  loginUser,
  setCurrentUser,
  addAuditLog,
  setRememberToken,
} from "../lib/storage";
import type { User } from "../types";

interface LoginPageProps {
  onLogin: (user: User) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    login: "",
    password: "",
    rememberMe: true,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [resetSuccess, setResetSuccess] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // --- STYLES DEFINITION ---

  // 1. Tombol Utama (Biru Mengilap)
  const soapButtonPrimary = "w-full h-11 rounded-full bg-gradient-to-b from-blue-500 to-blue-600 shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),inset_0_-2px_4px_rgba(0,0,0,0.2),0_4px_6px_rgba(0,0,0,0.1)] border-t border-blue-400 hover:brightness-110 active:scale-[0.98] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] transition-all duration-200 text-white font-medium";

  // 2. Tombol Sekunder/Kembali (Putih/Abu Mengilap)
  const soapButtonSecondary = "w-full h-11 rounded-full bg-gradient-to-b from-white to-gray-100 border border-gray-200 text-gray-700 shadow-[inset_0_1px_0_rgba(255,255,255,1),0_2px_3px_rgba(0,0,0,0.05)] hover:bg-gray-50 hover:text-gray-900 active:scale-[0.98] active:shadow-inner transition-all duration-200 font-medium";

  // 3. Style Icon Mail dengan Border Besi
  const metalIconWrapper = "mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 shadow-[0_8px_16px_rgba(0,0,0,0.15),inset_0_4px_6px_rgba(255,255,255,0.3)] border-[6px] border-[#E2E8F0] ring-1 ring-white";

  // 4. Style Alert Info
  const soapAlertStyle = "mb-4 rounded-2xl border border-blue-200 bg-blue-50/80 shadow-[inset_0_0_10px_rgba(59,130,246,0.1)] backdrop-blur-sm";

  // -------------------------

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await loginUser(
        formData.login.toLowerCase(),
        formData.password
      );
      const user = response.user;

      if (!user.isActive) {
        setError("Akun Anda sedang dinonaktifkan. Hubungi administrator");
        setIsLoading(false);
        return;
      }

      if (formData.rememberMe) {
        setRememberToken(user.id, 30);
      }

      setCurrentUser(user);

      addAuditLog({
        userId: user.id,
        action: "LOGIN_SUCCESS",
        details: `User logged in successfully`,
        ipAddress: "N/A",
      });

      const roleLabels: Record<string, string> = {
        super_admin: "Super Administrator",
        admin_layanan: "Admin Layanan",
        admin_penyedia: "Admin Penyedia",
        teknisi: "Teknisi",
        pegawai: "Pegawai",
      };

      const roleLabel = roleLabels[user.role] || user.role;

      toast.success(`Selamat datang, ${user.name}!`, {
        description: (
          <div className="text-black">
            Anda login sebagai <span className="font-medium">{roleLabel}</span>
          </div>
        ),
        style: {
          background: "#ffffff",
          color: "#000000",
        },
      });

      onLogin(user);
    } catch (err: any) {
      console.error("Login error:", err);
      const errorMessage =
        err?.body?.message ||
        err?.body?.errors?.email?.[0] ||
        "Email atau password tidak valid";
      setError(errorMessage);

      addAuditLog({
        userId: "unknown",
        action: "LOGIN_FAILED",
        details: `Failed login attempt for: ${formData.login}`,
        ipAddress: "N/A",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API}/password/forgot`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ email: forgotPasswordEmail }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Gagal mengirim email reset password");
      }

      toast.success("Link reset password telah dikirim ke email Anda");
      setResetSuccess(true);
    } catch (err: any) {
      console.error("Forgot password error:", err);
      toast.error(err.message || "Gagal mengirim email reset password");
    } finally {
      setIsLoading(false);
    }
  };

  if (showForgotPassword) {
    return (
      <div className="min-h-screen m-0 flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-white to-blue-50">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="w-full max-w-md shadow-xl border-t-white/50">
            <CardHeader className="text-center space-y-4">
              {/* LOGO DENGAN BORDER BESI */}
              <motion.div
                className={metalIconWrapper}
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <Mail className="h-10 w-10 text-white drop-shadow-md" />
              </motion.div>
              <div>
                <CardTitle className="text-2xl text-gray-800">Reset Password</CardTitle>
                <CardDescription className="mt-2 text-gray-500">
                  {resetSuccess
                    ? "Link reset password telah dikirim"
                    : "Masukkan email terdaftar untuk reset password"}
                </CardDescription>
              </div>
            </CardHeader>

            {!resetSuccess ? (
              <form onSubmit={handleForgotPassword}>
                <CardContent className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={forgotPasswordEmail}
                      onChange={(e) => setForgotPasswordEmail(e.target.value)}
                      placeholder="nama@bps-ntb.go.id"
                      required
                      className="rounded-lg border-gray-300 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* ALERT INFO YANG DIPERBAIKI */}
                  <Alert className={soapAlertStyle}>
                    <AlertCircle className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-sm text-blue-700 font-medium">
                      Link reset password akan dikirim ke email Anda dan berlaku
                      selama 1 jam
                    </AlertDescription>
                  </Alert>
                </CardContent>
                <CardFooter className="flex flex-col space-y-3 pb-8">
                  <Button type="submit" className={soapButtonPrimary} disabled={isLoading}>
                    {isLoading ? "Mengirim..." : "Kirim Link Reset"}
                  </Button>

                  {/* TOMBOL KEMBALI (GAYA SABUN SEKUNDER) */}
                  <Button
                    type="button"
                    variant="ghost"
                    className={soapButtonSecondary}
                    onClick={() => {
                      setShowForgotPassword(false);
                      setResetSuccess(false);
                      setForgotPasswordEmail("");
                    }}
                  >
                    Kembali ke Login
                  </Button>
                </CardFooter>
              </form>
            ) : (
              <CardContent className="space-y-6 pb-8">
                <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center shadow-inner">
                  <p className="text-green-800 font-medium">
                    Email reset password telah dikirim ke
                  </p>
                  <p className="text-green-900 font-bold text-lg my-1">
                    {forgotPasswordEmail}
                  </p>
                  <p className="text-sm text-green-600 mt-2">
                    Silakan cek inbox Anda dan klik link yang diberikan
                  </p>
                </div>

                {/* TOMBOL KEMBALI KEDUA (GAYA SABUN SEKUNDER) */}
                <Button
                  variant="ghost"
                  className={soapButtonSecondary}
                  onClick={() => {
                    setShowForgotPassword(false);
                    setResetSuccess(false);
                    setForgotPasswordEmail("");
                  }}
                >
                  Kembali ke Login
                </Button>
              </CardContent>
            )}
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-svh flex items-center justify-center p-4 bg-[#F8F9FA]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-4xl"
      >
        <Card className="w-full max-w-4xl overflow-hidden shadow-2xl rounded-2xl border-white/50">
          <CardContent className="grid p-0 md:grid-cols-2">
            <div className="flex flex-col justify-center p-6 pb-0 !mb-0 sm:p-10 bg-white/50 backdrop-blur-sm">
              <CardHeader className="p-0 px-6 pt-6 mb-6 text-center md:text-left max-w-full">
                <div className="flex justify-center md:justify-start">
                  <div className="h-20 w-20 flex items-center justify-center rounded-full bg-white shadow-sm border border-gray-100">
                    <img
                      src="/logo.svg"
                      alt="Logo BPS Provinsi NTB"
                      className="w-auto h-auto object-contain"
                    />
                  </div>
                </div>

                {/* Tambah teks SIGAP-TI di bawah icon untuk layar max-md */}
                <div className="md:hidden text-center mt-2">
                  <h1 className="text font-black text-xl text-gray-900">Sigap-ti</h1>
                </div>
              </CardHeader>

              <form onSubmit={handleLogin}>
                <CardContent className="space-y-5">
                  <AnimatePresence mode="wait">
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <Alert variant="destructive" className="mt-4 rounded-xl shadow-sm">
                          <AlertCircle className="h-3 w-3" />
                          <AlertDescription>{error}</AlertDescription>
                        </Alert>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="space-y-2">
                    <Label htmlFor="login" className="text-gray-700 font-medium ml-1">Email</Label>
                    <Input
                      id="login"
                      name="login"
                      type="email"
                      value={formData.login}
                      onChange={handleInputChange}
                      placeholder="user@gmail.com"
                      required
                      autoComplete="email"
                      className="rounded-xl border-gray-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 h-11 pr-10"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-gray-700 font-medium ml-1">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={handleInputChange}
                        placeholder="Masukkan password"
                        required
                        autoComplete="current-password"
                        className="rounded-xl border-gray-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 h-11 !pr-12"
                      />

                      {/* TOMBOL MATA DIPERBAIKI */}
                      <button
                        type="button"
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all active:scale-90"
                        onClick={() => setShowPassword(!showPassword)}
                        tabIndex={-1}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center space-x-2">
                      {/* CHECKBOX DENGAN EFEK */}
                      <Checkbox
                        id="remember"
                        checked={formData.rememberMe}
                        onCheckedChange={(checked) =>
                          setFormData((prev) => ({
                            ...prev,
                            rememberMe: !!checked,
                          }))
                        }
                        className="rounded border-gray-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 shadow-sm"
                      />
                      <Label
                        htmlFor="remember"
                        className="text-sm cursor-pointer font-normal text-gray-600 select-none hover:text-gray-900 transition-colors"
                      >
                        Ingat Saya
                      </Label>
                    </div>

                    {/* LUPA PASSWORD DENGAN EFEK PILL */}
                    <Button
                      type="button"
                      variant="ghost"
                      className="px-3 h-8 text-sm font-medium text-blue-600 rounded-full hover:bg-blue-50 hover:text-blue-700 transition-colors"
                      onClick={() => setShowForgotPassword(true)}
                    >
                      Lupa Password?
                    </Button>
                  </div>
                </CardContent>

                <CardFooter className="flex flex-col space-y-4 p-0 !pl-6 !pr-6 mt-6 pb-6">
                  <Button
                    type="submit"
                    className={soapButtonPrimary}
                    disabled={isLoading}
                  >
                    {isLoading ? "Memverifikasi..." : "Masuk"}
                  </Button>
                  <p className="text-center text-xs text-gray-400">
                    Belum punya akun? Hubungi administrator
                  </p>
                </CardFooter>
              </form>
            </div>

            {/* Banner Side (Kanan) */}
            <div className="relative hidden h-full bg-muted md:block overflow-hidden">
              <img
                src="/banner.jpg"
                alt=""
                aria-hidden="true"
                className="absolute inset-0 h-full w-full object-cover"
              />
              <img
                src="/banner.svg"
                alt="Image"
                className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale z-10 opacity-80"
              />
              {/* Filter biru penuh untuk overlay */}
              <div className="absolute inset-0 z-15 bg-blue-600/15" />
              {/* Gradient untuk kontras teks di bawah */}
              <div className="absolute inset-0 z-16 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
              
              <div className="absolute bottom-8 left-8 z-20 flex flex-col gap-2">
                <h1 className="text-white text-5xl font-black">Sigap-ti</h1>
                <div className="text-white text-lg leading max-w-sm drop-shadow-md">
                  Sistem Layanan Internal Terpadu Badan Pusat Statistik Provinsi Nusa Tenggara Barat
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};