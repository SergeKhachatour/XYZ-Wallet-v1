# Azure Deployment Setup Guide

## Quick Setup (5 minutes)

### Step 1: Create Azure App Service
1. Go to [Azure Portal](https://portal.azure.com)
2. Click "Create a resource" → "Web App"
3. Choose:
   - **Runtime stack**: Node 18 LTS
   - **Operating System**: Linux
   - **Pricing tier**: Basic B1 (~$13/month)
   - **Region**: Choose closest to your users
   - **App name**: `xyz-wallet-[your-name]` (must be globally unique)

### Step 2: Get Publish Profile
1. In Azure Portal → Your App Service → "Get publish profile"
2. Download the `.PublishSettings` file
3. Open the file and copy the entire content

### Step 3: Add Secrets to GitHub
1. Go to your GitHub repository: https://github.com/SergeKhachatour/XYZ-wallet
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret** and add:

   **Secret Name**: `AZUREAPPSERVICE_APPNAME`
   **Secret Value**: `xyz-wallet-[your-name]` (your app name from Step 1)

   **Secret Name**: `AZUREAPPSERVICE_PUBLISHPROFILE`
   **Secret Value**: [paste the entire content from the .PublishSettings file]

   **Secret Name**: `AZUREAPPSERVICE_CLIENTID`
   **Secret Value**: `B46DA82E36BE4D59830287FC638EF863`

   **Secret Name**: `AZUREAPPSERVICE_TENANTID`
   **Secret Value**: `D217EDFCBC3A4E63B9F6B9251F95BDA4`

   **Secret Name**: `AZUREAPPSERVICE_SUBSCRIPTIONID`
   **Secret Value**: `E81140B41D734C479F29DB056521657D`

### Step 4: Configure Environment Variables
In Azure Portal → Your App Service → Configuration → Application settings, add:

```
NODE_ENV=production
PORT=8080
STELLAR_NETWORK=testnet
STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org
SOROSWAP_API_URL=https://api.soroswap.finance
SOROSWAP_API_KEY=your_soroswap_api_key_here
REACT_APP_STELLAR_NETWORK=testnet
REACT_APP_STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org
REACT_APP_BACKEND_URL=https://xyz-wallet-[your-name].azurewebsites.net
REACT_APP_MAPBOX_TOKEN=pk.eyJ1Ijoic2VyZ2UzNjl4MzMiLCJhIjoiY20zZHkzb2xoMDA0eTJxcHU4MTNoYjNlaCJ9.Xl6OxzF9td1IgTTeUp526w
```

### Step 5: Deploy!
1. Push your code to the `main` or `master` branch
2. GitHub Actions will automatically build and deploy
3. Your app will be available at: `https://xyz-wallet-[your-name].azurewebsites.net`

## That's it! 🎉

Your XYZ-Wallet will automatically deploy every time you push code to GitHub.

## Troubleshooting
- Check deployment logs in GitHub Actions tab
- Check app logs in Azure Portal → Monitoring → Log stream
- Test health endpoint: `https://your-app.azurewebsites.net/health`
