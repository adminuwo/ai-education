import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { authApi } from '@/lib/api';
import { Sparkles, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token');

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (password !== confirm) {
      toast.error('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await authApi.resetPassword(token, password);
      setDone(true);
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to reset password. The link may be expired.');
    } finally {
      setLoading(false);
    }
  };

  const BrandLogo = () => (
    <div className="flex items-center justify-center gap-3 font-display tracking-tight mb-8">
      <div className="relative flex items-center justify-center shrink-0">
        <div className="absolute -inset-1 rounded-2xl bg-cyan-500/25 blur-md pointer-events-none" />
        <img
          src="/logo192.png"
          alt="AI Education Logo"
          className="relative h-10 w-10 rounded-xl object-contain shadow-md"
        />
      </div>
      <div className="flex items-center font-bold tracking-tight">
        <span className="text-white text-2xl font-extrabold tracking-tight">AI</span>
        <span className="ml-1.5 bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-400 bg-clip-text text-transparent text-2xl font-extrabold tracking-tight">Education</span>
      </div>
    </div>
  );

  if (!token) {
    return (
      <div className="min-h-screen bg-[#070B14] flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute top-[20%] right-[-10%] w-[400px] h-[400px] rounded-full bg-cyan-500/10 blur-[130px] pointer-events-none" />
        <div className="w-full max-w-md relative z-10">
          <BrandLogo />
          <Card className="border-slate-800/90 bg-slate-900/80 backdrop-blur-xl shadow-2xl shadow-cyan-950/30">
            <CardContent className="pt-8 pb-8 text-center space-y-4">
              <p className="text-destructive font-medium">Invalid reset link. No token provided.</p>
              <Button className="font-semibold border-slate-700 bg-slate-800 hover:bg-slate-700 text-white" variant="outline" onClick={() => navigate('/login')}>
                Back to login
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070B14] flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[15%] right-[-10%] w-[450px] h-[450px] rounded-full bg-cyan-500/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[10%] left-[-10%] w-[450px] h-[450px] rounded-full bg-indigo-600/10 blur-[130px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <BrandLogo />
        <Card className="border-slate-800/90 bg-slate-900/80 backdrop-blur-xl shadow-2xl shadow-cyan-950/30">
          <CardHeader>
            <CardTitle className="font-display text-2xl text-white">Set new password</CardTitle>
            <p className="text-sm text-slate-400">Choose a strong password for your account.</p>
          </CardHeader>
          <CardContent>
            {done ? (
              <div className="text-center space-y-4 py-4">
                <CheckCircle2 className="h-12 w-12 mx-auto text-emerald-400" />
                <h3 className="text-lg font-semibold text-white">Password updated!</h3>
                <p className="text-sm text-slate-400">Your password has been reset successfully.</p>
                <Button
                  className="w-full font-semibold py-2.5 bg-gradient-to-r from-cyan-500 via-sky-500 to-indigo-600 hover:from-cyan-400 hover:via-sky-400 hover:to-indigo-500 text-white shadow-lg shadow-cyan-500/25 border-0"
                  onClick={() => navigate('/login')}
                >
                  Continue to login
                </Button>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-4">
                <div>
                  <Label htmlFor="new-password" className="text-slate-300">New password</Label>
                  <div className="relative mt-1.5">
                    <Input
                      id="new-password"
                      type={showPw ? 'text' : 'password'}
                      required
                      autoFocus
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="bg-slate-950/60 border-slate-800 focus-visible:ring-cyan-500/40 text-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-cyan-400 transition-colors"
                    >
                      {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="confirm-password" className="text-slate-300">Confirm password</Label>
                  <Input
                    id="confirm-password"
                    type={showPw ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="••••••••"
                    className="bg-slate-950/60 border-slate-800 focus-visible:ring-cyan-500/40 text-white mt-1.5"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full font-semibold py-2.5 bg-gradient-to-r from-cyan-500 via-sky-500 to-indigo-600 hover:from-cyan-400 hover:via-sky-400 hover:to-indigo-500 text-white shadow-lg shadow-cyan-500/25 transition-all border-0"
                  disabled={loading}
                >
                  {loading ? 'Updating…' : 'Update password'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
