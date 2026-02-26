# Setup Guide - Tutoring Platform

This guide will help you set up and run the Tutoring Platform project on your local machine.

## Prerequisites

Before you begin, make sure you have the following installed:

- **Node.js** (version 18 or higher) - [Download](https://nodejs.org/)
- **PostgreSQL** (version 12 or higher) - [Download](https://www.postgresql.org/download/)
- **npm** or **pnpm** (comes with Node.js, or install pnpm separately)
- **Git** (optional, for cloning the repository)

## Step 1: Clone/Download the Project

If you received this project via Git:
```bash
git clone <repository-url>
cd tutoring-platform
```

If you received it as a zip file, extract it and navigate to the project directory:
```bash
cd tutoring-platform
```

## Step 2: Install Dependencies

Install all project dependencies using npm or pnpm:

```bash
# Using npm
npm install

# OR using pnpm (if you have it installed)
pnpm install
```

This will install all required packages listed in `package.json`.

## Step 3: Set Up PostgreSQL Database

1. **Create a PostgreSQL database:**
   ```bash
   # Login to PostgreSQL (you may need to enter your PostgreSQL password)
   psql -U postgres
   
   # Create a new database
   CREATE DATABASE tutoring_platform;
   
   # Exit PostgreSQL
   \q
   ```

   **Note:** If you're on macOS and installed PostgreSQL via Homebrew, you might need to use:
   ```bash
   psql postgres
   ```

2. **Alternative:** You can also use a cloud PostgreSQL service like:
   - [Supabase](https://supabase.com/) (free tier available)
   - [Railway](https://railway.app/) (free tier available)
   - [Neon](https://neon.tech/) (free tier available)
   - [ElephantSQL](https://www.elephantsql.com/) (free tier available)

## Step 4: Configure Environment Variables

Create a `.env` file in the root directory of the project:

```bash
touch .env
```

Open the `.env` file and add the following environment variables:

```env
# Database Configuration (REQUIRED)
DATABASE_URL="postgresql://username:password@localhost:5432/tutoring_platform?schema=public"

# Replace with your actual PostgreSQL credentials:
# - username: your PostgreSQL username (default: postgres)
# - password: your PostgreSQL password
# - localhost: your database host (use your cloud provider's URL if using cloud PostgreSQL)
# - 5432: PostgreSQL port (default is 5432)
# - tutoring_platform: the database name you created

# Example for local PostgreSQL:
# DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/tutoring_platform?schema=public"

# Example for cloud PostgreSQL (Supabase/Railway/etc):
# DATABASE_URL="postgresql://user:password@host.region.provider.com:5432/tutoring_platform?schema=public"

# AI Chat Configuration (REQUIRED for AI features)
GROQ_API_KEY="your_groq_api_key_here"

# Get your Groq API key from: https://console.groq.com/
# Sign up for a free account and generate an API key
# The AI chat widget will not work without this key

# Optional: Specify Groq model (defaults to llama-3.3-70b-versatile if not set)
GROQ_MODEL="llama-3.3-70b-versatile"

# Optional: Server Configuration
PORT=3000

# Optional: Notification Reminders Secret Key (for scheduled reminders)
REMINDER_SECRET_KEY="your-secret-key-here"

# Optional: Node Environment
NODE_ENV="development"
```

### Getting Your Groq API Key

1. Visit [Groq Console](https://console.groq.com/)
2. Sign up for a free account (if you don't have one)
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key and paste it in your `.env` file as `GROQ_API_KEY`

**Important:** Never commit your `.env` file to version control! It's already in `.gitignore`.

## Step 5: Run Database Migrations

After setting up your database and environment variables, run Prisma migrations to create the database schema:

```bash
# Generate Prisma Client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# This will:
# - Create all database tables based on the schema
# - Set up relationships between tables
# - Create indexes for better performance
```

## Step 6: Seed the Database (Optional but Recommended)

Seed the database with sample data to test the application:

```bash
npm run seed
```

This will create:
- Sample users (both students and tutors)
- Sample tutor profiles with subjects and ratings
- All users can login with password: `password123`

**Sample User Emails (all use password: `password123`):**
- `michael.chen@university.edu`
- `emily.rodriguez@university.edu`
- `david.kim@university.edu`
- `sarah.johnson@university.edu`

## Step 7: Start the Development Server

Start the Next.js development server:

```bash
npm run dev
```

The application will start at `http://localhost:3000` (or the port you specified in `.env`).

You should see output like:
```
> Ready on http://localhost:3000
```

## Step 8: Access the Application

Open your web browser and navigate to:
```
http://localhost:3000
```

You should see the tutoring platform homepage!

## Troubleshooting

### Database Connection Issues

**Problem:** "Can't reach database server" or connection errors

**Solutions:**
1. Verify PostgreSQL is running:
   ```bash
   # macOS
   brew services list
   
   # Linux
   sudo systemctl status postgresql
   
   # Windows
   # Check Services panel
   ```

2. Double-check your `DATABASE_URL` in `.env`:
   - Verify username and password are correct
   - Ensure database name exists
   - Check host and port are correct

3. Test database connection:
   ```bash
   psql $DATABASE_URL
   ```

### Prisma Client Issues

**Problem:** "Prisma Client has not been initialized" or model errors

**Solution:**
```bash
npx prisma generate
```

### Port Already in Use

**Problem:** "Port 3000 is already in use"

**Solutions:**
1. Use a different port in `.env`:
   ```env
   PORT=3001
   ```

2. Or kill the process using port 3000:
   ```bash
   # macOS/Linux
   lsof -ti:3000 | xargs kill -9
   ```

### AI Chat Not Working

**Problem:** AI chat widget shows errors or doesn't respond

**Solutions:**
1. Verify `GROQ_API_KEY` is set in `.env`
2. Check that the API key is valid at [Groq Console](https://console.groq.com/)
3. Restart the development server after adding the key:
   ```bash
   # Stop the server (Ctrl+C) and restart
   npm run dev
   ```

### Module Not Found Errors

**Problem:** "Cannot find module" errors

**Solution:**
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## Project Structure

- `/app` - Next.js app directory with pages and API routes
- `/components` - React components and UI elements
- `/lib` - Utility functions and database client
- `/prisma` - Database schema and migrations
- `/public` - Static assets (images, etc.)
- `/hooks` - Custom React hooks

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run seed` - Seed database with sample data
- `npx prisma studio` - Open Prisma Studio to view/edit database (optional)

## Production Deployment

For production deployment:

1. Set `NODE_ENV=production` in your production environment
2. Use a production-ready PostgreSQL database
3. Build the application:
   ```bash
   npm run build
   ```
4. Start the production server:
   ```bash
   npm run start
   ```

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Groq API Documentation](https://console.groq.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

## Need Help?

If you encounter any issues:
1. Check the Troubleshooting section above
2. Verify all environment variables are set correctly
3. Ensure all dependencies are installed
4. Check that PostgreSQL is running and accessible
5. Review the console/terminal for error messages

---

**Happy Coding! 🚀**
