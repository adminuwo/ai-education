import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Sparkles, Mail } from 'lucide-react';
import { authApi } from '@/lib/api';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', fullName: '', orgName: '' });
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [sentTo, setSentTo] = useState('');
  const [resendLoading, setResendLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const r = await register(form);
      if (r.emailSent) {
        setSentTo(form.email);
        setEmailSent(true);
      } else {
        toast.success('Welcome aboard!');
        navigate('/app/home', { replace: true });
      }
    } catch (e) {
      toast.error(e?.response?.data?.error || 'Registration failed');
    } finally { setLoading(false); }
  };

  const resend = async () => {
    setResendLoading(true);
    try {
      const res = await authApi.resendVerification(sentTo);
      toast.success(res?.message || 'Verification email resent!');
    } catch (e) {
      toast.error(e?.response?.data?.error || 'Failed to resend email');
    } finally { setResendLoading(false); }
  };

  const BrandLogo = ({ className = '', size = 'default' }) => (
    <div className={`flex items-center gap-3 font-display tracking-tight ${className}`}>
      <div className="relative flex items-center justify-center shrink-0">
        <div className="absolute -inset-1 rounded-2xl bg-cyan-500/25 blur-md pointer-events-none" />
        <img
          src="/logo192.png"
          alt="AI Education Logo"
          className={`relative ${size === 'lg' ? 'h-11 w-11' : size === 'sm' ? 'h-8 w-8' : 'h-10 w-10'} rounded-xl object-contain shadow-md`}
        />
      </div>
      <div className="flex items-center font-bold tracking-tight">
        <span className="text-white text-2xl font-extrabold tracking-tight">AI</span>
        <span className="ml-1.5 bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-400 bg-clip-text text-transparent text-2xl font-extrabold tracking-tight">Education</span>
      </div>
    </div>
  );

  const BrandPanel = () => (
    <div className="relative hidden lg:flex flex-col justify-between p-6 lg:p-8 xl:p-10 2xl:p-12 bg-[#060913] text-white overflow-hidden border-r border-slate-800/80 h-full">
      {/* Ambient glowing radial light orbs matching the logo */}
      <div className="absolute top-[-15%] left-[-15%] w-[550px] h-[550px] rounded-full bg-cyan-500/15 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-15%] w-[550px] h-[550px] rounded-full bg-indigo-600/20 blur-[140px] pointer-events-none" />
      <div className="absolute top-[45%] left-[25%] w-[350px] h-[350px] rounded-full bg-emerald-500/10 blur-[90px] pointer-events-none" />

      {/* Subtle Neural Constellation Mesh Overlay */}
      <svg className="absolute inset-0 h-full w-full opacity-[0.06] pointer-events-none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="ai-education-mesh-reg" width="56" height="56" patternUnits="userSpaceOnUse">
            <circle cx="28" cy="28" r="1.5" fill="#00F2FE" />
            <path d="M 0 28 L 56 28 M 28 0 L 28 56" stroke="#38BDF8" strokeWidth="0.6" strokeDasharray="3 7" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#ai-education-mesh-reg)" />
      </svg>

      <div className="relative z-10">
        <BrandLogo size="lg" />
      </div>

      <div className="relative z-10 max-w-lg">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/25 text-cyan-300 text-[11px] xl:text-xs font-medium mb-3 xl:mb-5 backdrop-blur-sm">
          <Sparkles className="h-3 w-3 text-cyan-400 animate-pulse" />
          <span>New Institution Onboarding</span>
        </div>

        <h1 className="font-display text-2xl lg:text-3xl xl:text-4xl 2xl:text-5xl font-bold tracking-tight leading-[1.15] text-balance text-white">
          Deploy Your Campus <span className="bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-400 bg-clip-text text-transparent">Operating System</span> in Minutes.
        </h1>
        <p className="mt-2 xl:mt-3 text-xs xl:text-sm text-slate-400 leading-relaxed">
          Set up your institution, configure school wings, invite faculty, automate timetables, and manage students seamlessly with unified AI intelligence.
        </p>
      </div>

      <div className="relative z-10 flex items-center justify-between text-[11px] xl:text-xs text-slate-500 border-t border-slate-800/80 pt-3 xl:pt-4">
        <span>AI Education Platform · Institutional Portal</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" /> Secure Registration</span>
      </div>
    </div>
  );

  if (emailSent) {
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
                  <div className="h-10 w-10 rounded-full bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center">
                    <Mail className="h-5 w-5 text-cyan-400" />
                  </div>
                  <div>
                    <CardTitle className="font-display text-xl text-white">Check your inbox</CardTitle>
                    <p className="text-xs text-slate-400 mt-0.5">One last step</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 px-6 pb-5 pt-0">
                <div className="rounded-xl border border-cyan-500/25 bg-cyan-500/10 p-3 text-xs text-slate-200">
                  We sent a verification link to <strong className="text-cyan-300">{sentTo}</strong>. Click the link to activate your account.
                </div>
                <p className="text-[11px] text-slate-400">Didn't receive it? Check your spam folder or resend below.</p>
                <Button className="w-full font-semibold border-slate-700 bg-slate-800 hover:bg-slate-700 text-white h-9 text-xs" onClick={resend} disabled={resendLoading} variant="outline">
                  {resendLoading ? 'Sending…' : 'Resend verification email'}
                </Button>
                <div className="text-center text-xs text-slate-400 pt-1">
                  Already verified? <Link to="/login" className="font-medium text-cyan-400 hover:underline">Sign in</Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  const startGoogle = async () => {
    try {
      const { url } = await authApi.googleStart('register');
      window.location.href = url;
    } catch (e) {
      toast.error(e?.response?.data?.error || 'Google OAuth not configured');
    }
  };

  return (
    <div className="min-h-screen lg:h-screen lg:max-h-screen lg:overflow-hidden grid grid-cols-1 lg:grid-cols-2 bg-[#060913]">
      <BrandPanel />
      <div className="relative flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-[#070B14] overflow-y-auto lg:overflow-hidden h-full">
        <div className="absolute top-[15%] right-[-10%] w-[450px] h-[450px] rounded-full bg-cyan-500/10 blur-[130px] pointer-events-none" />
        <div className="absolute bottom-[10%] left-[-10%] w-[450px] h-[450px] rounded-full bg-indigo-600/10 blur-[130px] pointer-events-none" />

        <div className="w-full max-w-md relative z-10 my-auto">
          <div className="lg:hidden flex flex-col items-center justify-center mb-6">
            <BrandLogo />
            <span className="text-xs text-slate-400 mt-1.5">Digital Campus & Academic Intelligence</span>
          </div>

          <Card className="w-full border-slate-800/90 bg-slate-900/80 backdrop-blur-xl shadow-2xl shadow-cyan-950/30">
            <CardHeader className="pb-3 pt-5 px-5 sm:px-6">
              <CardTitle className="font-display text-xl xl:text-2xl text-white">Create your account</CardTitle>
              <p className="text-xs xl:text-sm text-slate-400 mt-0.5">You will be the Director of your institution.</p>
            </CardHeader>
            <CardContent className="space-y-3 px-5 sm:px-6 pb-5 pt-0">
              <form onSubmit={submit} className="space-y-2.5">
                <div>
                  <Label htmlFor="fullName" className="text-xs text-slate-300">Full name</Label>
                  <Input
                    id="fullName"
                    required
                    value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                    placeholder="Dr. Jane Doe"
                    className="bg-slate-950/60 border-slate-800 focus-visible:ring-cyan-500/40 text-white mt-1 h-9 text-sm"
                    data-testid="register-name-input"
                  />
                </div>
                <div>
                  <Label htmlFor="email" className="text-xs text-slate-300">Work email</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="you@company.com"
                    className="bg-slate-950/60 border-slate-800 focus-visible:ring-cyan-500/40 text-white mt-1 h-9 text-sm"
                    data-testid="register-email-input"
                  />
                </div>
                <div>
                  <Label htmlFor="password" className="text-xs text-slate-300">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    minLength={6}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="At least 6 characters"
                    className="bg-slate-950/60 border-slate-800 focus-visible:ring-cyan-500/40 text-white mt-1 h-9 text-sm"
                    data-testid="register-password-input"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full font-semibold py-2 bg-gradient-to-r from-cyan-500 via-sky-500 to-indigo-600 hover:from-cyan-400 hover:via-sky-400 hover:to-indigo-500 text-white shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all border-0 h-10 text-sm"
                  disabled={loading}
                  data-testid="register-submit-button"
                >
                  {loading ? 'Creating…' : 'Create account'}
                </Button>
              </form>
              <div className="my-2.5 flex items-center gap-3"><div className="h-px flex-1 bg-slate-800" /><span className="text-[11px] text-slate-500">OR</span><div className="h-px flex-1 bg-slate-800" /></div>
              <Button variant="outline" className="w-full border-slate-800 bg-slate-950/40 hover:bg-slate-800 text-slate-200 h-9 text-xs" onClick={startGoogle} data-testid="register-google-button">
                <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                Continue with Google
              </Button>
              <div className="mt-3 text-center text-xs text-slate-400">Already have an account? <Link to="/login" className="font-medium text-cyan-400 hover:underline">Sign in</Link></div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

