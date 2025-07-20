# 🚨 Troubleshooting Internal Server Error

## Quick Debugging Steps

### 1. Check Netlify Function Logs
1. Go to your Netlify dashboard
2. Navigate to **Site Overview > Functions**
3. Click on your **api** function
4. Check the **Function log** for errors

### 2. Verify Environment Variables
In your Netlify dashboard, go to **Site Settings > Environment Variables** and ensure these are set:

```
MONGODB_URI=mongodb+srv://tgfire05:Fire%400507@todo.f9czfzp.mongodb.net/ToDoList?retryWrites=true&w=majority&appName=ToDo
JWT_SECRET=FireReddy
EMAIL_USER=tgfire05@gmail.com
EMAIL_PASS=vzvanglazskygouy
```

### 3. Test API Endpoints
After deployment, visit: `https://your-app.netlify.app/debug.html`

This will test:
- Health check endpoint
- User registration
- User login

### 4. Common Issues & Solutions

#### Issue: "Module not found" errors
**Solution**: The Netlify function now includes all dependencies inline to avoid import issues.

#### Issue: MongoDB connection timeout
**Solution**: 
1. Check if your MongoDB Atlas cluster is active
2. Verify the connection string is correct
3. Ensure your MongoDB Atlas network access allows all IPs (0.0.0.0/0)

#### Issue: CORS errors
**Solution**: The function includes comprehensive CORS headers.

#### Issue: Environment variables not loaded
**Solution**: 
1. Double-check environment variables in Netlify dashboard
2. Redeploy the site after adding variables
3. Variable names must match exactly (case-sensitive)

### 5. Local Testing

To test the function locally:

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Link your site
netlify link

# Start local development
netlify dev
```

### 6. Debug Information

The updated function includes detailed logging:
- MongoDB connection status
- Environment variable checks
- Request details
- Error details

### 7. Manual API Testing

Use these curl commands to test your API:

**Health Check:**
```bash
curl https://your-app.netlify.app/api/health
```

**Register:**
```bash
curl -X POST https://your-app.netlify.app/api/users/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass123"}'
```

**Login:**
```bash
curl -X POST https://your-app.netlify.app/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass123"}'
```

### 8. Deployment Checklist

- [ ] Environment variables set in Netlify
- [ ] MongoDB Atlas cluster is active
- [ ] Network access allows all IPs in MongoDB Atlas
- [ ] Function deployed successfully
- [ ] No build errors in Netlify deploy log
- [ ] Function logs show successful startup

### 9. If Still Not Working

1. **Redeploy**: Trigger a new deployment in Netlify
2. **Clear cache**: Clear browser cache and try again
3. **Check build logs**: Review the Netlify build logs for any errors
4. **Simplify**: Try the debug page first before using the full app

### 10. Emergency Fallback

If the Netlify Functions approach continues to have issues, we can quickly switch back to a traditional deployment setup with separate frontend/backend hosting.
