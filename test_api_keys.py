#!/usr/bin/env python3
"""
API Key Tester for TerraTruce
Tests all API keys to ensure they're working correctly
"""

import os
import requests
import json
from datetime import datetime

# Color codes for terminal output
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
RESET = '\033[0m'

def print_header(text):
    print(f"\n{BLUE}{'='*60}{RESET}")
    print(f"{BLUE}{text:^60}{RESET}")
    print(f"{BLUE}{'='*60}{RESET}\n")

def print_success(text):
    print(f"{GREEN}✅ {text}{RESET}")

def print_error(text):
    print(f"{RED}❌ {text}{RESET}")

def print_info(text):
    print(f"{YELLOW}ℹ️  {text}{RESET}")

# API Keys (replace with your actual keys)
OPENAI_API_KEY = "your_openai_api_key"
PERPLEXITY_API_KEY = "your_perplexity_api_key"
GEMINI_API_KEY = "your_gemini_api_key"
GOOGLE_MAPS_API_KEY = "your_google_maps_api_key"
OPENCAGE_API_KEY = "your_opencage_api_key"
SUPABASE_URL = "https://your-project.supabase.co"
SUPABASE_KEY = "your_supabase_anon_key"

def test_openai():
    """Test OpenAI API"""
    print_header("Testing OpenAI API")
    
    try:
        headers = {
            "Authorization": f"Bearer {OPENAI_API_KEY}",
            "Content-Type": "application/json"
        }
        
        data = {
            "model": "gpt-3.5-turbo",
            "messages": [{"role": "user", "content": "Say 'API test successful'"}],
            "max_tokens": 10
        }
        
        response = requests.post(
            "https://api.openai.com/v1/chat/completions",
            headers=headers,
            json=data,
            timeout=10
        )
        
        if response.status_code == 200:
            result = response.json()
            message = result['choices'][0]['message']['content']
            print_success(f"OpenAI API is working!")
            print_info(f"Response: {message}")
            return True
        else:
            print_error(f"OpenAI API failed: {response.status_code}")
            print_info(f"Error: {response.text}")
            return False
            
    except Exception as e:
        print_error(f"OpenAI API error: {str(e)}")
        return False

def test_perplexity():
    """Test Perplexity API"""
    print_header("Testing Perplexity API")
    
    try:
        headers = {
            "Authorization": f"Bearer {PERPLEXITY_API_KEY}",
            "Content-Type": "application/json"
        }
        
        data = {
            "model": "llama-3.1-sonar-small-128k-online",
            "messages": [{"role": "user", "content": "What is 2+2?"}]
        }
        
        response = requests.post(
            "https://api.perplexity.ai/chat/completions",
            headers=headers,
            json=data,
            timeout=15
        )
        
        if response.status_code == 200:
            result = response.json()
            message = result['choices'][0]['message']['content']
            print_success("Perplexity API is working!")
            print_info(f"Response: {message[:100]}...")
            return True
        else:
            print_error(f"Perplexity API failed: {response.status_code}")
            print_info(f"Error: {response.text}")
            return False
            
    except Exception as e:
        print_error(f"Perplexity API error: {str(e)}")
        return False

def test_gemini():
    """Test Gemini API"""
    print_header("Testing Gemini API")
    
    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key={GEMINI_API_KEY}"
        
        data = {
            "contents": [{
                "parts": [{"text": "Say 'API test successful'"}]
            }]
        }
        
        response = requests.post(url, json=data, timeout=10)
        
        if response.status_code == 200:
            result = response.json()
            text = result['candidates'][0]['content']['parts'][0]['text']
            print_success("Gemini API is working!")
            print_info(f"Response: {text}")
            return True
        else:
            print_error(f"Gemini API failed: {response.status_code}")
            print_info(f"Error: {response.text}")
            return False
            
    except Exception as e:
        print_error(f"Gemini API error: {str(e)}")
        return False

def test_google_maps():
    """Test Google Maps Geocoding API"""
    print_header("Testing Google Maps API")
    
    try:
        url = f"https://maps.googleapis.com/maps/api/geocode/json?address=San+Francisco&key={GOOGLE_MAPS_API_KEY}"
        
        response = requests.get(url, timeout=10)
        
        if response.status_code == 200:
            result = response.json()
            if result['status'] == 'OK':
                location = result['results'][0]['geometry']['location']
                print_success("Google Maps API is working!")
                print_info(f"San Francisco coordinates: {location}")
                return True
            else:
                print_error(f"Google Maps API error: {result['status']}")
                return False
        else:
            print_error(f"Google Maps API failed: {response.status_code}")
            return False
            
    except Exception as e:
        print_error(f"Google Maps API error: {str(e)}")
        return False

def test_opencage():
    """Test OpenCage Geocoding API"""
    print_header("Testing OpenCage API")
    
    try:
        url = f"https://api.opencagedata.com/geocode/v1/json?q=San+Francisco&key={OPENCAGE_API_KEY}"
        
        response = requests.get(url, timeout=10)
        
        if response.status_code == 200:
            result = response.json()
            if result['results']:
                location = result['results'][0]['geometry']
                print_success("OpenCage API is working!")
                print_info(f"San Francisco coordinates: {location}")
                return True
            else:
                print_error("OpenCage API: No results")
                return False
        else:
            print_error(f"OpenCage API failed: {response.status_code}")
            return False
            
    except Exception as e:
        print_error(f"OpenCage API error: {str(e)}")
        return False

def test_supabase():
    """Test Supabase Connection"""
    print_header("Testing Supabase Connection")
    
    try:
        headers = {
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}"
        }
        
        # Test REST API
        response = requests.get(
            f"{SUPABASE_URL}/rest/v1/",
            headers=headers,
            timeout=10
        )
        
        if response.status_code in [200, 404]:  # 404 is ok, means connection works
            print_success("Supabase connection is working!")
            print_info(f"URL: {SUPABASE_URL}")
            
            # Try to list tables
            response = requests.get(
                f"{SUPABASE_URL}/rest/v1/",
                headers=headers
            )
            print_info(f"Status: {response.status_code}")
            return True
        else:
            print_error(f"Supabase connection failed: {response.status_code}")
            return False
            
    except Exception as e:
        print_error(f"Supabase connection error: {str(e)}")
        return False

def main():
    print_header("🧪 TerraTruce API Key Tester")
    print(f"Testing all API keys at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
    
    results = {
        "OpenAI": test_openai(),
        "Perplexity": test_perplexity(),
        "Gemini": test_gemini(),
        "Google Maps": test_google_maps(),
        "OpenCage": test_opencage(),
        "Supabase": test_supabase()
    }
    
    # Summary
    print_header("📊 Test Summary")
    
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    for service, status in results.items():
        if status:
            print_success(f"{service}: PASSED")
        else:
            print_error(f"{service}: FAILED")
    
    print(f"\n{BLUE}Total: {passed}/{total} tests passed{RESET}")
    
    if passed == total:
        print(f"\n{GREEN}🎉 All API keys are working correctly!{RESET}\n")
    else:
        print(f"\n{YELLOW}⚠️  Some API keys need attention{RESET}\n")

if __name__ == "__main__":
    main()
