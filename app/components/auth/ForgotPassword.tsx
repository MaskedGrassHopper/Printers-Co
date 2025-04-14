"use client"

import { useState } from "react"
import { ArrowLeft, Loader2, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
})

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>

interface ForgotPasswordProps {
  onBackToLogin: () => void
}

export function ForgotPassword({ onBackToLogin }: ForgotPasswordProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  })

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/password-reset/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to send reset link')
      }

      setIsSuccess(true)
    } catch (error) {
      console.error('Password reset request error:', error)
      form.setError('root', {
        type: 'manual',
        message: error instanceof Error ? error.message : 'Failed to send reset link'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-[400px] shadow-md">
      <CardHeader className="space-y-1">
        <Button 
          variant="ghost" 
          size="icon" 
          className="absolute left-2 top-2 h-8 w-8" 
          onClick={onBackToLogin}
          type="button"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="sr-only">Back to login</span>
        </Button>
        <CardTitle className="text-2xl font-bold text-center pt-4">Forgot Password</CardTitle>
        <CardDescription className="text-center">
          Enter your email address and we'll send you a link to reset your password
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isSuccess ? (
          <div className="flex flex-col items-center justify-center space-y-4 py-6">
            <div className="rounded-full bg-green-100 p-3">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-lg font-medium">Check your email</h3>
              <p className="text-sm text-muted-foreground">We've sent a password reset link to your email address</p>
            </div>
            <Button 
              variant="outline" 
              className="mt-4" 
              onClick={onBackToLogin}
              type="button"
            >
              Back to login
            </Button>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="name@example.com" 
                        type="email" 
                        autoComplete="email" 
                        autoFocus
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {form.formState.errors.root && (
                <div className="text-sm text-red-500">
                  {form.formState.errors.root.message}
                </div>
              )}

              <Button type="submit" className="w-full h-11" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send reset link"
                )}
              </Button>
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  )
} 