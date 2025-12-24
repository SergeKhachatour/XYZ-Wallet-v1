# Security Fix: Remove Hardcoded Secrets from GitHub Workflow

## 🚨 Issue
GitHub detected high-entropy secrets (API keys and tokens) hardcoded in `.github/workflows/azure-deploy.yml`.

## ✅ Fixed
The workflow file has been updated to use GitHub Secrets instead of hardcoded values.

**Secrets that were exposed:**
1. **Mapbox Token**: `pk.eyJ1Ijoic2VyZ2UzNjl4MzMiLCJhIjoiY20zZHkzb2xoMDA0eTJxcHU4MTNoYjNlaCJ9.Xl6OxzF9td1IgTTeUp526w`
2. **GeoLink Wallet Provider Key**: `ca56b11b4d40523995c101c06a929087e7e55f2811b8e698ddf5a0a7c8177d29`
3. **GeoLink Data Consumer Key**: `8d6aaf5ce265afed4debbf97252ac4a5beb0853c63573d555617865a413af050`

## 🔧 Required Actions

### 1. Add GitHub Secrets
Go to your repository settings: `Settings` → `Secrets and variables` → `Actions` → `New repository secret`

Add these secrets:
- **`REACT_APP_MAPBOX_TOKEN`**: Your Mapbox access token
- **`REACT_APP_GEOLINK_WALLET_PROVIDER_KEY`**: Your GeoLink Wallet Provider API key
- **`REACT_APP_GEOLINK_DATA_CONSUMER_KEY`**: Your GeoLink Data Consumer API key

### 2. Rotate Exposed Keys (Recommended)
Since these keys were exposed in git history, it's recommended to rotate them:

**Mapbox Token:**
1. Go to https://account.mapbox.com/access-tokens/
2. Revoke the exposed token
3. Create a new token
4. Update in GitHub Secrets and Azure configuration

**GeoLink API Keys:**
1. Contact GeoLink support to rotate the exposed keys
2. Update in GitHub Secrets and Azure configuration

### 3. Remove Secrets from Git History (Optional but Recommended)
The secrets are still in your git history. To remove them:

**Using git-filter-repo (Recommended):**
```bash
# Install git-filter-repo if not already installed
pip install git-filter-repo

# Remove secrets from history
git filter-repo --path .github/workflows/azure-deploy.yml --invert-paths

# Force push (WARNING: This rewrites history)
git push origin --force --all
```

**Or use BFG Repo-Cleaner:**
```bash
# Download BFG from https://rtyley.github.io/bfg-repo-cleaner/
# Create a file with secrets to remove: secrets.txt
echo "pk.eyJ1Ijoic2VyZ2UzNjl4MzMiLCJhIjoiY20zZHkzb2xoMDA0eTJxcHU4MTNoYjNlaCJ9.Xl6OxzF9td1IgTTeUp526w" > secrets.txt
echo "ca56b11b4d40523995c101c06a929087e7e55f2811b8e698ddf5a0a7c8177d29" >> secrets.txt
echo "8d6aaf5ce265afed4debbf97252ac4a5beb0853c63573d555617865a413af050" >> secrets.txt

# Run BFG
java -jar bfg.jar --replace-text secrets.txt

# Clean up
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Force push
git push origin --force --all
```

## 📝 Prevention
1. **Never hardcode secrets** in workflow files or code
2. **Always use GitHub Secrets** for sensitive values
3. **Use environment variables** in local development
4. **Regular security audits** - Use tools like GitGuardian or git-secrets
5. **Review commits** before pushing to ensure no secrets are included

## ⚠️ Important Notes
- **Force pushing rewrites history** - Coordinate with team members
- **Backup your repository** before rewriting history
- **Update all deployments** with new keys after rotation
- **Monitor for unauthorized access** to exposed services

