import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const isMock = import.meta.env.VITE_USE_MOCK_API === 'true';
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login({ email, password });
      toast({
        title: "Welcome back!",
        description: "You have successfully signed in.",
      });
      navigate('/');
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Login failed",
        description: "Please check your credentials and try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemoCredentials = (role: 'admin' | 'accounting' | 'cs') => {
    const credentials = {
      admin: { email: 'admin@company.com', password: 'admin123' },
      accounting: { email: 'sarah@company.com', password: 'accounting123' },
      cs: { email: 'mike@company.com', password: 'cs123' },
    };
    setEmail(credentials[role].email);
    setPassword(credentials[role].password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md space-y-4">
        {/* Real Mode Proof Banner */}
        <div className={`p-4 rounded-lg border flex items-start gap-3 ${!isMock ? 'bg-green-50 border-green-200 text-green-800' : 'bg-yellow-50 border-yellow-200 text-yellow-800'}`}>
          {!isMock ? <CheckCircle className="h-5 w-5 mt-0.5" /> : <AlertTriangle className="h-5 w-5 mt-0.5" />}
          <div className="text-sm">
            <p className="font-bold">{!isMock ? 'REAL MODE ACTIVE' : 'MOCK MODE ACTIVE'}</p>
            <div className="font-mono text-xs mt-1 space-y-1">
              <p>VITE_USE_MOCK_API: <span className="font-bold">{String(isMock)}</span></p>
              <p>VITE_API_BASE_URL: <span className="font-bold">{apiBaseUrl}</span></p>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Sign in</CardTitle>
            <CardDescription>
              Enter your email and password to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </Button>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Demo Credentials
                  </span>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2">
                <Button variant="outline" size="xs" onClick={() => fillDemoCredentials('admin')}>
                  Admin
                </Button>
                <Button variant="outline" size="xs" onClick={() => fillDemoCredentials('accounting')}>
                  Accounting
                </Button>
                <Button variant="outline" size="xs" onClick={() => fillDemoCredentials('cs')}>
                  CS Agent
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
