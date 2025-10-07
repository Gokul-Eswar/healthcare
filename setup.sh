#!/bin/bash

# --- Project Setup Script ---

echo "Starting the setup process for the MyCare Health dashboard..."

# 1. Check for .env file and create from example if it doesn't exist
if [ -f ".env" ]; then
    echo ".env file already exists. Skipping creation."
else
    echo ".env file not found. Creating one from .env.example..."
    cp .env.example .env
    echo "Successfully created .env file."
fi

# 2. Install Node.js dependencies
echo "Installing Node.js dependencies with npm..."
npm install

# 3. Final instructions
echo ""
echo "--------------------------------------------------------"
echo "Setup complete!"
echo "--------------------------------------------------------"
echo ""
echo "Next steps:"
echo "1. Open the .env file and fill in your API keys:"
echo "   - GEMINI_API_KEY"
echo "   - GOOGLE_CLIENT_ID"
echo "   - GOOGLE_CLIENT_SECRET"
echo ""
echo "2. Once the .env file is configured, start the server with:"
echo "   npm start"
echo ""
echo "The application will be running at http://localhost:3000"
echo ""