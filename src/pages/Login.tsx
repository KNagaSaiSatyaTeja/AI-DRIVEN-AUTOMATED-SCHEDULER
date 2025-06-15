
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from '@/components/ui/use-toast';
import { Bot } from 'lucide-react';

const formSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
});

const LoginPage = () => {
  const { setRole } = useApp();
  const navigate = useNavigate();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    // Demo credentials
    const adminCreds = { email: 'admin@example.com', password: 'password' };
    const userCreds = { email: 'user@example.com', password: 'password' };

    if (values.email === adminCreds.email && values.password === adminCreds.password) {
      setRole('admin');
      toast({ title: 'Login Successful', description: 'Welcome back, Admin!' });
      navigate('/');
    } else if (values.email === userCreds.email && values.password === userCreds.password) {
      setRole('user');
      toast({ title: 'Login Successful', description: 'Welcome back, User!' });
      navigate('/');
    } else {
      toast({
        variant: 'destructive',
        title: 'Invalid Credentials',
        description: 'Please check your email and password.',
      });
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <div className="flex justify-center items-center mb-4">
            <Bot className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-2xl">AI-Driven Automated Scheduler</CardTitle>
          <CardDescription>Enter your credentials to access your dashboard.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="admin@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full">
                Login
              </Button>
            </form>
          </Form>
          <div className="mt-4 text-center text-sm text-muted-foreground">
            <p className="font-semibold">Demo Credentials:</p>
            <p>Admin: admin@example.com / password</p>
            <p>User: user@example.com / password</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;
