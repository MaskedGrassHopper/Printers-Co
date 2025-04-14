"use client"

import { useState, Suspense } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LoginForm } from "./LoginForm"
import { RegisterForm } from "./RegisterForm"
import { ForgotPassword } from "./ForgotPassword"
import { AuthSkeleton } from "./AuthSkeleton"

export default function AuthPage() {
  const [activeView, setActiveView] = useState<"tabs" | "forgot-password">("tabs")
  const [activeTab, setActiveTab] = useState("login")
  const [isLoading, setIsLoading] = useState(true)

  // Simulate loading state for better UX
  useState(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000)
    return () => clearTimeout(timer)
  })

  const handleForgotPasswordClick = () => {
    setActiveView("forgot-password")
  }

  const handleBackToLogin = () => {
    setActiveView("tabs")
    setActiveTab("login")
  }

  if (isLoading) {
    return <AuthSkeleton />
  }

  return (
    <div className="container flex items-center justify-center min-h-screen px-4 py-12">
      {activeView === "tabs" ? (
        <Card className="w-full max-w-[400px] shadow-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Welcome</CardTitle>
            <CardDescription className="text-center">
              Sign in to your account or create a new one
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>
              <Suspense fallback={<AuthSkeleton />}>
                <TabsContent value="login" className="mt-0">
                  <LoginForm onForgotPasswordClick={handleForgotPasswordClick} />
                </TabsContent>
                <TabsContent value="register" className="mt-0">
                  <RegisterForm />
                </TabsContent>
              </Suspense>
            </Tabs>
          </CardContent>
        </Card>
      ) : (
        <Suspense fallback={<AuthSkeleton />}>
          <ForgotPassword onBackToLogin={handleBackToLogin} />
        </Suspense>
      )}
    </div>
  )
} 