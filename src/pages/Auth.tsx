
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Bot, Github, Mail } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';

const AuthPage = () => {
  const { signInWithProvider, signInWithEmail, signUp } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSocialLogin = async (provider: 'google' | 'github' | 'twitter') => {
    setIsLoading(true);
    try {
      await signInWithProvider(provider);
      // Redirect is handled automatically by Supabase
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: error.message || 'An error occurred during login.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const { error } = await signInWithEmail(email, password);
      if (error) {
        toast({
          variant: 'destructive',
          title: 'Login Failed',
          description: error.message,
        });
      } else {
        toast({
          title: 'Login Successful',
          description: 'Welcome back!',
        });
        navigate('/');
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: error.message || 'An error occurred during login.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const { error } = await signUp(email, password);
      if (error) {
        toast({
          variant: 'destructive',
          title: 'Sign Up Failed',
          description: error.message,
        });
      } else {
        toast({
          title: 'Sign Up Successful',
          description: 'Please check your email to confirm your account.',
        });
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Sign Up Failed',
        description: error.message || 'An error occurred during sign up.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <div className="flex justify-center items-center mb-4">
            <Bot className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-2xl">AI-Driven Automated Scheduler</CardTitle>
          <CardDescription>Sign in to access your dashboard</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin" className="space-y-4">
              <div className="space-y-3">
                <Button
                  onClick={() => handleSocialLogin('google')}
                  disabled={isLoading}
                  className="w-full"
                  variant="outline"
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Continue with Google
                </Button>
                <Button
                  onClick={() => handleSocialLogin('github')}
                  disabled={isLoading}
                  className="w-full"
                  variant="outline"
                >
                  <Github className="mr-2 h-4 w-4" />
                  Continue with GitHub
                </Button>
                <Button
                  onClick={() => handleSocialLogin('twitter')}
                  disabled={isLoading}
                  className="w-full"
                  variant="outline"
                >
                  Continue with Twitter
                </Button>
              </div>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">or</span>
                </div>
              </div>
              
              <form onSubmit={handleEmailLogin} className="space-y-3">
                <div>
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="signin-password">Password</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" disabled={isLoading} className="w-full">
                  Sign In
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup" className="space-y-4">
              <div className="space-y-3">
                <Button
                  onClick={() => handleSocialLogin('google')}
                  disabled={isLoading}
                  className="w-full"
                  variant="outline"
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Continue with Google
                </Button>
                <Button
                  onClick={() => handleSocialLogin('github')}
                  disabled={isLoading}
                  className="w-full"
                  variant="outline"
                >
                  <Github className="mr-2 h-4 w-4" />
                  Continue with GitHub
                </Button>
                <Button
                  onClick={() => handleSocialLogin('twitter')}
                  disabled={isLoading}
                  className="w-full"
                  variant="outline"
                >
                  Continue with Twitter
                </Button>
              </div>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">or</span>
                </div>
              </div>
              
              <form onSubmit={handleEmailSignUp} className="space-y-3">
                <div>
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                <Button type="submit" disabled={isLoading} className="w-full">
                  Sign Up
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthPage;
