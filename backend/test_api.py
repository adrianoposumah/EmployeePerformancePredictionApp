import requests
import json

# API endpoint
base_url = "http://localhost:8000"

def test_health_check():
    """Test the health check endpoint"""
    response = requests.get(f"{base_url}/api/health")
    print("\n1. Health Check Response:")
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")

def test_metadata():
    """Test metadata endpoints"""
    # Get departments
    response = requests.get(f"{base_url}/api/meta/departments")
    print("\n2. Departments Response:")
    print(f"Status Code: {response.status_code}")
    print(f"Departments: {response.json()}")
    
    # Get teams
    response = requests.get(f"{base_url}/api/meta/teams")
    print("\n3. Teams Response:")
    print(f"Status Code: {response.status_code}")
    print(f"Teams: {response.json()}")

def test_prediction():
    """Test single prediction endpoint"""
    # Sample input data
    input_data = {
        "date": "2023-05-15",
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
    
    # Make prediction request
    response = requests.post(
        f"{base_url}/api/predict",
        json=input_data,
        headers={"Content-Type": "application/json"}
    )
    
    print("\n4. Prediction Response:")
    print(f"Status Code: {response.status_code}")
    
    # Print prediction result
    if response.status_code == 200:
        result = response.json()
        print(f"Productivity: {result['actual_productivity']}")
        print(f"Category: {result['category']}")
        print("Visualizations available:")
        for viz_type, url in result['visualizations'].items():
            # Print just the viz type and first 30 chars of URL
            print(f"  - {viz_type}: {url[:30]}...")
    else:
        print(f"Error: {response.json()}")

if __name__ == "__main__":
    print("Running API Tests...")
    
    # Run tests
    test_health_check()
    test_metadata()
    test_prediction()
    
    print("\nTests completed!")
