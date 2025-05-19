// API client functions for interacting with the Employee Performance Prediction API

// Base API URL
const API_BASE_URL = "http://localhost:8000"

// Fetch departments from the API
export async function fetchDepartments(): Promise<string[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/meta/departments`)

    if (!response.ok) {
      throw new Error(`Failed to fetch departments: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Error fetching departments:", error)
    // Return some default departments in case the API is not available
    return ["Sewing", "Finishing", "Cutting", "QC"]
  }
}

// Fetch teams from the API
export async function fetchTeams(): Promise<string[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/meta/teams`)

    if (!response.ok) {
      throw new Error(`Failed to fetch teams: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Error fetching teams:", error)
    // Return some default teams in case the API is not available
    return ["Team 1", "Team 2", "Team 3"]
  }
}

// Submit prediction data to the API
export async function submitPrediction(data: any) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/predict`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error(`Prediction failed: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Error submitting prediction:", error)

    // Return mock data for development/preview
    return {
      actual_productivity: 0.68,
      category: "Medium Productive",
      visualizations: {
        bar_chart_url: "/placeholder.svg?height=400&width=600",
        scatter_plot_url: "/placeholder.svg?height=400&width=600",
        line_graph_url: "/placeholder.svg?height=400&width=600",
        pie_chart_url: "/placeholder.svg?height=400&width=600",
      },
    }
  }
}

// Submit a batch prediction file
export async function submitBatchPrediction(file: File) {
  try {
    const formData = new FormData()
    formData.append("file", file)

    const response = await fetch(`${API_BASE_URL}/api/batch`, {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      throw new Error(`Batch submission failed: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Error submitting batch:", error)

    // Return mock data for development/preview
    return {
      batch_id: "mock-batch-id-" + Math.random().toString(36).substring(2, 10),
      status: "processing",
    }
  }
}

// Check the status of a batch prediction
export async function checkBatchStatus(batchId: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/batch/${batchId}`)

    if (!response.ok) {
      throw new Error(`Failed to check batch status: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Error checking batch status:", error)

    // Return mock data for development/preview
    // Simulate different statuses based on time
    const mockStatus = Date.now() % 15000 < 10000 ? "processing" : "completed"

    return {
      batch_id: batchId,
      status: mockStatus,
      results_url: mockStatus === "completed" ? "/mock-results.xlsx" : null,
    }
  }
}

// Check API health
export async function checkApiHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`)
    return response.ok
  } catch (error) {
    console.error("API health check failed:", error)
    return false
  }
}
