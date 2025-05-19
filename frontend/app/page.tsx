import { Suspense } from "react"
import PerformancePredictionForm from "@/components/performance-prediction-form"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import BatchPredictionForm from "@/components/batch-prediction-form"

export default function Home() {
  return (
    <main className="container mx-auto py-8 px-4">
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Employee Performance Prediction</h1>
          <p className="text-muted-foreground">
            Input production data to predict employee performance and productivity metrics.
          </p>
        </div>

        <Tabs defaultValue="single" className="space-y-4">
          <TabsList>
            <TabsTrigger value="single">Single Prediction</TabsTrigger>
            <TabsTrigger value="batch">Batch Prediction</TabsTrigger>
          </TabsList>
          <TabsContent value="single" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Performance Prediction</CardTitle>
                <CardDescription>
                  Fill in the form below to predict employee performance based on production data.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Suspense
                  fallback={
                    <div className="flex justify-center p-8">
                      <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                  }
                >
                  <PerformancePredictionForm />
                </Suspense>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="batch" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Batch Prediction</CardTitle>
                <CardDescription>Upload a CSV file with multiple records for batch prediction.</CardDescription>
              </CardHeader>
              <CardContent>
                <BatchPredictionForm />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}
