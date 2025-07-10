@@ .. @@
 # Beam Calculator

 A professional structural analysis tool for calculating shear force diagrams, bending moment diagrams, and beam deflections.

+## Features

+- **Authentication**: User accounts with Supabase authentication
+- **Project Management**: Save, load, and manage beam analysis projects
+- **Real-time Analysis**: Interactive beam configuration with live calculations
+- **Multiple Support Types**: Fixed, hinge, roller, and internal hinge supports
+- **Load Types**: Point loads (including inclined), distributed loads, and applied moments
+- **Comprehensive Analysis**: SFD, BMD, deflection, and stress analysis
+- **Export Functionality**: PDF export of analysis results
+- **Unit Systems**: Support for both SI (Metric) and FPS (Imperial) units
+- **Dark Mode**: Modern dark/light theme switching
+- **Responsive Design**: Works on desktop and mobile devices
+
 ## Getting Started

 ### Prerequisites
@@ .. @@
 - Node.js (v14 or higher)
 - npm or yarn

+### Supabase Setup
+
+1. Create a new project at [Supabase](https://supabase.com)
+2. Go to Settings > API to get your project URL and anon key
+3. Update `src/lib/supabase.js` with your credentials:
+   ```javascript
+   const supabaseUrl = 'YOUR_SUPABASE_URL'
+   const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY'
+   ```
+4. Run the migration in your Supabase SQL editor:
+   - Copy the contents of `supabase/migrations/create_projects_table.sql`
+   - Paste and run it in the SQL editor
+
 ### Installation

 1. Clone the repository
@@ .. @@
 npm run build
 ```

+## Authentication Features
+
+- **Sign Up/Sign In**: Email and password authentication
+- **Password Reset**: Forgot password functionality
+- **User Profiles**: Store user information and preferences
+- **Project Management**: Save and organize beam analysis projects
+
+## Project Management
+
+- **Save Projects**: Store beam configurations with custom names and descriptions
+- **Load Projects**: Quick access to previously saved analyses
+- **Project History**: Track creation and modification dates
+- **Delete Projects**: Remove unwanted projects
+
 ## Usage

 1. **Configure Beam**: Set beam length, supports, loads, and material properties
@@ .. @@
 3. **View Results**: Analyze SFD, BMD, deflection diagrams and stress analysis
 4. **Export**: Generate PDF reports of your analysis

+## Database Schema
+
+The application uses Supabase with the following main table:
+
+- **projects**: Stores user beam analysis projects
+  - `id`: Unique project identifier
+  - `user_id`: Reference to authenticated user
+  - `name`: Project name
+  - `description`: Optional project description
+  - `beam_data`: JSON object containing beam configuration
+  - `created_at`: Project creation timestamp
+  - `updated_at`: Last modification timestamp
+
 ## Technologies Used

 - React 18
@@ .. @@
 - Chart.js for data visualization
 - jsPDF for PDF export
 - html2canvas for chart capture
+- Supabase for authentication and database
+- Row Level Security (RLS) for data protection

 ## Contributing