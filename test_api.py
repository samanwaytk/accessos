import requests

url = "http://localhost:8000/api/analyze"
files = {'image': ('test.jpg', b'dummy_image_data', 'image/jpeg')}
data = {'user_query': 'What is this?'}

try:
    response = requests.post(url, files=files, data=data)
    print(response.status_code)
    print(response.json())
except Exception as e:
    print(f"Failed: {e}")
