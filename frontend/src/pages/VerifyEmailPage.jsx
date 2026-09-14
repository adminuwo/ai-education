import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { authApi } from '@/lib/api';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
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

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2.5 font-display text-2xl font-semibold mb-6">
          <img src="/logo192.png" alt="Convee Education Logo" className="h-8 w-8 object-contain rounded-md" />
          <span>Convee Education</span>
        </div>
        <Card className="border-border shadow-md">
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            {status === 'loading' && (
              <>
                <Loader2 className="h-10 w-10 mx-auto animate-spin text-primary" />
                <p className="text-muted-foreground">Verifying your email…</p>
              </>
            )}
            {status === 'success' && (
              <>
                <CheckCircle2 className="h-10 w-10 mx-auto text-emerald-500" />
                <h2 className="text-xl font-semibold">Email verified!</h2>
                <p className="text-muted-foreground text-sm">{message}</p>
                <Button
                  className="mt-2 w-full"
                  onClick={() => navigate('/login')}
                >
                  Continue to login
                </Button>
              </>
            )}
            {status === 'error' && (
              <>
                <XCircle className="h-10 w-10 mx-auto text-destructive" />
                <h2 className="text-xl font-semibold">Verification failed</h2>
                <p className="text-muted-foreground text-sm">{message}</p>
                <div className="flex flex-col gap-2 mt-2">
                  <Button variant="outline" className="w-full" asChild>
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
