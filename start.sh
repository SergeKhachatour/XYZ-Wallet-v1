#!/bin/bash

echo "Starting XYZ Stellar Wallet..."
echo

echo "Installing dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "Failed to install root dependencies"
    exit 1
fi

echo
echo "Installing server dependencies..."
cd server
npm install
if [ $? -ne 0 ]; then
    echo "Failed to install server dependencies"
    exit 1
fi

echo
echo "Installing client dependencies..."
cd ../client
npm install
if [ $? -ne 0 ]; then
    echo "Failed to install client dependencies"
    exit 1
fi

echo
echo "Setting up environment files..."
cd ../server
if [ ! -f .env ]; then
    cp env.example .env
    echo "Created server .env file"
fi

cd ../client
if [ ! -f .env ]; then
    cp env.example .env
    echo "Created client .env file"
fi

echo
echo "Setup complete! Starting the application..."
cd ..
npm run dev
