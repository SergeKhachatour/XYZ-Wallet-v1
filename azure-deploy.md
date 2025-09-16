# Azure Deployment Guide for XYZ Stellar Wallet

## Option 1: Azure App Service (Recommended)

### Prerequisites
- Azure account with active subscription
- Azure CLI installed locally
- Git repository with your code

### Step 1: Create Azure App Service

1. **Via Azure Portal:**
   - Go to [Azure Portal](https://portal.azure.com)
   - Click "Create a resource" → "Web App"
   - Choose:
     - **Runtime stack**: Node 18 LTS
     - **Operating System**: Linux
     - **Pricing tier**: Basic B1 (starts at ~$13/month)
     - **Region**: Choose closest to your users

2. **Via Azure CLI:**
   ```bash
   # Login to Azure
   az login
   
   # Create resource group
   az group create --name xyz-wallet-rg --location "East US"
   
   # Create App Service plan
   az appservice plan create --name xyz-wallet-plan --resource-group xyz-wallet-rg --sku B1 --is-linux
   
   # Create web app
   az webapp create --resource-group xyz-wallet-rg --plan xyz-wallet-plan --name xyz-wallet-app --runtime "NODE|18-lts"
   ```

### Step 2: Configure Environment Variables

In Azure Portal → Your App Service → Configuration → Application settings:

**Required Environment Variables:**
```
NODE_ENV=production
PORT=8080
STELLAR_NETWORK=testnet
STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org
SOROSWAP_API_URL=https://api.soroswap.finance
SOROSWAP_API_KEY=your_soroswap_api_key_here
REACT_APP_STELLAR_NETWORK=testnet
REACT_APP_STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org
REACT_APP_BACKEND_URL=https://your-app-name.azurewebsites.net
REACT_APP_MAPBOX_TOKEN=your_mapbox_token_here
```

### Step 3: Deploy Your Code

**Option A: GitHub Actions (Recommended)**
1. Create `.github/workflows/azure-deploy.yml`:
   ```yaml
   name: Deploy to Azure App Service
   
   on:
     push:
       branches: [ main ]
   
   jobs:
     build-and-deploy:
       runs-on: ubuntu-latest
       steps:
       - uses: actions/checkout@v2
       
       - name: Setup Node.js
         uses: actions/setup-node@v2
         with:
           node-version: '18'
           
       - name: Install dependencies
         run: |
           npm install
           cd server && npm install
           cd ../client && npm install
           
       - name: Build React app
         run: |
           cd client
           npm run build
           
       - name: Deploy to Azure
         uses: azure/webapps-deploy@v2
         with:
           app-name: 'xyz-wallet-app'
           publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE }}
           package: .
   ```

**Option B: Azure CLI**
```bash
# Deploy from local directory
az webapp deployment source config-zip --resource-group xyz-wallet-rg --name xyz-wallet-app --src deployment.zip
```

**Option C: Git Deployment**
```bash
# Add Azure remote
git remote add azure https://xyz-wallet-app.scm.azurewebsites.net:443/xyz-wallet-app.git

# Deploy
git push azure main
```

### Step 4: Configure Custom Domain (Optional)

1. In Azure Portal → Your App Service → Custom domains
2. Add your domain
3. Configure DNS records as instructed
4. Enable SSL certificate

## Option 2: Azure Container Instances (Alternative)

If you prefer containerized deployment:

### Create Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY server/package*.json ./server/
COPY client/package*.json ./client/

# Install dependencies
RUN npm install
RUN cd server && npm install
RUN cd client && npm install

# Build React app
RUN cd client && npm run build

# Copy source code
COPY . .

# Expose port
EXPOSE 8080

# Start the application
CMD ["npm", "start"]
```

### Deploy to Container Instances
```bash
# Build and push to Azure Container Registry
az acr build --registry your-registry --image xyz-wallet:latest .

# Deploy to Container Instances
az container create \
  --resource-group xyz-wallet-rg \
  --name xyz-wallet-container \
  --image your-registry.azurecr.io/xyz-wallet:latest \
  --ports 8080 \
  --environment-variables \
    NODE_ENV=production \
    PORT=8080
```

## Option 3: Azure Static Web Apps (Frontend Only)

For a more modern approach, you could deploy the frontend to Azure Static Web Apps and the backend to a separate App Service:

1. **Frontend**: Azure Static Web Apps (free tier available)
2. **Backend**: Azure App Service or Azure Functions

## Cost Estimation

- **Basic B1 App Service**: ~$13/month
- **Standard S1 App Service**: ~$75/month (better performance)
- **Premium P1V2**: ~$166/month (production-ready)

## Security Considerations

1. **Enable HTTPS**: Automatically configured in Azure App Service
2. **Environment Variables**: Store sensitive data in Azure Key Vault
3. **CORS**: Configure properly for your domain
4. **Rate Limiting**: Already implemented in your Express app
5. **Helmet**: Security headers already configured

## Monitoring

1. **Application Insights**: Enable for monitoring and logging
2. **Health Checks**: Your `/health` endpoint is ready
3. **Logs**: Available in Azure Portal → Monitoring → Log stream

## Troubleshooting

1. **Check Logs**: Azure Portal → Monitoring → Log stream
2. **Test Health Endpoint**: `https://your-app.azurewebsites.net/health`
3. **Verify Environment Variables**: Azure Portal → Configuration
4. **Check Build Process**: Ensure React app builds successfully

## Next Steps

1. Set up CI/CD pipeline with GitHub Actions
2. Configure custom domain and SSL
3. Set up monitoring and alerting
4. Implement backup strategies
5. Consider scaling options for production traffic
