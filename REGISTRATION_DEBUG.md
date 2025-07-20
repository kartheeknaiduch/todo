# 🚨 Registration Failed - Troubleshooting Guide

## Common Reasons for Registration Failure

### 1. **Environment Variables Missing**
**Symptoms**: Internal server error, 500 status code
**Solution**: Verify these are set in Netlify Dashboard → Site Settings → Environment Variables:
```
MONGODB_URI=mongodb+srv://tgfire05:Fire%400507@todo.f9czfzp.mongodb.net/ToDoList?retryWrites=true&w=majority&appName=ToDo
JWT_SECRET=FireReddy
EMAIL_USER=tgfire05@gmail.com
EMAIL_PASS=vzvanglazskygouy
```

### 2. **MongoDB Connection Issues**
**Symptoms**: "Database connection error", timeout errors
**Solutions**:
- Check MongoDB Atlas cluster is running (not paused)
- Verify Network Access allows all IPs (0.0.0.0/0)
- Check connection string format and credentials
- Ensure database name "ToDoList" exists

### 3. **Invalid Email Format**
**Symptoms**: "Please enter a valid email address"
**Solution**: Use a proper email format (e.g., user@domain.com)

### 4. **Password Too Short**
**Symptoms**: "Password must be at least 6 characters long"
**Solution**: Use password with 6+ characters

### 5. **User Already Exists**
**Symptoms**: "User already exists with this email"
**Solutions**:
- Try a different email address
- Or delete the existing user from MongoDB Atlas dashboard

### 6. **Network/CORS Issues**
**Symptoms**: CORS errors, network timeouts
**Solutions**:
- Clear browser cache
- Try incognito/private browsing mode
- Check browser developer console for network errors

### 7. **Function Deployment Issues**
**Symptoms**: 404 errors, "Function not found"
**Solutions**:
- Redeploy site in Netlify dashboard
- Check Netlify build logs for errors
- Verify `netlify.toml` configuration

## Step-by-Step Debugging

### Step 1: Test API Health
Visit: `https://your-app.netlify.app/debug.html`
- Click "Test Health Check"
- Should show "OK" status and environment variables

### Step 2: Check Netlify Function Logs
1. Go to Netlify Dashboard
2. Navigate to Site Overview → Functions
3. Click on "api" function
4. Check Function logs for error details

### Step 3: Test Registration with Debug Tool
1. Use the debug page: `https://your-app.netlify.app/debug.html`
2. Generate a random user or enter custom credentials
3. Click "Test Registration"
4. Check detailed response including status codes and error messages

### Step 4: MongoDB Atlas Verification
1. Login to MongoDB Atlas
2. Check cluster status (should be green/running)
3. Verify Network Access: Database Access → Network Access
4. Ensure "Allow access from anywhere" (0.0.0.0/0)

### Step 5: Manual Testing
Use browser dev tools or curl:

```bash
curl -X POST https://your-app.netlify.app/api/health
```

```bash
curl -X POST https://your-app.netlify.app/api/users/register \
  -H "Content-Type: application/json" \
  -d '{"email":"newuser@test.com","password":"password123"}'
```

## Error Code Reference

| Status Code | Likely Cause | Solution |
|-------------|--------------|----------|
| 400 | Invalid input data | Check email format, password length |
| 409/11000 | User already exists | Use different email |
| 500 | Server/database error | Check environment variables, MongoDB connection |
| 502/504 | Function timeout | Check function logs, redeploy |

## Quick Fixes

### Fix 1: Redeploy Site
```bash
# If using Netlify CLI
netlify deploy --prod

# Or trigger redeploy in dashboard
```

### Fix 2: Clear Environment Variables and Re-add
1. Delete all environment variables in Netlify
2. Re-add them one by one
3. Redeploy site

### Fix 3: Test with Different Email
Try registering with a completely new email like:
- `test123@gmail.com`
- `user$(date +%s)@example.com`

### Fix 4: Check MongoDB Atlas
1. Login to MongoDB Atlas
2. Ensure cluster is not paused
3. Check recent connection attempts in monitoring

## Advanced Debugging

### View Detailed Logs
The updated function includes comprehensive logging. Check Netlify function logs for:
- Database connection status
- Validation errors
- MongoDB operation details
- Detailed error messages

### Test Locally
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Clone and setup project
netlify dev

# Test locally at http://localhost:8888
```

## Still Not Working?

1. **Check browser console** for JavaScript errors
2. **Try different browser** or incognito mode
3. **Contact support** with:
   - Netlify site URL
   - Specific error message
   - Function logs from Netlify dashboard
   - Browser developer console errors

## Emergency Workaround

If registration continues to fail, you can manually create a user in MongoDB Atlas:

1. Go to MongoDB Atlas Dashboard
2. Browse Collections → ToDoList → users
3. Insert document:
```json
{
  "email": "your@email.com",
  "password": "$2b$12$HASH_GENERATED_PASSWORD",
  "notificationPreferences": {
    "enabled": true,
    "reminderTime": 12,
    "customMessage": ""
  },
  "createdAt": "2025-07-20T00:00:00.000Z",
  "updatedAt": "2025-07-20T00:00:00.000Z"
}
```

(You'll need to hash the password using bcrypt)
