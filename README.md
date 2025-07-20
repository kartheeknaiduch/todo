"# Todo Project

A full-stack Todo application built with React (frontend) and Node.js/Express (backend) deployed entirely on Netlify using Netlify Functions.

## 🚀 Quick Deployment

1. **Fork this repository**
2. **Deploy to Netlify**:
   - Go to [netlify.com](https://netlify.com)
   - Click "New site from Git"
   - Connect your GitHub repository
   - Build settings are auto-configured via `netlify.toml`

3. **Set Environment Variables** in Netlify Dashboard → Site Settings → Environment Variables:
   ```
   MONGODB_URI=mongodb+srv://tgfire05:Fire%400507@todo.f9czfzp.mongodb.net/ToDoList?retryWrites=true&w=majority&appName=ToDo
   JWT_SECRET=FireReddy
   EMAIL_USER=tgfire05@gmail.com
   EMAIL_PASS=vzvanglazskygouy
   ```

4. **Deploy and Test**: Your app will be available at `https://your-app.netlify.app`

## 🐛 Debugging

If you encounter login issues:

1. **Test API Health**: Visit `https://your-app.netlify.app/debug.html`
2. **Check Function Logs**: Netlify Dashboard → Functions → api → Function log
3. **Verify Environment Variables**: Must be set in Netlify dashboard
4. **See**: `TROUBLESHOOTING.md` for detailed debugging steps

## 📋 Features

- ✅ User authentication (register/login)
- ✅ Create, read, update, delete todos
- ✅ Priority levels (High, Medium, Low)
- ✅ Deadline tracking with countdown timers
- ✅ Email notifications
- ✅ Responsive design with Tailwind CSS
- ✅ Fully serverless deployment on Netlify

## 🛠️ Tech Stack

- **Frontend**: React, Tailwind CSS, Axios
- **Backend**: Node.js, Express (via Netlify Functions)
- **Database**: MongoDB Atlas
- **Deployment**: Netlify (full-stack)

## 🔗 API Endpoints

All available at `https://your-app.netlify.app/api/`:

- `GET /api/health` - Health check
- `POST /api/users/register` - User registration
- `POST /api/users/login` - User login
- `GET /api/todos` - Get user todos (requires auth)
- `POST /api/todos` - Create todo (requires auth)
- `PUT /api/todos/:id` - Update todo (requires auth)
- `DELETE /api/todos/:id` - Delete todo (requires auth)" 
