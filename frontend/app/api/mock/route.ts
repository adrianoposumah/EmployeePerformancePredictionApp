import { NextResponse } from "next/server"

// Mock API routes for development and testing

// GET /api/meta/departments
export async function GET(request: Request) {
  const url = new URL(request.url)
  const path = url.pathname

  // Mock departments endpoint
  if (path.endsWith("/api/meta/departments")) {
    return NextResponse.json(["Sewing", "Finishing", "Cutting", "QC"])
  }

  // Mock teams endpoint
  if (path.endsWith("/api/meta/teams")) {
    return NextResponse.json(["Team 1", "Team 2", "Team 3"])
  }

  // Mock health check endpoint
  if (path.endsWith("/health")) {
    return new NextResponse(null, { status: 200 })
  }

  // Mock batch status endpoint
  if (path.includes("/api/batch/")) {
    const batchId = path.split("/").pop()

    // Simulate different statuses based on the batch ID
    const mockStatus = batchId?.includes("completed")
      ? "completed"
      : batchId?.includes("failed")
        ? "failed"
        : "processing"

    return NextResponse.json({
      batch_id: batchId,
      status: mockStatus,
      results_url: mockStatus === "completed" ? "/mock-results.xlsx" : null,
    })
  }

  // Default response for unknown endpoints
  return new NextResponse(null, { status: 404 })
}

// POST /api/predict
export async function POST(request: Request) {
  const url = new URL(request.url)
  const path = url.pathname

  // Mock prediction endpoint
  if (path.endsWith("/api/predict")) {
    try {
      const data = await request.json()

      // Generate a mock productivity value based on input data
      const productivity = calculateMockProductivity(data)
      const category = getProductivityCategory(productivity)

      return NextResponse.json({
        actual_productivity: productivity,
        category: category,
        visualizations: {
          bar_chart_url: "/placeholder.svg?height=400&width=600",
          scatter_plot_url: "/placeholder.svg?height=400&width=600",
          line_graph_url: "/placeholder.svg?height=400&width=600",
          pie_chart_url: "/placeholder.svg?height=400&width=600",
        },
      })
    } catch (error) {
      return new NextResponse(JSON.stringify({ error: "Invalid request data" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }
  }

  // Mock batch endpoint
  if (path.endsWith("/api/batch")) {
    return NextResponse.json({
      batch_id: "mock-batch-id-" + Math.random().toString(36).substring(2, 10),
      status: "processing",
    })
  }

  // Default response for unknown endpoints
  return new NextResponse(null, { status: 404 })
}

// Helper function to calculate mock productivity based on input data
function calculateMockProductivity(data: any): number {
  // This is a simplified mock calculation
  // In a real system, this would be the ML model prediction

  // Base productivity as a percentage of targeted productivity
  let productivity = (data.targeted_productivity / 100) * 0.8

  // Adjust based on other factors
  if (data.over_time_hours > 2) productivity *= 0.9 // Overtime reduces efficiency
  if (data.idle_time_minutes > 60) productivity *= 0.85 // High idle time reduces productivity
  if (data.style_change_count > 3) productivity *= 0.9 // Many style changes reduce productivity
  if (data.incentive_level === "High") productivity *= 1.15 // High incentives increase productivity

  // Add some randomness
  productivity *= 0.9 + Math.random() * 0.2

  // Ensure productivity is between 0 and 1
  return Math.min(Math.max(productivity, 0), 1)
}

// Helper function to get productivity category
function getProductivityCategory(productivity: number): string {
  if (productivity < 0.3) return "Low Productive"
  if (productivity < 0.6) return "Medium Productive"
  if (productivity < 0.8) return "Productive"
  return "Highly Productive"
}
