from flask import Blueprint, request, jsonify, current_app, url_for, send_from_directory
import os
import pickle
import uuid
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import io
import base64
import datetime
from werkzeug.utils import secure_filename
import threading
from functools import wraps
import time
import json
from datetime import datetime, date
import seaborn as sns
from pathlib import Path
from MultiColumnLabelEncoder import MultiColumnLabelEncoder

# Create blueprint
api_bp = Blueprint('api', __name__, url_prefix='/api')

# Load ML models
model_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'model_rf.pkl')
try:
    with open(model_path, 'rb') as f:
        model = pickle.load(f)
except Exception as e:
    print(f"Error loading model: {e}")
    model = None

# Global storage for batch jobs
batch_jobs = {}

# Helper functions
def validate_date(date_str):
    try:
        input_date = datetime.strptime(date_str, "%Y-%m-%d").date()
        today = date.today()
        if input_date > today:
            return False, "Date cannot be in the future"
        return True, input_date
    except ValueError:
        return False, "Invalid date format. Use YYYY-MM-DD"

def validate_numeric(value, name, min_val=None, max_val=None):
    try:
        value = float(value)
        
        if min_val is not None and value < min_val:
            return False, f"{name} must be at least {min_val}"
            
        if max_val is not None and value > max_val:
            return False, f"{name} cannot exceed {max_val}"
            
        return True, value
    except ValueError:
        return False, f"{name} must be a number"

def validate_input(data):
    errors = []
    validated_data = {}
    
    # Check date
    if "date" in data:
        is_valid, date_result = validate_date(data["date"])
        if not is_valid:
            errors.append(date_result)
        else:
            validated_data["date"] = date_result
    else:
        errors.append("Date is required")
    
    # Check department
    if "department" in data:
        dept = data["department"]
        if dept not in ["Sewing", "Finishing", "Cutting", "QC"]:
            errors.append("Invalid department")
        else:
            validated_data["department"] = dept
    else:
        errors.append("Department is required")
    
    # Check team
    if "team" in data:
        team = data["team"]
        if not team.startswith("Team "):
            errors.append("Invalid team format. Should be 'Team X'")
        else:
            validated_data["team"] = team
    else:
        errors.append("Team is required")
    
    # Check targeted_productivity
    if "targeted_productivity" in data:
        is_valid, value = validate_numeric(data["targeted_productivity"], "Targeted productivity", 0, 150)
        if not is_valid:
            errors.append(value)
        else:
            validated_data["targeted_productivity"] = value
    else:
        errors.append("Targeted productivity is required")
    
    # Check smv_minutes
    if "smv_minutes" in data:
        is_valid, value = validate_numeric(data["smv_minutes"], "SMV minutes", 0)
        if not is_valid:
            errors.append(value)
        else:
            validated_data["smv_minutes"] = value
    else:
        errors.append("SMV minutes is required")
    
    # Check over_time_hours
    if "over_time_hours" in data:
        is_valid, value = validate_numeric(data["over_time_hours"], "Overtime hours", 0, 8)
        if not is_valid:
            errors.append(value)
        else:
            validated_data["over_time_hours"] = value
    else:
        errors.append("Overtime hours is required")
    
    # Check incentive_level
    if "incentive_level" in data:
        level = data["incentive_level"]
        if level not in ["None", "Low", "Standard", "High"]:
            errors.append("Invalid incentive level")
        else:
            validated_data["incentive_level"] = level
    else:
        errors.append("Incentive level is required")
    
    # Check idle_time_minutes
    if "idle_time_minutes" in data:
        is_valid, value = validate_numeric(data["idle_time_minutes"], "Idle time minutes", 0)
        if not is_valid:
            errors.append(value)
        else:
            validated_data["idle_time_minutes"] = value
    else:
        errors.append("Idle time minutes is required")
    
    # Check idle_men_count
    if "idle_men_count" in data:
        is_valid, value = validate_numeric(data["idle_men_count"], "Idle men count", 0)
        if not is_valid:
            errors.append(value)
        else:
            validated_data["idle_men_count"] = int(value)
    else:
        errors.append("Idle men count is required")
    
    # Check style_change_count
    if "style_change_count" in data:
        is_valid, value = validate_numeric(data["style_change_count"], "Style change count", 0)
        if not is_valid:
            errors.append(value)
        else:
            validated_data["style_change_count"] = int(value)
    else:
        errors.append("Style change count is required")
    
    # Check worker_count
    if "worker_count" in data:
        is_valid, value = validate_numeric(data["worker_count"], "Worker count", 1)
        if not is_valid:
            errors.append(value)
        else:
            validated_data["worker_count"] = int(value)
    else:
        errors.append("Worker count is required")
    
    return len(errors) == 0, errors, validated_data

# Visualization functions
def generate_visualizations(data):
    visualizations = {}
    
    # Extract key metrics
    targeted_productivity = data.get("targeted_productivity", 0)
    smv_minutes = data.get("smv_minutes", 0)
    over_time_hours = data.get("over_time_hours", 0)
    idle_time_minutes = data.get("idle_time_minutes", 0)
    
    # Bar chart
    plt.figure(figsize=(10, 6))
    categories = ['Targeted Productivity', 'SMV', 'Over Time', 'Idle Time']
    values = [targeted_productivity, smv_minutes, over_time_hours, idle_time_minutes]
    plt.bar(categories, values, color=['blue', 'green', 'red', 'orange'])
    plt.xlabel('Parameters')
    plt.ylabel('Values')
    plt.title('Employee Productivity Parameters')
    
    # Save as base64
    buf = io.BytesIO()
    plt.savefig(buf, format='png')
    buf.seek(0)
    img_base64 = base64.b64encode(buf.getvalue()).decode('utf-8')
    visualizations['bar_chart_url'] = f"data:image/png;base64,{img_base64}"
    plt.close()
    
    # Scatter plot
    plt.figure(figsize=(10, 6))
    plt.scatter([1, 2, 3, 4], [targeted_productivity, smv_minutes, over_time_hours, idle_time_minutes], 
                s=100, alpha=0.7)
    plt.xticks([1, 2, 3, 4], categories)
    plt.xlabel('Parameters')
    plt.ylabel('Values')
    plt.title('Scatter Plot of Employee Parameters')
    plt.grid(True, linestyle='--', alpha=0.7)
    
    # Save as base64
    buf = io.BytesIO()
    plt.savefig(buf, format='png')
    buf.seek(0)
    img_base64 = base64.b64encode(buf.getvalue()).decode('utf-8')
    visualizations['scatter_plot_url'] = f"data:image/png;base64,{img_base64}"
    plt.close()
    
    # Line plot
    plt.figure(figsize=(10, 6))
    plt.plot([1, 2, 3, 4], [targeted_productivity, smv_minutes, over_time_hours, idle_time_minutes], 
             marker='o', linestyle='-', linewidth=2, markersize=10)
    plt.xticks([1, 2, 3, 4], categories)
    plt.xlabel('Parameters')
    plt.ylabel('Values')
    plt.title('Line Plot of Employee Parameters')
    plt.grid(True, linestyle='--', alpha=0.7)
    
    # Save as base64
    buf = io.BytesIO()
    plt.savefig(buf, format='png')
    buf.seek(0)
    img_base64 = base64.b64encode(buf.getvalue()).decode('utf-8')
    visualizations['line_graph_url'] = f"data:image/png;base64,{img_base64}"
    plt.close()
    
    # Pie chart
    plt.figure(figsize=(10, 6))
    sizes = [targeted_productivity, smv_minutes, over_time_hours, idle_time_minutes]
    plt.pie(sizes, labels=categories, autopct='%1.1f%%', startangle=90, 
            shadow=True, explode=(0.05, 0, 0, 0))
    plt.axis('equal')
    plt.title('Distribution of Employee Parameters')
    
    # Save as base64
    buf = io.BytesIO()
    plt.savefig(buf, format='png')
    buf.seek(0)
    img_base64 = base64.b64encode(buf.getvalue()).decode('utf-8')
    visualizations['pie_chart_url'] = f"data:image/png;base64,{img_base64}"
    plt.close()
    
    return visualizations

def prepare_model_input(data):
    """
    Convert the user input to the format expected by the model
    """
    # Encode categorical features
    quarter = data.get("date").month // 3 + 1 if hasattr(data.get("date"), "month") else 1
    month = data.get("date").month if hasattr(data.get("date"), "month") else datetime.now().month
    
    # Map department to numeric value (use the encoding used during training)
    department_map = {"Sewing": 1, "Finishing": 0}
    department = department_map.get(data.get("department"), 1)  # Default to Sewing if unknown
    
    # Map day of week (1=Monday, 7=Sunday)
    day = data.get("date").weekday() + 1 if hasattr(data.get("date"), "weekday") else 1
    
    # Extract team number
    team = int(data.get("team").split(" ")[1]) if isinstance(data.get("team"), str) and "Team " in data.get("team") else 1
    
    # Map incentive level
    incentive_map = {"None": 0, "Low": 1, "Standard": 2, "High": 3}
    incentive = incentive_map.get(data.get("incentive_level"), 2)  # Default to Standard if unknown
    
    # Prepare the input array for model prediction
    model_input = [
        quarter, 
        department, 
        day, 
        team,
        float(data.get("targeted_productivity")), 
        float(data.get("smv_minutes")), 
        int(data.get("over_time_hours")), 
        incentive,  
        float(data.get("idle_time_minutes")), 
        int(data.get("idle_men_count")), 
        int(data.get("style_change_count")), 
        float(data.get("worker_count")),
        month
    ]
    
    return [model_input]  # Model expects a 2D array

def get_productivity_category(productivity):
    """Return the productivity category based on the model's output"""
    if productivity <= 0.3:
        return "Below Average Productivity"
    elif 0.3 < productivity <= 0.8:
        return "Medium Productivity"
    else:
        return "High Productivity"

def process_batch(batch_id, file_path, app_context):
    """
    Process a batch job in a background thread
    """
    with app_context:
        try:
            # Update job status
            batch_jobs[batch_id]['status'] = 'processing'
            
            # Load the CSV file
            df = pd.read_csv(file_path)
            
            # Prepare DataFrame to store results
            results = pd.DataFrame()
            
            # Process each row
            for _, row in df.iterrows():
                # Prepare input data in the expected format
                data = {
                    'date': row.get('date'),
                    'department': row.get('department'),
                    'team': row.get('team'),
                    'targeted_productivity': row.get('targeted_productivity'),
                    'smv_minutes': row.get('smv_minutes'),
                    'over_time_hours': row.get('over_time_hours'),
                    'incentive_level': row.get('incentive_level'),
                    'idle_time_minutes': row.get('idle_time_minutes'),
                    'idle_men_count': row.get('idle_men_count'),
                    'style_change_count': row.get('style_change_count'),
                    'worker_count': row.get('worker_count')
                }
                
                # Validate input
                is_valid, errors, validated_data = validate_input(data)
                
                if is_valid:
                    # Prepare model input
                    model_input = prepare_model_input(validated_data)
                    
                    # Make prediction
                    productivity = model.predict(model_input)[0]
                    
                    # Add to results
                    row_result = row.copy()
                    row_result['actual_productivity'] = productivity
                    row_result['category'] = get_productivity_category(productivity)
                    results = pd.concat([results, pd.DataFrame([row_result])], ignore_index=True)
                else:
                    # Handle invalid data
                    row_result = row.copy()
                    row_result['actual_productivity'] = None
                    row_result['category'] = 'Invalid input data'
                    row_result['errors'] = '; '.join(errors)
                    results = pd.concat([results, pd.DataFrame([row_result])], ignore_index=True)
            
            # Save results
            results_path = os.path.join(current_app.config['RESULTS_FOLDER'], f"{batch_id}.xlsx")
            results.to_excel(results_path, index=False)
            
            # Get the file's URL path
            results_url = url_for('api.download_batch_result', batch_id=batch_id, _external=True)
            
            # Update job status
            batch_jobs[batch_id]['status'] = 'completed'
            batch_jobs[batch_id]['results_url'] = results_url
            
        except Exception as e:
            # Handle any errors
            batch_jobs[batch_id]['status'] = 'failed'
            batch_jobs[batch_id]['error'] = str(e)
            print(f"Error processing batch {batch_id}: {e}")

# Routes
@api_bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    if model is None:
        return jsonify({"status": "error", "message": "ML model not loaded"}), 500
    return jsonify({"status": "ok", "message": "Service is up and running"}), 200

@api_bp.route('/predict', methods=['POST'])
def predict():
    """Make a single prediction"""
    # Check if model is loaded
    if model is None:
        return jsonify({"error": "ML model not loaded"}), 500
    
    # Get JSON data
    data = request.json
    if not data:
        return jsonify({"error": "No data provided"}), 400
    
    # Validate input
    is_valid, errors, validated_data = validate_input(data)
    if not is_valid:
        return jsonify({"error": "Invalid input data", "details": errors}), 400
    
    # Prepare input for model
    model_input = prepare_model_input(validated_data)
    
    # Make prediction
    try:
        prediction = model.predict(model_input)[0]
        # Get category based on prediction
        category = get_productivity_category(prediction)
        
        # Generate visualizations
        visualizations = generate_visualizations(validated_data)
        
        # Prepare response
        response = {
            "actual_productivity": float(prediction),
            "category": category,
            "visualizations": visualizations
        }
        
        return jsonify(response), 200
    
    except Exception as e:
        return jsonify({"error": f"Prediction error: {str(e)}"}), 500

@api_bp.route('/batch', methods=['POST'])
def create_batch():
    """Upload a batch job"""
    # Check if model is loaded
    if model is None:
        return jsonify({"error": "ML model not loaded"}), 500
    
    # Check if file is provided
    if 'file' not in request.files:
        return jsonify({"error": "No file provided"}), 400
    
    file = request.files['file']
    
    # Check if file has a name
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400
    
    # Check file extension
    if not file.filename.endswith('.csv'):
        return jsonify({"error": "Only CSV files are allowed"}), 400
    
    try:
        # Generate a unique ID for this batch job
        batch_id = str(uuid.uuid4())
        
        # Save the file
        filename = secure_filename(f"{batch_id}_{file.filename}")
        file_path = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
        file.save(file_path)
        
        # Initialize job status
        batch_jobs[batch_id] = {
            "status": "queued",
            "file_path": file_path,
            "created_at": datetime.now().isoformat()
        }
        
        # Start processing in a background thread
        thread = threading.Thread(
            target=process_batch,
            args=(batch_id, file_path, current_app.app_context())
        )
        thread.start()
        
        # Return job ID
        return jsonify({
            "batch_id": batch_id,
            "status": "processing"
        }), 202
    
    except Exception as e:
        return jsonify({"error": f"Batch creation error: {str(e)}"}), 500

@api_bp.route('/batch/<batch_id>', methods=['GET'])
def get_batch_status(batch_id):
    """Get status of a batch job"""
    if batch_id not in batch_jobs:
        return jsonify({"error": "Batch job not found"}), 404
    
    job = batch_jobs[batch_id]
    
    response = {
        "batch_id": batch_id,
        "status": job["status"]
    }
    
    # Add results URL if job is completed
    if job["status"] == "completed" and "results_url" in job:
        response["results_url"] = job["results_url"]
    
    # Add error if job failed
    if job["status"] == "failed" and "error" in job:
        response["error"] = job["error"]
    
    return jsonify(response), 200

@api_bp.route('/batch/<batch_id>/download', methods=['GET'])
def download_batch_result(batch_id):
    """Download batch results"""
    if batch_id not in batch_jobs:
        return jsonify({"error": "Batch job not found"}), 404
    
    job = batch_jobs[batch_id]
    
    if job["status"] != "completed":
        return jsonify({"error": "Batch job not completed"}), 400
    
    results_path = os.path.join(current_app.config['RESULTS_FOLDER'], f"{batch_id}.xlsx")
    
    if not os.path.exists(results_path):
        return jsonify({"error": "Results file not found"}), 404
    
    return send_from_directory(
        current_app.config['RESULTS_FOLDER'],
        f"{batch_id}.xlsx",
        as_attachment=True,
        download_name=f"employee_performance_batch_{batch_id}.xlsx"
    )

@api_bp.route('/meta/departments', methods=['GET'])
def list_departments():
    """Get list of valid departments"""
    return jsonify(["Sewing", "Finishing", "Cutting", "QC"])

@api_bp.route('/meta/teams', methods=['GET'])
def list_teams():
    """Get list of valid teams"""
    return jsonify(["Team 1", "Team 2", "Team 3", "Team 4", "Team 5"])