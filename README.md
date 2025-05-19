# Employee Performance Prediction REST API

## Overview

This repository contains a REST API for predicting employee productivity in garment manufacturing using machine learning. The API is built with Flask and provides endpoints for single predictions, batch processing, and metadata access.

## Features

- **Health Check**: Verify API operational status
- **Single Prediction**: Get productivity predictions for individual inputs
- **Batch Processing**: Upload CSV files for bulk predictions
- **Metadata Endpoints**: Access reference data for form dropdowns
- **Visualization**: Automatic generation of visual reports
- **Swagger Documentation**: Interactive API documentation

## API Endpoints

### Health Check

- **GET `/health`**: Check if the service is running

### Predictions

- **POST `/api/predict`**: Make a single productivity prediction
- **POST `/api/batch`**: Upload a CSV file for batch predictions
- **GET `/api/batch/{id}`**: Check status and retrieve batch results

### Metadata

- **GET `/api/meta/departments`**: Get valid department names
- **GET `/api/meta/teams`**: Get valid team names

### Documentation

- **GET `/api/docs`**: Interactive Swagger documentation

## Getting Started

### Prerequisites

- Python 3.9+
- Required packages in requirements.txt

### Installation

### Frontend

1. Install dependencies: `npm install --force`
2. Run the application: `npm run dev`

### Backend

1. Clone this repository
2. Install dependencies: `pip install -r requirements.txt`
3. Run the application: `python main_new.py`

````

## API Request & Response Examples

### Single Prediction

Request:

```json
POST /api/predict
{
  "date": "2025-05-19",
  "department": "Sewing",
  "team": "Team 3",
  "targeted_productivity": 75,
  "smv_minutes": 2.5,
  "over_time_hours": 1,
  "incentive_level": "Standard",
  "idle_time_minutes": 30,
  "idle_men_count": 1,
  "style_change_count": 2,
  "worker_count": 50
}
````

Response:

```json
{
  "actual_productivity": 0.68,
  "category": "Medium Productive",
  "visualizations": {
    "bar_chart_url": "https://.../bar.png",
    "scatter_plot_url": "https://.../scatter.png",
    "line_graph_url": "https://.../line.png",
    "pie_chart_url": "https://.../pie.png"
  }
}
```

## Model Information

The API uses multiple ML models for predictions:

- Linear Regression
- Random Forest
- XGBoost (primary model)

## License

This project is licensed under the MIT License - see the LICENSE file for details.
