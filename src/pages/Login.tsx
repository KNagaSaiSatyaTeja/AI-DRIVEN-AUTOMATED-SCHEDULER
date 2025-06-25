
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "@/components/ui/use-toast";
import { Bot } from "lucide-react";
import { authAPI } from "@/services/api";
import { RegisterForm } from "@/components/RegisterForm";
import { useState } from "react";

const formSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
});

const LoginPage = () => {
  const { setRole, setToken } = useApp();
  const navigate = useNavigate();
  const [isRegistering, setIsRegistering] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const response = await authAPI.login(values.email, values.password);
      const { role, token } = response;
      setRole(role);
      setToken(token);
      toast({
        title: "Login Successful",
        description: `Welcome back, ${role === "admin" ? "Admin" : "User"}!`,
      });
      navigate("/");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Invalid Credentials",
        description: error.response?.data?.message || "Please check your email and password.",
      });
    }
  }

  const handleRegisterSuccess = () => {
    setIsRegistering(false);
    toast({
      title: "Registration Complete",
      description: "You can now login with your credentials.",
    });
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <div className="flex justify-center items-center mb-4">
            <Bot className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-2xl">
            AI-Driven Automated Scheduler
          </CardTitle>
          <CardDescription>
            {isRegistering 
              ? "Create a new account to get started." 
              : "Enter your credentials to access your dashboard."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isRegistering ? (
            <>
              <RegisterForm onSuccess={handleRegisterSuccess} />
              <div className="mt-4 text-center">
                <Button 
                  variant="link" 
                  onClick={() => setIsRegistering(false)}
                  className="text-sm"
                >
                  Already have an account? Login here
                </Button>
              </div>
            </>
          ) : (
            <>
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
                          <Input
                            type="password"
                            placeholder="password"
                            {...field}
                          />
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
              <div className="mt-4 text-center">
                <Button 
                  variant="link" 
                  onClick={() => setIsRegistering(true)}
                  className="text-sm"
                >
                  Don't have an account? Register here
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;
