# Security Fix: Exposed Secrets Removal

## 🚨 Issue
GitGuardian detected high-entropy secrets exposed in the GitHub repository.

## ✅ Fixed Files
The following files have been updated to remove exposed secrets:

1. **`client/geolink-env.example`** - Replaced real API keys with placeholders
2. **`AZURE_SETUP.md`** - Removed hardcoded Mapbox token
3. **`client/src/components/MapboxMap.tsx`** - Removed hardcoded fallback token
4. **`client/src/components/UserProfile.tsx`** - Removed hardcoded fallback token
5. **`client/src/contexts/LocationContext.tsx`** - Removed hardcoded fallback API keys
6. **`.gitignore`** - Added files containing secrets to gitignore

## 🔄 Required Actions

### 1. Rotate Exposed Keys

**Mapbox Token:**
- Go to https://account.mapbox.com/access-tokens/
- Revoke the exposed token: `pk.eyJ1Ijoic2VyZ2UzNjl4MzMiLCJhIjoiY20zZHkzb2xoMDA0eTJxcHU4MTNoYjNlaCJ9.Xl6OxzF9td1IgTTeUp526w`
- Create a new token
- Update in your `.env` files and Azure configuration

**GeoLink API Keys:**
- Contact GeoLink support to rotate:
  - Wallet Provider Key: `8390a5a72db59d0c256498dbb543cd652f991928705161386ab28d73ecf0a8fa`
  - Data Consumer Key: `54a0688fa6c54fe04ebe62a2678efa9a9f631e49b0a43b325d77e3081194a740`
  - Production Wallet Provider Key: `ca56b11b4d40523995c101c06a929087e7e55f2811b8e698ddf5a0a7c8177d29`
  - Production Data Consumer Key: `8d6aaf5ce265afed4debbf97252ac4a5beb0853c63573d555617865a413af050`
- Update in your `.env` files and Azure configuration

### 2. Remove Secrets from Git History

The secrets are still in your git history. To remove them:

**Option A: Using git-filter-repo (Recommended)**
```bash
# Install git-filter-repo if not already installed
pip install git-filter-repo

# Remove secrets from history
git filter-repo --path client/geolink-env.example --invert-paths
git filter-repo --path AZURE_SETUP.md --invert-paths
git filter-repo --path client/src/components/MapboxMap.tsx --invert-paths
git filter-repo --path client/src/components/UserProfile.tsx --invert-paths
git filter-repo --path client/src/contexts/LocationContext.tsx --invert-paths

# Force push (WARNING: This rewrites history)
git push origin --force --all
```

**Option B: Using BFG Repo-Cleaner**
```bash
# Download BFG from https://rtyley.github.io/bfg-repo-cleaner/
# Create a file with secrets to remove: secrets.txt
echo "pk.eyJ1Ijoic2VyZ2UzNjl4MzMiLCJhIjoiY20zZHkzb2xoMDA0eTJxcHU4MTNoYjNlaCJ9.Xl6OxzF9td1IgTTeUp526w" > secrets.txt
echo "8390a5a72db59d0c256498dbb543cd652f991928705161386ab28d73ecf0a8fa" >> secrets.txt
echo "54a0688fa6c54fe04ebe62a2678efa9a9f631e49b0a43b325d77e3081194a740" >> secrets.txt
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

**Option C: Manual File History Rewrite (Simpler but less thorough)**
```bash
# Remove sensitive files from history
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch client/geolink-env.example AZURE_SETUP.md" \
  --prune-empty --tag-name-filter cat -- --all

# Force push
git push origin --force --all
```

### 3. Update Environment Variables

After rotating keys, update:
- Local `.env` files (not committed)
- Azure App Service Configuration
- GitHub Secrets (if using CI/CD)

### 4. Verify Fix

1. Check that no secrets are in current files:
   ```bash
   git grep -i "pk.eyJ1Ijoic2VyZ2UzNjl4MzMi"
   git grep -i "8390a5a72db59d0c256498dbb543cd652f991928705161386ab28d73ecf0a8fa"
   ```

2. Verify `.gitignore` includes sensitive files

3. Test the application with new keys

## 📝 Prevention

1. **Never commit `.env` files** - Already in `.gitignore`
2. **Use `.example` files** - Only with placeholder values
3. **Use environment variables** - Never hardcode secrets in code
4. **Use GitHub Secrets** - For CI/CD pipelines
5. **Regular audits** - Use tools like GitGuardian or git-secrets

## ⚠️ Important Notes

- **Force pushing rewrites history** - Coordinate with team members
- **Backup your repository** before rewriting history
- **Update all deployments** with new keys after rotation
- **Monitor for unauthorized access** to exposed services

