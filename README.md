# Web Page Design Requirements

## 1. Introduction  
This document defines the web‐page design requirements for the Moral Education Platform. It covers each user role and the pages and features they must have access to in the system.

## 2. User Roles  
- Student  
- Parent  
- Teaching Teacher  
- Class Teacher  
- Moral Education Supervisor  
- Principal & Director  
- System Administrator  

## 3. Functional Requirements by Role

### 3.1 System Administrator  
**Pages & Features**  
- **Grade Management**  
  - Create new grade levels  
  - Modify or delete existing grade levels  
- **Class Management**  
  - Create and name classes  
  - Edit or remove classes  
- **User Management**  
  - Add, modify or remove Students, Teachers, Parents, Class Teachers and other user accounts  
  - Promote or demote students between grades  
  - Assign and reassign teacher roles  
- **Bulk Operations**  
  - Import or export user lists  
  - Batch-update user attributes  

### 3.2 Moral Education Supervisor  
**Pages & Features**  
- **Rule Configuration**  
  - Define “Moral Education Rules” schema (six core dimensions)  
  - Add, edit or delete sub-items under each dimension  
- **Reporting & Analytics**  
  - Generate statistical tables (by rule, by class, by period)  
  - Visualize results in charts (bar, pie, trend lines)  
- **Chapter Management**  
  - Organize rules into chapters  
  - Navigate between chapters  
- **Rating & Awards**  
  - Assign star ratings or other merit badges  
  - Export reports for award ceremonies  

### 3.3 Teaching Teacher  
**Pages & Features**  
- **Classroom Evaluation**  
  - Record scores for each student per lesson  
  - Mark positive behaviors (check-marks, badges)  
- **Session Summaries**  
  - View statistics table for each session  
  - Generate quick charts showing class performance  
- **Weekly Overview**  
  - Aggregate data by week  
  - Navigate between chapters or lesson modules  

### 3.4 Class Teacher  
**Pages & Features**  
- **Behavior Tracking**  
  - Log positive and negative incidents (scores, check-marks)  
- **Time-Based Statistics**  
  - Daily summary reports  
  - Weekly and monthly trend views  
  - Semester and full-year analytics  
- **Reports & Recognition**  
  - Produce printable reports for students  
  - Award stars or commendations  
  - Export data to PDF or Excel  

### 3.5 Student  
**Pages & Features**  
- **Self-Reporting**  
  - Submit examples of good behavior for review  
- **Progress Dashboard**  
  - View personal statistics (scores, stars)  
  - Track movement through chapters or modules  
- **Recognition**  
  - See star ratings and awards received  

### 3.6 Parent  
**Pages & Features**  
- **Child’s Behavior Reports**  
  - Submit observations of their child’s good behavior  
  - Request corrections or add comments  
- **Status & History**  
  - Query current scores and past reports  

### 3.7 Principal & Director  
**Pages & Features**  
- **Overview Dashboard**  
  - Retrieve any user’s data (student, class, teacher)  
  - High-level statistics across the school  
- **Analytical Reports**  
  - Generate school-wide charts and tables  
  - Drill down by grade or class  
- **Commendations & Reviews**  
  - Identify top performers for awards  
  - Add official comments or feedback  

## 4. Cross-Cutting Requirements  
- **Navigation & Layout**  
  - Consistent header with role-based menus  
  - Breadcrumbs for chapter and module navigation  
- **Responsive Design**  
  - Support desktop, tablet and mobile browsers  
- **Security & Access Control**  
  - Enforce role-based page permissions  
  - Secure login and session management  
- **Data Export & Printing**  
  - PDF/Excel export on all report pages  
  - Print-friendly layouts  
