import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Sparkles, ShieldCheck, Zap, Users, Mail, ArrowLeft, RefreshCw, GraduationCap, UserCheck, Info, KeyRound, Building2, IndianRupee } from 'lucide-react';
import { authApi } from '@/lib/api';

export default function LoginPage({ initialPortal = 'faculty' }) {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const defaultMode = queryParams.get('portal') || initialPortal;
  const [portalMode, setPortalMode] = useState(
    defaultMode === 'student' ? 'student' : defaultMode === 'parent' ? 'parent' : 'faculty'
  );

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  // View states: 'login' | 'unverified' | 'forgot' | 'forgot_sent'
  const [view, setView] = useState('login');
  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login({ email, password, portalMode });
      const from = location.state?.from?.pathname || '/app/home';
      navigate(from, { replace: true });
    } catch (err) {
      const code = err?.response?.data?.code;
      const serverEmail = err?.response?.data?.email;
      if (code === 'EMAIL_NOT_VERIFIED') {
        setUnverifiedEmail(serverEmail || email);
        setView('unverified');
      } else {
        toast.error(err?.response?.data?.error || 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (demoEmail, demoPw, targetPortal = portalMode) => {
    setEmail(demoEmail);
    setPassword(demoPw);
    setLoading(true);
    try {
      await login({ email: demoEmail, password: demoPw, portalMode: targetPortal });
      const from = location.state?.from?.pathname || '/app/home';
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const startGoogle = async () => {
    try {
      const { url } = await authApi.googleStart('login');
      window.location.href = url;
    } catch (e) {
      toast.error(e?.response?.data?.error || 'Google OAuth not configured');
    }
  };

  const resendVerification = async () => {
    setResendLoading(true);
    try {
      const res = await authApi.resendVerification(unverifiedEmail);
      toast.success(res?.message || 'Verification email sent! Check your inbox.');
    } catch (e) {
      toast.error(e?.response?.data?.error || 'Failed to resend email');
    } finally {
      setResendLoading(false);
    }
  };

  const sendForgotPassword = async (e) => {
    e.preventDefault();
    setForgotLoading(true);
    try {
      await authApi.forgotPassword(forgotEmail);
      setView('forgot_sent');
    } catch (e) {
      toast.error(e?.response?.data?.error || 'Failed to send reset email');
    } finally {
      setForgotLoading(false);
    }
  };

  const BrandLogo = ({ className = '', size = 'default' }) => (
    <div className={`flex items-center gap-3 font-display tracking-tight ${className}`}>
      <div className="relative flex items-center justify-center shrink-0">
        <div className="absolute -inset-1 rounded-2xl bg-cyan-500/25 blur-md pointer-events-none" />
        <img
          src="/logo192.png"
          alt="Convee Education Logo"
          className={`relative ${size === 'lg' ? 'h-11 w-11' : size === 'sm' ? 'h-8 w-8' : 'h-10 w-10'} rounded-xl object-contain shadow-md`}
        />
      </div>
      <div className="flex items-center font-bold tracking-tight">
        <span className="text-white text-2xl">Convee</span>
        <span className="ml-1.5 bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-400 bg-clip-text text-transparent text-2xl font-extrabold">Education</span>
      </div>
    </div>
  );

  const BrandPanel = () => (
    <div className="relative hidden lg:flex flex-col justify-between p-6 lg:p-8 xl:p-10 2xl:p-12 bg-[#060913] text-white overflow-hidden border-r border-slate-800/80 h-full">
      {/* Ambient glowing radial light orbs matching the logo */}
      <div className="absolute top-[-15%] left-[-15%] w-[550px] h-[550px] rounded-full bg-cyan-500/15 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-15%] w-[550px] h-[550px] rounded-full bg-indigo-600/20 blur-[140px] pointer-events-none" />
      <div className="absolute top-[45%] left-[25%] w-[350px] h-[350px] rounded-full bg-blue-500/10 blur-[90px] pointer-events-none" />

      {/* Subtle Neural Constellation Mesh Overlay */}
      <svg className="absolute inset-0 h-full w-full opacity-[0.06] pointer-events-none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="convee-mesh" width="56" height="56" patternUnits="userSpaceOnUse">
            <circle cx="28" cy="28" r="1.5" fill="#00F2FE" />
            <path d="M 0 28 L 56 28 M 28 0 L 28 56" stroke="#38BDF8" strokeWidth="0.6" strokeDasharray="3 7" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#convee-mesh)" />
      </svg>

      <div className="relative z-10">
        <BrandLogo size="lg" />
      </div>

      <div className="relative z-10 max-w-lg">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/25 text-cyan-300 text-[11px] xl:text-xs font-medium mb-3 xl:mb-5 backdrop-blur-sm">
          <Sparkles className="h-3 w-3 text-cyan-400 animate-pulse" />
          <span>AI-Powered Academic Intelligence</span>
        </div>

        <h1 className="font-display text-2xl lg:text-3xl xl:text-4xl 2xl:text-5xl font-bold tracking-tight leading-[1.15] text-balance text-white">
          Digital Campus <span className="bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-400 bg-clip-text text-transparent">Collaboration</span> & Academic Portal.
        </h1>
        <p className="mt-2 xl:mt-3 text-xs xl:text-sm text-slate-400 leading-relaxed">
          Unified institutional operating platform for school wings, academic classes, live timetable sync, faculty channels, and verified student directory.
        </p>

        <div className="mt-4 xl:mt-6 space-y-2 xl:space-y-2.5">
          <div className="flex items-center gap-3 p-2 xl:p-2.5 rounded-xl bg-slate-900/50 border border-slate-800/80 backdrop-blur-sm">
            <div className="h-8 w-8 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
              <Building2 className="h-4 w-4" />
            </div>
            <div className="text-xs xl:text-sm">
              <span className="font-semibold text-slate-200 block leading-tight">School Wings & Class Section Management</span>
              <span className="text-[11px] text-slate-400 leading-tight">Playschool, Primary, Middle, Secondary & Senior Secondary hierarchy</span>
            </div>
          </div>

          <div className="flex items-center gap-3 p-2 xl:p-2.5 rounded-xl bg-slate-900/50 border border-slate-800/80 backdrop-blur-sm">
            <div className="h-8 w-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <GraduationCap className="h-4 w-4" />
            </div>
            <div className="text-xs xl:text-sm">
              <span className="font-semibold text-slate-200 block leading-tight">Dedicated Student Directory & Secure Access</span>
              <span className="text-[11px] text-slate-400 leading-tight">Direct admission ID access, automated homework tracking, and attendance</span>
            </div>
          </div>

          <div className="flex items-center gap-3 p-2 xl:p-2.5 rounded-xl bg-slate-900/50 border border-slate-800/80 backdrop-blur-sm">
            <div className="h-8 w-8 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
              <UserCheck className="h-4 w-4" />
            </div>
            <div className="text-xs xl:text-sm">
              <span className="font-semibold text-slate-200 block leading-tight">Faculty & Staff Hierarchy</span>
              <span className="text-[11px] text-slate-400 leading-tight">Director, Principal, Dean, HOD & Teacher class-level permissions</span>
            </div>
          </div>

          <div className="flex items-center gap-3 p-2 xl:p-2.5 rounded-xl bg-slate-900/50 border border-slate-800/80 backdrop-blur-sm">
            <div className="h-8 w-8 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div className="text-xs xl:text-sm">
              <span className="font-semibold text-slate-200 block leading-tight">Role-based Access & Campus Security</span>
              <span className="text-[11px] text-slate-400 leading-tight">Class assignment controls with encrypted data segregation</span>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 flex items-center justify-between text-[11px] xl:text-xs text-slate-500 border-t border-slate-800/80 pt-3 xl:pt-4">
        <span>Convee Education Platform · Institutional Portal</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" /> Live System Active</span>
      </div>
    </div>
  );

  // Unverified email view
  if (view === 'unverified') {
    return (
      <div className="min-h-screen lg:h-screen lg:max-h-screen lg:overflow-hidden grid grid-cols-1 lg:grid-cols-2 bg-[#060913]">
        <BrandPanel />
        <div className="relative flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-[#070B14] overflow-y-auto lg:overflow-hidden h-full">
          <div className="absolute top-[10%] right-[-10%] w-[450px] h-[450px] rounded-full bg-cyan-500/10 blur-[120px] pointer-events-none" />
          <div className="absolute bottom-[10%] left-[-10%] w-[450px] h-[450px] rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none" />

          <div className="w-full max-w-md relative z-10 my-auto">
            <div className="lg:hidden flex flex-col items-center justify-center mb-6">
              <BrandLogo />
              <span className="text-xs text-slate-400 mt-1.5">Digital Campus & Academic Intelligence</span>
            </div>

            <Card className="w-full border-slate-800/90 bg-slate-900/80 backdrop-blur-xl shadow-2xl shadow-cyan-950/30">
              <CardHeader className="pb-3 pt-5 px-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-10 w-10 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
                    <Mail className="h-5 w-5 text-amber-400" />
                  </div>
                  <div>
                    <CardTitle className="font-display text-lg xl:text-xl text-white">Verify your email</CardTitle>
                    <p className="text-xs text-slate-400 mt-0.5">Check your inbox to continue</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 px-6 pb-5 pt-0">
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300">
                  We sent a verification link to <strong className="text-amber-200">{unverifiedEmail}</strong>. Please check your inbox (and spam folder) and click the link to activate your account.
                </div>
                <Button className="w-full font-semibold border-slate-700 bg-slate-800 hover:bg-slate-700 text-white h-9 text-xs" onClick={resendVerification} disabled={resendLoading} variant="outline">
                  <RefreshCw className={`h-3.5 w-3.5 mr-2 ${resendLoading ? 'animate-spin' : ''}`} />
                  {resendLoading ? 'Sending…' : 'Resend verification email'}
                </Button>
                <button
                  type="button"
                  onClick={() => setView('login')}
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-400 transition-colors w-full justify-center pt-1"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Back to login
                </button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Forgot password view
  if (view === 'forgot') {
    return (
      <div className="min-h-screen lg:h-screen lg:max-h-screen lg:overflow-hidden grid grid-cols-1 lg:grid-cols-2 bg-[#060913]">
        <BrandPanel />
        <div className="relative flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-[#070B14] overflow-y-auto lg:overflow-hidden h-full">
          <div className="absolute top-[10%] right-[-10%] w-[450px] h-[450px] rounded-full bg-cyan-500/10 blur-[120px] pointer-events-none" />
          <div className="absolute bottom-[10%] left-[-10%] w-[450px] h-[450px] rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none" />

          <div className="w-full max-w-md relative z-10 my-auto">
            <div className="lg:hidden flex flex-col items-center justify-center mb-6">
              <BrandLogo />
              <span className="text-xs text-slate-400 mt-1.5">Digital Campus & Academic Intelligence</span>
            </div>

            <Card className="w-full border-slate-800/90 bg-slate-900/80 backdrop-blur-xl shadow-2xl shadow-cyan-950/30">
              <CardHeader className="pb-3 pt-5 px-6">
                <CardTitle className="font-display text-xl text-white">Reset password</CardTitle>
                <p className="text-xs text-slate-400">Enter your email and we'll send you a reset link.</p>
              </CardHeader>
              <CardContent className="space-y-3 px-6 pb-5 pt-0">
                <form onSubmit={sendForgotPassword} className="space-y-3">
                  <div>
                    <Label htmlFor="forgot-email" className="text-xs text-slate-300">Email</Label>
                    <Input
                      id="forgot-email"
                      type="email"
                      required
                      autoFocus
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="you@school.edu"
                      className="bg-slate-950/60 border-slate-800 focus-visible:ring-cyan-500/40 text-white mt-1 h-9 text-sm"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full font-semibold py-2 bg-gradient-to-r from-cyan-500 via-sky-500 to-indigo-600 hover:from-cyan-400 hover:via-sky-400 hover:to-indigo-500 text-white shadow-lg shadow-cyan-500/25 transition-all border-0 h-9 text-sm"
                    disabled={forgotLoading}
                  >
                    {forgotLoading ? 'Sending…' : 'Send reset link'}
                  </Button>
                </form>
                <button
                  type="button"
                  onClick={() => setView('login')}
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-400 transition-colors w-full justify-center pt-2"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Back to login
                </button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Forgot password sent view
  if (view === 'forgot_sent') {
    return (
      <div className="min-h-screen lg:h-screen lg:max-h-screen lg:overflow-hidden grid grid-cols-1 lg:grid-cols-2 bg-[#060913]">
        <BrandPanel />
        <div className="relative flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-[#070B14] overflow-y-auto lg:overflow-hidden h-full">
          <div className="absolute top-[10%] right-[-10%] w-[450px] h-[450px] rounded-full bg-cyan-500/10 blur-[120px] pointer-events-none" />
          <div className="absolute bottom-[10%] left-[-10%] w-[450px] h-[450px] rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none" />

          <div className="w-full max-w-md relative z-10 my-auto">
            <div className="lg:hidden flex flex-col items-center justify-center mb-6">
              <BrandLogo />
              <span className="text-xs text-slate-400 mt-1.5">Digital Campus & Academic Intelligence</span>
            </div>

            <Card className="w-full border-slate-800/90 bg-slate-900/80 backdrop-blur-xl shadow-2xl shadow-cyan-950/30">
              <CardHeader className="pb-3 pt-5 px-6">
                <div className="flex items-center gap-3 mb-1">
                  <div className="h-10 w-10 rounded-full bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center">
                    <Mail className="h-5 w-5 text-cyan-400" />
                  </div>
                  <div>
                    <CardTitle className="font-display text-xl text-white">Check your inbox</CardTitle>
                    <p className="text-xs text-slate-400 mt-0.5">Reset link sent</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 px-6 pb-5 pt-0">
                <p className="text-xs text-slate-300 leading-relaxed">
                  If <strong className="text-cyan-300">{forgotEmail}</strong> is registered, you'll receive a password reset link within a few minutes.
                </p>
                <button
                  type="button"
                  onClick={() => setView('login')}
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-400 transition-colors w-full justify-center pt-2"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Back to login
                </button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Main login view
  return (
    <div className="min-h-screen lg:h-screen lg:max-h-screen lg:overflow-hidden grid grid-cols-1 lg:grid-cols-2 bg-[#060913]">
      <BrandPanel />
      <div className="relative flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-[#070B14] overflow-y-auto lg:overflow-hidden h-full">
        {/* Ambient background glows */}
        <div className="absolute top-[15%] right-[-10%] w-[450px] h-[450px] rounded-full bg-cyan-500/10 blur-[130px] pointer-events-none" />
        <div className="absolute bottom-[10%] left-[-10%] w-[450px] h-[450px] rounded-full bg-indigo-600/10 blur-[130px] pointer-events-none" />

        <div className="w-full max-w-md relative z-10 my-auto">
          {/* Mobile logo header */}
          <div className="lg:hidden flex flex-col items-center justify-center mb-6">
            <BrandLogo />
            <span className="text-xs text-slate-400 mt-1.5">Digital Campus & Academic Intelligence</span>
          </div>

          <Card className="w-full border-slate-800/90 bg-slate-900/80 backdrop-blur-xl shadow-2xl shadow-cyan-950/30">
            <CardHeader className="pb-3 pt-5 px-5 sm:px-6">
              {/* Mode Switcher Tabs */}
              <div className="grid grid-cols-3 gap-1 p-1 bg-slate-950/80 rounded-xl border border-slate-800 mb-3">
                <button
                  type="button"
                  onClick={() => setPortalMode('faculty')}
                  className={`py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    portalMode === 'faculty'
                      ? 'bg-blue-600/20 text-blue-300 border border-blue-500/40 shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  data-testid="faculty-tab-btn"
                >
                  <UserCheck className="h-3.5 w-3.5 text-blue-400" />
                  <span>Faculty</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPortalMode('student')}
                  className={`py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    portalMode === 'student'
                      ? 'bg-cyan-600/20 text-cyan-300 border border-cyan-500/40 shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  data-testid="student-tab-btn"
                >
                  <GraduationCap className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Student</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPortalMode('parent')}
                  className={`py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    portalMode === 'parent'
                      ? 'bg-purple-600/20 text-purple-300 border border-purple-500/40 shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  data-testid="parent-tab-btn"
                >
                  <ShieldCheck className="h-3.5 w-3.5 text-purple-400" />
                  <span>Parent</span>
                </button>
              </div>

              {portalMode === 'faculty' ? (
                <div>
                  <CardTitle className="font-display text-xl xl:text-2xl flex items-center gap-2 text-white">
                    <UserCheck className="h-5 w-5 text-blue-400" /> Faculty & Staff Sign In
                  </CardTitle>
                  <p className="text-xs xl:text-sm text-slate-400 mt-0.5">Sign in with your institutional credentials.</p>
                </div>
              ) : portalMode === 'student' ? (
                <div>
                  <CardTitle className="font-display text-xl xl:text-2xl flex items-center gap-2 text-white">
                    <GraduationCap className="h-5 w-5 text-cyan-400" /> Student Portal Sign In
                  </CardTitle>
                  <p className="text-xs xl:text-sm text-slate-400 mt-0.5">Access your class channels, assignments, and campus updates.</p>
                </div>
              ) : (
                <div>
                  <CardTitle className="font-display text-xl xl:text-2xl flex items-center gap-2 text-white">
                    <ShieldCheck className="h-5 w-5 text-purple-400" /> Parent Portal Sign In
                  </CardTitle>
                  <p className="text-xs xl:text-sm text-slate-400 mt-0.5">View attendance records, homework rubrics, and message teachers.</p>
                </div>
              )}
            </CardHeader>

            <CardContent className="space-y-3 px-5 sm:px-6 pb-5 pt-0">
              <form onSubmit={submit} className="space-y-2.5">
                <div>
                  <Label htmlFor="username" className="text-xs text-slate-300">
                    {portalMode === 'student' ? 'Student ID / Admission No' : portalMode === 'parent' ? 'Parent ID' : 'Work Email or Faculty / Staff ID'}
                  </Label>
                  <Input
                    id="username"
                    name="username"
                    type="text"
                    required
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={
                      portalMode === 'student'
                        ? 'e.g. STU-2026-ALEX'
                        : portalMode === 'parent'
                        ? 'e.g. PAR-2026-ALEX'
                        : 'e.g. director@demo.edu or PRN-2026-3674'
                    }
                    className="bg-slate-950/60 border-slate-800 focus-visible:ring-cyan-500/40 text-white mt-1 h-9 text-sm"
                    data-testid="login-email-input"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-xs text-slate-300">Password</Label>
                    <button type="button" onClick={() => setShowPw((v) => !v)} className="text-xs text-slate-400 hover:text-cyan-400 transition-colors">{showPw ? 'Hide' : 'Show'}</button>
                  </div>
                  <Input
                    id="password"
                    type={showPw ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="bg-slate-950/60 border-slate-800 focus-visible:ring-cyan-500/40 text-white mt-1 h-9 text-sm"
                    data-testid="login-password-input"
                  />
                  <div className="mt-1 text-right">
                    <button type="button" onClick={() => { setForgotEmail(email); setView('forgot'); }} className="text-xs text-slate-400 hover:text-cyan-400 transition-colors">
                      Forgot password?
                    </button>
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full font-semibold py-2 bg-gradient-to-r from-cyan-500 via-sky-500 to-indigo-600 hover:from-cyan-400 hover:via-sky-400 hover:to-indigo-500 text-white shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all border-0 h-10 text-sm"
                  disabled={loading}
                  data-testid="login-submit-button"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <RefreshCw className="h-4 w-4 animate-spin" /> Signing in…
                    </span>
                  ) : portalMode === 'student' ? (
                    'Sign in to Student Portal'
                  ) : portalMode === 'parent' ? (
                    'Sign in to Parent Portal'
                  ) : (
                    'Sign in to Faculty Portal'
                  )}
                </Button>
              </form>

              {portalMode === 'faculty' ? (
                <>
                  <div className="my-2.5 flex items-center gap-3"><div className="h-px flex-1 bg-slate-800" /><span className="text-[11px] text-slate-500">OR</span><div className="h-px flex-1 bg-slate-800" /></div>
                  <Button variant="outline" className="w-full border-slate-800 bg-slate-950/40 hover:bg-slate-800 text-slate-200 h-9 text-xs" onClick={startGoogle} data-testid="login-google-button">
                    <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                    Continue with Google
                  </Button>
                  <div className="mt-2 text-center text-[11px] text-slate-500">
                    Accounts are provisioned by your institution. Need access? Contact your administrator.
                  </div>
                </>
              ) : portalMode === 'student' ? (
                /* Student Notice Box */
                <div className="mt-2 p-2.5 rounded-xl border border-cyan-500/25 bg-cyan-500/10 text-xs text-cyan-300 space-y-1">
                  <div className="font-semibold flex items-center gap-1.5 text-cyan-200 text-xs">
                    <Info className="h-3.5 w-3.5 shrink-0 text-cyan-400" /> Student Account Notice
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Student accounts are generated directly by the school administration. Self-registration is disabled for students. Please contact your class teacher or school administrator to receive your credentials.
                  </p>
                </div>
              ) : (
                /* Parent Notice Box */
                <div className="mt-2 p-2.5 rounded-xl border border-purple-500/25 bg-purple-500/10 text-xs text-purple-300 space-y-1">
                  <div className="font-semibold flex items-center gap-1.5 text-purple-200 text-xs">
                    <UserCheck className="h-3.5 w-3.5 shrink-0 text-purple-400" /> Parent Portal Access
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Parent accounts allow monitoring of student attendance records, graded homework rubrics, and direct messaging with class teachers.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
