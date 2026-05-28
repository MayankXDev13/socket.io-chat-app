import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import api from '@/lib/api';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Missing verification token.');
      return;
    }
    api.post('/auth/verify-email', { token })
      .then(({ data }) => { setStatus('success'); setMessage(data.message); })
      .catch((err) => { setStatus('error'); setMessage(err.response?.data?.message || 'Verification failed.'); });
  }, [token]);

  return (
    <div className="auth-bg flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md glass-strong border-border/30 animate-slide-up">
        <CardContent className="pt-6 text-center space-y-4">
          {status === 'loading' && (
            <>
              <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto" />
              <p className="text-muted-foreground">Verifying your email...</p>
            </>
          )}
          {status === 'success' && (
            <>
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-xl font-bold">Email Verified!</h2>
              <p className="text-muted-foreground text-sm">{message}</p>
              <Link to="/login"><Button className="mt-4">Sign In</Button></Link>
            </>
          )}
          {status === 'error' && (
            <>
              <div className="mx-auto w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center">
                <XCircle className="h-8 w-8 text-destructive" />
              </div>
              <h2 className="text-xl font-bold">Verification Failed</h2>
              <p className="text-muted-foreground text-sm">{message}</p>
              <Link to="/register"><Button variant="outline" className="mt-4">Back to Register</Button></Link>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
