import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export function AuthSkeleton() {
  return (
    <div className="container flex items-center justify-center min-h-screen px-4 py-12">
      <Card className="w-full max-w-[400px] shadow-md">
        <CardHeader className="space-y-2">
          <Skeleton className="h-8 w-40 mx-auto" />
          <Skeleton className="h-4 w-60 mx-auto" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2 mb-6">
            <div className="flex space-x-2">
              <Skeleton className="h-10 w-full rounded-md" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="flex items-center space-x-2">
              <Skeleton className="h-4 w-4 rounded-sm" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-11 w-full" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 