import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { authApi } from '@/lib/api';
import { Sparkles, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function VerifyEmailPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token');
  const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'error'
  const [message, setMessage] = useState('');
  const firedRef = useRef(false);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('No verification token provided in link.');
      return;
    }
    if (firedRef.current) return;
    firedRef.current = true;

    authApi.verifyEmail(token)
      .then((data) => {
        setStatus('success');
        setMessage(data.message || 'Email verified successfully!');
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err?.response?.data?.error || 'Verification failed. The link may be expired or invalid.');
      });
  }, [token]);

  const BrandLogo = () => (
    <div className="flex items-center justify-center gap-3 font-display tracking-tight mb-8">
      <div className="relative flex items-center justify-center shrink-0">
        <div className="absolute -inset-1 rounded-2xl bg-cyan-500/25 blur-md pointer-events-none" />
        <img
          src="/logo192.png"
          alt="Convee Education Logo"
          className="relative h-10 w-10 rounded-xl object-contain shadow-md"
        />
      </div>
      <div className="flex items-center font-bold tracking-tight">
        <span className="text-white text-2xl">Convee</span>
        <span className="ml-1.5 bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-400 bg-clip-text text-transparent text-2xl font-extrabold">Education</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#070B14] flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[15%] right-[-10%] w-[450px] h-[450px] rounded-full bg-cyan-500/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[10%] left-[-10%] w-[450px] h-[450px] rounded-full bg-indigo-600/10 blur-[130px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <BrandLogo />
        <Card className="border-slate-800/90 bg-slate-900/80 backdrop-blur-xl shadow-2xl shadow-cyan-950/30">
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            {status === 'loading' && (
              <>
                <Loader2 className="h-12 w-12 mx-auto animate-spin text-cyan-400" />
                <p className="text-slate-400">Verifying your email…</p>
              </>
            )}
            {status === 'success' && (
              <>
                <CheckCircle2 className="h-12 w-12 mx-auto text-emerald-400" />
                <h2 className="text-xl font-semibold text-white">Email verified!</h2>
                <p className="text-slate-400 text-sm">{message}</p>
                <Button
                  className="mt-2 w-full font-semibold py-2.5 bg-gradient-to-r from-cyan-500 via-sky-500 to-indigo-600 hover:from-cyan-400 hover:via-sky-400 hover:to-indigo-500 text-white shadow-lg shadow-cyan-500/25 border-0"
                  onClick={() => navigate('/login')}
                >
                  Continue to login
                </Button>
              </>
            )}
            {status === 'error' && (
              <>
                <XCircle className="h-12 w-12 mx-auto text-rose-400" />
                <h2 className="text-xl font-semibold text-white">Verification failed</h2>
                <p className="text-slate-400 text-sm">{message}</p>
                <div className="flex flex-col gap-2 mt-2">
                  <Button variant="outline" className="border-slate-700 bg-slate-800 hover:bg-slate-700 text-white" asChild>
                    <Link to="/login">Back to login</Link>
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
