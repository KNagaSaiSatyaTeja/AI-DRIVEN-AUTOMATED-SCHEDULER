
import { useState } from "react";
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
import axios from "axios";

const formSchema = z.object({
  name: z.string().min(1, { message: "Name is required." }).optional(),
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
});

const LoginPage = () => {
  const { setRole, setToken } = useApp();
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  const API_BASE_URL = import.meta.env.VITE_APP_API_BASE_URL || 'http://localhost:5000/api';

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    console.log("Submitting form with values:", values);
    console.log("API Base URL:", API_BASE_URL);
    
    try {
      if (isRegister) {
        console.log("Attempting registration...");
        // Register user
        const registerResponse = await axios.post(
          `${API_BASE_URL}/auth/register`,
          {
            name: values.name,
            email: values.email,
            password: values.password,
          },
          {
            headers: {
              'Content-Type': 'application/json',
            },
            timeout: 10000,
          }
        );
        
        console.log("Registration successful:", registerResponse.data);
        
        toast({
          title: "Registration Successful",
          description: "Please login with your credentials.",
        });
        
        setIsRegister(false);
        form.reset();
      } else {
        console.log("Attempting login...");
        // Login user
        const loginResponse = await axios.post(
          `${API_BASE_URL}/auth/login`,
          {
            email: values.email,
            password: values.password,
          },
          {
            headers: {
              'Content-Type': 'application/json',
            },
            timeout: 10000,
          }
        );
        
        console.log("Login response:", loginResponse.data);
        
        const { role, token } = loginResponse.data;
        
        if (!token) {
          throw new Error("No token received from server");
        }
        
        // Store token and role
        localStorage.setItem('token', token);
        localStorage.setItem('role', role);
        
        setRole(role);
        setToken(token);
        
        console.log("Login successful, role:", role, "token:", token.substring(0, 20) + "...");
        
        toast({
          title: "Login Successful",
          description: `Welcome back, ${role === "admin" ? "Admin" : "User"}!`,
        });
        
        navigate("/");
      }
    } catch (error) {
      console.error("Authentication error:", error);
      
      let errorMessage = "An unexpected error occurred";
      
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
          errorMessage = "Cannot connect to server. Please check if the backend is running.";
        } else if (error.response) {
          errorMessage = error.response.data?.message || `Server error: ${error.response.status}`;
          console.log("Server response:", error.response.data);
        } else if (error.request) {
          errorMessage = "No response from server. Please try again.";
        }
      }
      
      toast({
        variant: "destructive",
        title: isRegister ? "Registration Failed" : "Login Failed",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  }

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
            {isRegister 
              ? "Create a new account to get started."
              : "Enter your credentials to access your dashboard."
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {isRegister && (
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
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
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Please wait..." : (isRegister ? "Register" : "Login")}
              </Button>
            </form>
          </Form>
          
          <div className="mt-4 text-center">
            <Button
              variant="link"
              onClick={() => {
                setIsRegister(!isRegister);
                form.reset();
              }}
              className="text-sm"
              disabled={isLoading}
            >
              {isRegister 
                ? "Already have an account? Login" 
                : "Don't have an account? Register"
              }
            </Button>
          </div>
          
          {!isRegister && (
            <div className="mt-4 text-center text-sm text-muted-foreground">
              <p className="font-semibold">Demo Credentials:</p>
              <p>Admin: admin@admin.com / admin@123</p>
            </div>
          )}
          
          <div className="mt-4 text-center text-xs text-muted-foreground">
            <p>Backend URL: {API_BASE_URL}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;
