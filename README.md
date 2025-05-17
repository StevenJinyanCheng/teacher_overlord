# Web Page Design Requirements

## 1. Introduction  
This document defines the web‐page design requirements for the Moral Education Platform. It covers each user role and the pages and features they must have access to in the system.

## 2. User Roles  
- Student  
- Parent  
- Teaching Teacher  
- Class Teacher  
- Note: A user can hold both Teaching Teacher and Class Teacher roles simultaneously.
- Moral Education Supervisor  
- Principal  
- Director  
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
- **Scoring**  
  - Can record and modify behavior scores for students  

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
- **Class Administration**  
  - Add or remove Students within their assigned classes  

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
- **Class Administration**  
  - Add or remove Students from their class roster  
  - Record and modify behavior scores for their students  

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

### 3.7 Principal  
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

### 3.8 Director  
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

## 5. User Relationships

This section defines the relationships between different user roles to guide application logic and permissions.

- **Teacher – Student**  
  - A **Teaching Teacher** or **Class Teacher** is assigned to one or more **Students**.  
  - Teachers can view and manage the behavior records and progress dashboards of their assigned students.

- **Student – Parent**  
  - Each **Student** has one or more **Parents** or guardians.  
  - Parents can view and comment on their child's reports and submit observations.

- **Teacher – Parent**  
  - Both roles are indirectly connected through the **Student**.  
  - Teachers can receive reports or comments submitted by parents regarding their children.  
  - Parents can see the evaluations made by teachers for their children.

These relationships inform the data model and access control:
- Teachers get read/write access to records for their assigned students.  
- Parents get read access to their child's records and write access to comments.  
- Administrators, Principals, and Directors have cross-role visibility based on these links.

## 6. Role Hierarchy & Permissions

This section defines the hierarchical structure of roles and their permissions:

- **System Administrator**  
  - Full access to all functionalities and data.  
  - Can manage grades, classes, users, rules, reports, and system settings.

- **Principal**  
  - Inherits **Teaching Teacher** and **Class Teacher** permissions.  
  - Can add, modify, or remove **Teaching Teachers** and **Class Teachers**.  
  - Cannot configure rules.

- **Director**  
  - Inherits **Teaching Teacher** and **Class Teacher** permissions.  
  - Can add, modify, or remove **Teaching Teachers** and **Class Teachers**.  
  - Cannot configure rules.

- **Moral Education Supervisor**  
  - Can configure rules and chapters.  
  - Can generate and export reports.  
  - Can record and modify behavior scores for students.

- **Teaching Teacher**  
  - Can add or remove **Students** within their assigned classes.  
  - Can record and modify behavior scores for their students.

- **Class Teacher**  
  - Can add or remove **Students** from their class roster.  
  - Can record and modify behavior scores for their students.  
  - Can export data to PDF or Excel.

- **Parent**  
  - Can submit observations and comments on their own child's records.  
  - Read-only access to their child's performance data.

- **Student**  
  - Can view their own progress dashboard and received awards.  

## 7. Class Definitions

Two types of classes exist in the system:

- **Home-Class**  
  - The basic organizational unit.  
  - Every **Student** must be assigned to one Home-Class.  
  - Attributes:  
    - **Grade**: the academic level of the class.  
    - **Class Teachers**: one or more teachers assigned to this home-class.

- **Subject-Class**  
  - Specialized instructional groups (e.g., Art, Science, English Reading).  
  - A **Student** may be assigned to multiple Subject-Classes.  
  - A **Teacher** can be assigned to multiple Subject-Classes but only to one Home-Class.

---

## Appendix: Permissions Summary Table

| Role                        | Manage Users | Score Students | Configure Rules | Export Reports | Administer Classes |
|-----------------------------|--------------|----------------|-----------------|----------------|--------------------|
| System Administrator        | ✔            | ✔              | ✔               | ✔              | ✔                  |
| Principal                   | ✔            | ✔              | ✘               | ✔              | ✔                  |
| Director                    | ✔            | ✔              | ✘               | ✔              | ✔                  |
| Moral Education Supervisor  | ✘            | ✔              | ✔               | ✔              | ✘                  |
| Teaching Teacher            | ✘            | ✔              | ✘               | ✘              | ✔                  |
| Class Teacher               | ✘            | ✔              | ✘               | ✔              | ✔                  |
| Parent                      | ✘            | ✘              | ✘               | ✘              | ✘                  |
| Student                     | ✘            | ✘              | ✘               | ✘              | ✘                  |
