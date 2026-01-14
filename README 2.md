# MyoMetrics Frontend

A Next.js 15 frontend application for the MyoMetrics medical image analysis platform.

## Features

### Authentication & User Management
- **AuthPage**: Combined login/registration with JWT authentication
- **ForgotPasswordPage**: Password reset functionality  
- **UserAccountPage**: Profile management and account settings

### Core Functionality
- **DashboardPage**: Main landing page with activity overview and statistics
- **UploadPage**: Secure file upload interface with drag-and-drop support
- **UploadDetailsPage**: Detailed view of analysis results and upload metadata
- **UploadHistoryPage**: Complete audit trail of all uploads with filtering

### Administrative Features
- **AnalyticsPage**: Comprehensive dashboard for admin users with system insights

## Tech Stack

- **Next.js 15** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Custom CSS variables** for theming (light/dark mode support)

## Architecture

### API Services (`/lib/api/`)
- `auth.ts`: Authentication service for Django backend
- `microservice.ts`: Integration with Python microservice for image analysis
- `django.ts`: Additional Django backend services
- `index.ts`: Unified API exports and error handling

### Context (`/lib/context/`)
- `AuthContext.tsx`: Global authentication state management

### Components (`/components/`)
- `Navigation.tsx`: Main navigation component
- `ProtectedRoute.tsx`: Route protection wrapper

### Pages (`/app/`)
All pages follow Next.js 15 App Router structure with proper error handling and loading states.

## Security Features

- **HIPAA Compliance**: Secure data handling and audit trails
- **JWT Authentication**: Token-based authentication with refresh
- **Protected Routes**: Role-based access control
- **Secure File Upload**: File validation and secure transmission
- **Audit Logging**: Complete activity tracking

## Color Scheme

The application uses a professional medical color palette:

```css
/* Light Theme */
--text: #030707;
--background: #f7fcfd;
--primary: #2ec1d1;      /* Teal blue */
--secondary: #FFDE5F;    /* Warm yellow */
--accent: #53c4a6;       /* Mint green */

/* Dark Theme */
--text: #f8fffe;
--background: #020405;
/* Primary colors remain consistent */
```

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   Copy `.env.local` and configure:
   ```bash
   NEXT_PUBLIC_API_URL=http://localhost:8000/api
   NEXT_PUBLIC_MICROSERVICE_URL=http://localhost:8001
   ```

3. **Run development server:**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   npm run start
   ```

## Backend Integration

### Django Backend
- User authentication and management
- Audit logging and compliance tracking
- User activity analytics
- Notification settings

### Python Microservice
- Medical image upload and processing
- AI-powered analysis and diagnosis
- Upload status tracking
- Statistics and metrics

## User Roles

- **Clinician**: Standard user with upload and analysis access
- **Admin**: Full platform access including analytics dashboard

## Development Notes

- All API calls include proper error handling and loading states
- Components are fully typed with TypeScript
- Responsive design works on desktop, tablet, and mobile
- Dark/light theme support with CSS custom properties
- WCAG accessibility guidelines followed

## File Upload Guidelines

- **Supported formats**: JPEG, PNG
- **Maximum file size**: 10MB
- **Security**: All uploads are validated and processed securely
- **Progress tracking**: Real-time upload progress with status updates

## Deployment

The application is configured for easy deployment to Vercel, Netlify, or any Node.js hosting platform. Ensure environment variables are properly configured in your deployment environment.
