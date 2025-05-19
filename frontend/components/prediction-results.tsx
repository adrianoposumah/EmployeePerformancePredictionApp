import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import Image from "next/image"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface PredictionResultsProps {
  result: {
    actual_productivity: number
    category: string
    visualizations: {
      bar_chart_url: string
      scatter_plot_url: string
      line_graph_url: string
      pie_chart_url: string
    }
  }
}

export default function PredictionResults({ result }: PredictionResultsProps) {
  // Convert productivity from 0-1 to 0-100 for display
  const productivityPercentage = Math.round(result.actual_productivity * 100)

  // Determine color based on productivity level
  const getProgressColor = (value: number) => {
    if (value < 30) return "bg-red-500"
    if (value < 60) return "bg-yellow-500"
    if (value < 80) return "bg-blue-500"
    return "bg-green-500"
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Prediction Results</CardTitle>
          <CardDescription>The predicted performance metrics based on your input data.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm font-medium">Actual Productivity</span>
              <span className="text-sm font-medium">{productivityPercentage}%</span>
            </div>
            <Progress
              value={productivityPercentage}
              className="h-2"
              indicatorClassName={getProgressColor(productivityPercentage)}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <p className="text-sm font-medium">Performance Category</p>
              <p className="text-sm text-muted-foreground">Based on productivity analysis</p>
            </div>
            <div>
              <span className="text-lg font-bold">{result.category}</span>
            </div>
          </div>

          <Tabs defaultValue="bar" className="w-full">
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="bar">Bar Chart</TabsTrigger>
              <TabsTrigger value="scatter">Scatter Plot</TabsTrigger>
              <TabsTrigger value="line">Line Graph</TabsTrigger>
              <TabsTrigger value="pie">Pie Chart</TabsTrigger>
            </TabsList>
            <TabsContent value="bar" className="mt-4">
              <div className="aspect-video relative rounded-lg overflow-hidden border">
                <Image
                  src={result.visualizations.bar_chart_url || "/placeholder.svg"}
                  alt="Bar Chart Visualization"
                  fill
                  className="object-contain"
                />
              </div>
            </TabsContent>
            <TabsContent value="scatter" className="mt-4">
              <div className="aspect-video relative rounded-lg overflow-hidden border">
                <Image
                  src={result.visualizations.scatter_plot_url || "/placeholder.svg"}
                  alt="Scatter Plot Visualization"
                  fill
                  className="object-contain"
                />
              </div>
            </TabsContent>
            <TabsContent value="line" className="mt-4">
              <div className="aspect-video relative rounded-lg overflow-hidden border">
                <Image
                  src={result.visualizations.line_graph_url || "/placeholder.svg"}
                  alt="Line Graph Visualization"
                  fill
                  className="object-contain"
                />
              </div>
            </TabsContent>
            <TabsContent value="pie" className="mt-4">
              <div className="aspect-video relative rounded-lg overflow-hidden border">
                <Image
                  src={result.visualizations.pie_chart_url || "/placeholder.svg"}
                  alt="Pie Chart Visualization"
                  fill
                  className="object-contain"
                />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
