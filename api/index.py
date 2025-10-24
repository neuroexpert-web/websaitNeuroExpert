# Vercel API Route - Python FastAPI backend
import os
import sys
from pathlib import Path

# Add current directory to Python path for imports
current_dir = Path(__file__).parent.parent
sys.path.insert(0, str(current_dir))

# Set working directory to backend for relative imports
os.chdir(str(current_dir / 'backend'))

# Now import from backend
from server import app

# Export FastAPI app for Vercel
app = app
