Based on your Python microservice and the need for a professional, HIPAA-compliant web app built with React and a Django backend, here is a list of the essential pages for clinicians to interact with the platform.
Authentication & User Management
AuthPage: A central component with a dynamic form for clinician login and user registration. It would authenticate against the Django backend, which would manage user roles (clinician, admin, etc.), ensuring only authorized personnel can access sensitive medical data in compliance with HIPAA.
ForgotPasswordPage: A simple form to request a password reset, linking to the Django backend's authentication system. This is a standard security feature crucial for a professional application.
UserAccountPage: A page for clinicians to view and manage their user profile, including updating contact information or changing their password. All changes would be handled by the Django backend.

Core Functionality & Workflow
UploadPage: This is the primary interface for the microservice's /upload endpoint. It would feature a secure file uploader component with clear validation rules.
Frontend Logic: The page would first authenticate the clinician's session with the Django backend.
Microservice Integration: It would use the provided JavaScript uploadFile example to send the file to the Python microservice. It must be configured to pass the X-User-ID header, which is critical for associating the upload with the correct clinician for audit purposes.
DashboardPage: The main landing page for authenticated clinicians. It would provide a high-level overview of their recent activity and key insights.
Microservice Integration: This page would call the microservice's /stats endpoint to display general upload statistics.
Django Integration: It would also pull recent uploads and other user-specific data from the Django backend, which would store the metadata and audit logs.
UploadHistoryPage: This page serves as a complete audit trail for the clinician's activities. It would list all images they have uploaded.
Microservice Integration: It would use the getUserUploads function to call the microservice endpoint and fetch a list of all uploads for the logged-in clinician.
Data Security: The Django backend would be responsible for filtering this data to ensure the clinician can only see their own uploads, a key HIPAA requirement.
UploadDetailsPage: A detailed view for a single uploaded image, accessed by clicking an item on the history page.
Microservice Integration: It would use the getUploadDetails function to display image metadata, upload status, and the AI analysis results (diagnosis and confidence).
Data Protection: This page must implement strict access control, ensuring a clinician can only view the details for uploads they are authorized to see.

Administrative & Analytics
AnalyticsPage: A more comprehensive dashboard for authorized users (e.g., admin or researcher roles managed by Django).
Microservice Integration: It would call the microservice's /stats endpoint and other Django-powered analytics APIs to visualize trends in diagnoses, upload volume, and user activity. This page is crucial for managing the platform.

IMPLEMENT A GLOBAL.CSS STYLE WITH THESE COLORS, also with dark/light theme in mind
PRIMARY COLORS:
--text: #030707;
--background: #f7fcfd;
--primary: #2ec1d1;
--secondary: #FFDE5F;
--accent: #53c4a6;


AUTHENTICATION:
JWT Authentication - local storage.
Email based authentication
