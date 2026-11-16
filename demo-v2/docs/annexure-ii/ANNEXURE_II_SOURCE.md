# Annexure-II · Functional Requirement · LMS (source extract)

> **Core source of truth for demo-v2.** Generated from `Annexure-II_Functional Requirement_LMS.xlsx` (copied beside this file) by `scratchpad/annex/gen.py`.
> Wording is exact. Order is the workbook's row order. Where a row has no sub-category in the workbook it is shown as "(no sub-category)".
> The workbook's compliance and remarks columns are blank (they are for the bidder).

**250 requirements, numbered 1–250.**


## Roles


### Employee

- **1.** Raise request to be withdrawn from own training
- **2.** Check personal training calendar
- **3.** Mark attendance against specific training
- **4.** Provide feedback against specific training
- **5.** Check personal training record for a time frame
- **6.** Request to add personal training record in the database
- **7.** Others

### Supervisor

- **8.** Same role as 'Employee'
- **9.** Approve withdrawal request by 'Employee'
- **10.** Add replacement (get notification on nominees' calendar conflict / leave / resignation / retirement during nomination)
- **11.** Check 'Employees' (individual, multiple as well as all) training record for a time frame
- **12.** Download customized reports based on training labels within a time frame

### Division Head / Learning Champion

- **13.** Same role as 'Employee' and 'Supervisor'
- **14.** Submit new training request to ADMIN (HR) through 'Training Request' module
- **15.** Customized dashboard reflecting training summary of the division (department / segment wise within a time frame)

### Trainer

- **16.** Same role as 'Employee' and 'Supervisor'
- **17.** Accept / Reject (with reason) invitation to facilitate
- **18.** Access to exclusive calendar / To do schedule as trainer
- **19.** Upload training materials in LMS and request HR Admin to link the materials to trainings

### HR Admin (ADMIN (HR))

- **20.** *(blank in the workbook)*

### Admin

- **21.** All access and option management

## Setup Options


### Competency

- **22.** Functional, Innovation, Collaboration, Customer Experience, Leadership, Execution Excellence etc. add more

### Training Tags/ Labels

- **23.** City Foundation, Banking Foundation, AML, ICT, CRM, Risk, Islamic Banking, ISS, IGN, FRA, City Future Fit, MT Development, Credit, GB, POSH, Foreign Trade, Anti- Bribery & Corruption, Values, Speak Up, Sustainable Finance, Clearing, BACH, Fraud Risk, ICC, ESRM, SME, Fire Drill etc. and add more)
- **24.** Data entry boxes: tag name, short tag

### Training Category

- **25.** General, Functional, Soft-skill, Mandatory etc. and add more

### Training Medium

- **26.** Classroom, Webinar, e-Learning etc. and add more

### Mode of Training

- **27.** In-house, External-local, External-foreign etc. and add more

### Training Title

- **28.** A search button for the ADMIN (HR) to check for similar training name in the existing database prior to the entry
- **29.** Add 'Training Name' text box. System will check validation with existing training database and allow for a new entry only if there is no duplication
- **30.** Add 'Competency' drop down option (data available in 'Competency' setup)

### Training Venue

- **31.** A search button for the ADMIN (HR) to check for similar training venue in the existing database prior to the entry
- **32.** Data entry text boxes: Venue name, Address, Short name etc.
- **33.** System will check validation of address box with existing venue database and allow for a new entry only if there is no duplication
- **34.** Document (doc, pdf, jpeg, png) uploader to keep record of the related files

### Trainer

- **35.** Add drop-down option: 'Internal' and 'External'
- **36.** Add information boxes; 'Employee ID', 'Name', 'Designation', 'Institute', 'Contact No.', 'Email', 'LinkedIn Profile Link' etc.
    - (If 'Internal' option is selected; trainer information can be pulled from Employee Database with the entry of 'Employee ID')
- **37.** Add Bulk Upload option

### Vendor

- **38.** A search button for the ADMIN (HR) to check for similar training vendor in the existing database prior to the entry
- **39.** Data entry boxes: vendor name, contact person, email address, phone number, TIN information, BIN information etc.
- **40.** System will check validation with existing vendor database and allow for a new entry only if there is no duplication
- **41.** Document (doc, pdf, jpeg, png) uploader to keep record of the related files
- **42.** Email template for communication to share vendor information with others

### Training Calendar

- **43.** Approved training calendar to be uploaded here under specific year by 'Admin'
- **44.** Once planned, training schedules from 'Module 3: Training Scheduling' to be continuously accumulated here

### Feedback Setup

- **45.** Add 'Add New Question' text box
- **46.** Add options like 'MCQ', 'Text box', 'Tick-box' etc. which Admin can choose to design the feedback templates

### External Trainee / Participant

- **47.** Add information boxes; 'Company Name', 'Company Employee ID', 'Name', 'Designation / Role', 'Contact No.' etc.
- **48.** Add Bulk Upload option and bulk upload template

## Training Management System


### Training Request


#### Program Tab Setup

- **49.** Once setup window is opened, system will automatically assign a unique sequential number as ID to the request. However, the number is fixed once the setup is saved.
- **50.** Add 'Training Title' option.
- **51.** Add duration of training – date & time with man-hour per participant (repeat schedule options for single training delivered in multiple days)
- **52.** Add 'Venue' option (text box – suggested venue by the requester).
- **53.** Add 'Training Mode' (data available in 'Training Mode' setup – single choice)
- **54.** Add 'Training Medium' (data available in 'Training Medium' setup – single choice)
- **55.** Add 'Training Tags / Labels' information (data available in 'Training Tags / Labels' setup – multiple choice)
- **56.** Add 'Upload Content' button to attach resource material (non-mandatory field)
- **57.** Add 'Save & Next' option to go to the 'Trainer Tab Setup'

#### Trainer Tab Setup

- **58.** Add 'Trainer Details' option. A search button will be available to search by name or EID
- **59.** Add 'Topic Name' option beside 'Trainer Details'
- **60.** Add 'Session Duration' beside 'Topic Name'
- **61.** Add 'Add More' button to add more than one detail
- **62.** Add 'Previous', 'Save & Next' and 'Skip & Next' options at the bottom of the page

#### Nominations Tab Setup

- **63.** Add 'Select Participant' option. Participant details to be linked from employee database.
    - Individual EID / name entry
    - Bulk Upload option
- **64.** Add 'Save & Exit' button

### Training Request Received (ADMIN (HR) Module)

- **65.** ADMIN (HR) will get a window with summary of all the training requests. Add information like 'Training Name', 'Venue', 'From Date', 'To Date', 'Proposed Pax' etc.
- **66.** Add 'Schedule Training' and 'Forward' button beside each training summary.
    - If 'Forward' button is clicked, pop-up data entry box will be opened. Request can be assigned to specific HR Admin
    - If 'Schedule Training' button is clicked, onward processing will be done in the 'Training Scheduling' module (outlined later)

### Training Nomination Request Setup


#### Program Tab Setup

- **67.** Once setup window is opened, system will automatically assign a unique sequential number as ID to the nomination request. However, the number is fixed once the setup is saved.
- **68.** Add title from 'Training Title' setup. Title can be searched with keywords using a search button
- **69.** Add duration of training – date & time with man-hour per participant (repeat schedule options for single training delivered in multiple days)
- **70.** Add venue from drop-down option (data available in 'Training Venue' setup – single choice)
- **71.** Training venue will be validated with already existing planned calendar (data available in 'Training Calendar' setup). Pop-up message to be displayed if duplication is found in the combination of training venue and date & time
- **72.** Add 'Training Category' (data available in 'Training Category' setup – single choice)
- **73.** Add 'Training Mode' (data available in 'Training Mode' setup – single choice)
- **74.** Add 'Training Medium' (data available in 'Training Medium' setup – single choice)
- **75.** Add 'Training Tags / Labels' information (data available in 'Training Tags / Labels' setup – multiple choice)
- **76.** Add 'PDUs' text box
- **77.** Add organized by from drop-down option (data available in 'Vendor' setup)
- **78.** Add 'Save & Next' option to go to the 'Trainer Tab Setup'

#### Trainer Tab Setup

- **79.** Add 'Trainer Details' option. A search button for the ADMIN (HR) to search by name or EID
- **80.** Add 'Topic Name' option beside 'Trainer Details'
- **81.** Add 'Session Duration' beside 'Topic Name'
- **82.** Add 'Add More' button to add more than one detail
- **83.** Add 'Remove' option beside each trainer for ADMIN (HR) in case the trainer is to be removed
- **84.** Add 'Previous', 'Save & Next' and 'Skip & Next' options at the bottom of the page

#### Nomination Tab Setup

- **85.** Add 'Nomination Deadline' box to select date & time
- **86.** Training is saved and nomination request is sent to the selected division / function heads and learning champions through email
- **87.** Customizable mail template is needed with a redirect link to nominate

### (no sub-category)

- **88.** Nomination Process
    - Division / function heads will click the link and be redirected to own dashboard
    - Nomination window for this training will be opened and they can add participants as per 'Division Head / Learning Champion' role
    - Nomination received within deadline will be accumulated in the participant list in Training scheduling module

### Training Nomination Received

- **89.** ADMIN (HR) can check 'Training Nomination Status' dashboard. A summary list of the nomination request sent will be displayed here
- **90.** Add basic information like 'Training Name', 'Training Date', 'Organized By', 'Nomination Deadline', 'Nominations Received' etc. to be displayed here
- **91.** Add 'Details' option at the right most column. ADMIN (HR) can click on the 'Details' option and check and edit the training summary as well as details of the nominations received

### Training Scheduling


#### Program Tab Setup

- **92.** Once setup window is opened, system will automatically assign a unique sequential number as training ID (e.g. 20250109) to the training. However, the number is fixed once the setup is saved.
- **93.** Add 'Load Training Profile' option with drop-down 'Yes' and 'No'.
- **94.** (If 'Yes' option is selected) Add a drop-down list of training setups. The data is pulled from training profile created in 'Training Nomination Request Setup' (unscheduled and of future date, multiple selection)
- **95.** (If 'Yes' option is selected) The training is selected, all related information and nominations will be loaded here
- **96.** (If 'No' option is selected) Add title from 'Training Title' setup. Title can be searched with keywords using a search button (the training will be tagged with the specific training request if it is done from the 'Training Request Received' window)
- **97.** (If 'No' option is selected) Add duration of training – date & time with man-hour per participant (repeat schedule options for single training delivered in multiple days)
- **98.** (If 'No' option is selected) Add venue from drop-down option (data available in 'Training Venue' setup – single choice)
- **99.** (If 'No' option is selected) Training venue will be validated with already existing planned calendar (data available in 'Training Calendar' setup). Pop-up message to be displayed if duplication is found in the combination of training venue and date & time
- **100.** (If 'No' option is selected) Add 'Training Category' (data available in 'Training Category' setup – single choice)
- **101.** (If 'No' option is selected) Add 'Training Mode' (data available in 'Training Mode' setup – single choice)
- **102.** (If 'No' option is selected) Add 'Training Medium' (data available in 'Training Medium' setup – single choice)
- **103.** (If 'No' option is selected) Add 'Training Tags / Labels' information (data available in 'Training Tags / Labels' setup – multiple choice)
- **104.** (If 'No' option is selected) Add 'PDUs' text box
- **105.** (If 'No' option is selected) Add organized by from drop-down option (data available in 'Vendor' setup)
- **106.** Add 'Save & Next' option to go to the 'Trainer Tab Setup'

#### Trainer Tab Setup

- **107.** (If 'Yes' option is selected; this data will be pre-filled) Add 'Trainer Details' option. A search button for the ADMIN (HR) to search by name or EID
- **108.** Add 'Topic Name' option beside 'Trainer Details'
- **109.** Add 'Session Duration' beside 'Topic Name'
- **110.** Add 'Add More' button to add more than one detail
- **111.** Add 'Remove' option beside each trainer for ADMIN (HR) in case the trainer is to be removed
- **112.** Add 'Previous', 'Save & Next' options at the bottom of the page

#### Participants Tab Setup

- **113.** Add 'Select Participant' option. Participant details to be linked from employee database.
    - Individual EID / name entry
    - Bulk upload option
    - (If participant list comes through nomination; this data will be pre-filled. Still, ADMIN (HR) can add more)
- **114.** Add a 'Participants Summary' tab to view all the participant details
    - Add 'i' option for the participants with calendar conflict / leave / resignation / retirement issue
    - Add 'Remove' option beside each participant for ADMIN (HR) in case the participant is to be removed
- **115.** Add 'Save List & Next' option to the 'Notification Tab' setup

#### Notification Tab Setup

- **116.** Add 'Organizer communication' section
    - Add 'Send Nomination to Organizer Now' option with customizable email template
- **117.** Add 'Trainer communication' section
    - Add 'Set Reminder Mail' option with date picker
    - Add 'Save & Send Invitation to Trainer(s) Now' option with customizable email template
- **118.** Add 'Participant communication' section
    - Add 'Set Reminder Mail' option with date picker
    - Add 'Send Training Invitation Now' option with send email communication to the participants
    - Respective supervisors to be CCed automatically whereas more recipient can be added by the ADMIN (HR)
    - Participant list (PDF format) to be attached in the email
    - Customizable mail template will also contain a redirect link to reject the invitation by the participant

### (no sub-category)

- **119.** Training Invitation Withdrawal Process
    - Employee clicks on the redirect link. It takes him to his dashboard and in this particular training invitation
    - Add 'Accept' and 'Withdrawn Request' option
    - If training is rejected by the employee, add a mandatory pop-up dialogue box for employee to write the reason behind rejection
    - Once rejected by the employee, an email to be sent automatically to the concern supervisor with a redirect link to approve / reject the request
    - Supervisor will click the link, get a window summarizing all the active requests by the employees and approve / reject the request as per 'Supervisor' or 'Division Head / Learning Champion' role
    - Add 'Approve Withdrawal', 'Approve Withdrawal with Replacement' and 'Reject' options beside each request
    - If 'Approve Withdrawal' is clicked, add a mandatory pop-up dialogue box for supervisor to write the reason behind withdrawing the employee from this training
    - If 'Approve Withdrawal with Replacement' is clicked, add option 'Add Replacement' as per 'Supervisor' or 'Division Head / Learning Champion' role. Supervisor will get notification on nominees' calendar conflict / leave / resignation / retirement during nomination
    - ADMIN (HR) will receive the withdrawal / replacement request in dashboard and can approve or reject the request
    - Inclusion / exclusion email to be sent to added / deleted participant with CC to respective Supervisor once ADMIN (HR) processes the request

### Training Scheduling


#### Notification Tab Setup

- **120.** Add 'SMS and Whatsapp Notification' section
- **121.** Add 'Next' option to go to 'Feedback Tab' setup

#### Feedback Tab Setup

- **122.** Add 'Want to take feedback of this training?' option
- **123.** Add drop-down with 'Yes' and 'No' options
- **124.** If 'Yes' is selected, add 'Load Feedback Templates' options with drop-down. Feedback templates are available in 'Feedback Module' (details of the Feedback Module has been outlined later)
- **125.** Add 'Save' option

#### Undertaking to Training Tab Setup

- **126.** Add 'Training Bond' button
- **127.** Once clicked, a pop-up window with 'New Training Bond Setup' will open
- **128.** 'Bond Signing Date', 'Bond Period', 'Bond Period in Word', 'Bond Start Date', 'Bond Amount', 'Bond Amount in Word' – fields to be input by ADMIN (HR). Other fields of the setup will automatically be pulled from information available in 'Program Tab' and Employee Database
- **129.** Add 'Save in Training Bond Database & Print' (data is saved in Training bond database)
- **130.** A training bond template is needed and to be printed in single sided Legal Page setup. Some fields to be added from Employee Database (to be shared later).
- **131.** Add 'Save & Exit' option to close Training Scheduling Module.

### Planned Training Module and Attendance Management

- **132.** ADMIN (HR) will get a window with summary of his/ her scheduled training. Add information like 'Training Name', 'Venue', 'From Date', 'To Date', 'Organized By' etc.
- **133.** Add 'View and Edit' button beside each training summary
- **134.** Add tab 'Training Details' summarizing all the information input for this training in 'Training Scheduling' module.
- **135.** Add 'Approval no.', 'Budget approved', 'Payment no.' and 'Actual expense' text boxes. These fields are mandatory (if there is no associated budget / expense with the training, 000 can be input). Also, an uploader and storage system to upload this training related approvals and other documents.
- **136.** Add 'Reschedule', 'Delete', 'Postpone' and 'Save' button. If rescheduled / deleted / postponed, customizable email to be sent to participants with cc to their line managers. Need email templates for that.
- **137.** Add tab 'Attendance' with the list of participants. 'Employee ID', 'Employee Name', 'Designation', 'Division / Department' etc. information is to be displayed in tabular form. All these details are available from 'Training Scheduling' module
- **138.** Add 'Attendance Status' column. If the participant marks attendance by him / herself, the status will be shown here
- **139.** Add 'Mark Attendance' column to the right with tick-box option to mark attendance
- **140.** Add 'Mark All'. Single row entry can be unchecked as well
- **141.** Add 'Add Participant' button at the bottom of the list. 'Employee ID' will be input by ADMIN (HR). Other employee information will come automatically from Employee Database
- **142.** Add 'Submit & Update Training Database' button. Subsequent entry in the training database will be done automatically. Also, training investment and cost-per employee will be calculated automatically and reflect in related dashboards and employee profile.
- **143.** For online training, employees will login to the training platform (MS Teams / Zoom / Others) through LMS or the session will be hosted in the LMS through necessary API integration. Attendance will be marked automatically as the system has the ability to track the employee ID through login details. Any employee details (in addition to the scheduled participants) will be available through request mode to admin. If approved, their attendance will be marked.

### Undertaking to Training


#### New Training Bond Setup

- **144.** Employee ID (input by ADMIN (HR))
- **145.** Name (data auto pull from Employee Database)
- **146.** Grade (data auto pull from Employee Database)
- **147.** Designation (data auto pull from Employee Database)
- **148.** Division (data auto pull from Employee Database)
- **149.** Location (data auto pull from Employee Database)
- **150.** Training / Course Title (drop-down list; data available in 'Training Title' setup)
- **151.** 'Training Category', 'Training Mode', 'Training Medium' and 'Training Tags / Labels' information (data auto pull from 'Training Title' setup)
- **152.** Institute (drop-down list; data available in 'Vendor' setup)
- **153.** Training / Course Duration (auto from training module) [from – to date format and no. of days]
- **154.** Man-hour (input by ADMIN (HR))
- **155.** Bond signing date (input by ADMIN (HR))
- **156.** Bond Period (input by ADMIN (HR))
- **157.** Bond Period in Word (input by ADMIN (HR))
- **158.** Bond Start Date (date picker)
- **159.** Bond End Date (calculated from the bond start date and bond period)
- **160.** Bond Amount (input by ADMIN (HR))
- **161.** Bond Amount in Word (input by ADMIN (HR))
- **162.** Add 'Print Training Bond' option. A training bond template is needed and to be printed in single sided Legal Page setup. Some fields to be added from Employee Database (to be shared later).
- **163.** Add 'Input in Training Database & Exit', 'Save & Exit'

#### Training Bond Database

- **164.** Summary of all the training bonds
- **165.** Information can be edited and saved by ADMIN (HR)
- **166.** Calculation of 'Remaining Liability'
- **167.** Training bond database can be updated either by direct entry from 'New Training Bond Setup' or entry done during 'Training Scheduling'.

### Summary of the Planned / Executed Training

- **168.** This is a dashboard for each ADMIN (HR) / L&D team to have a glimpse of the training performance during a specific period of time. Based on some reporting criteria, this dashboard will provide live data to the L&D team.

### Add Records to Training Database

- **169.** Existing database to be uploaded / migrated to the system. Need uploader template and uploader system for that (access for Admin only)
- **170.** Marked attendance from the scheduled training to be automatically updated in the training database
- **171.** Direct entry in 'New Training Bond Setup' under training bond module to be automatically updated in the training database
- **172.** Direct entry (single) + bulk new training information entry. Need uploader and template for that (access for Admin only). Direct entry (single) can be accessed by employee as well where he / she can submit request to be further validated / approved by Admin for entry in Training Database.

### Training Database for External Trainees

- **173.** Existing database to be uploaded / migrated to the system. Need uploader template and uploader system for that (access for Admin only)
- **174.** Direct entry (single) + bulk new training information entry. Need uploader and template for that (access for Admin only)

### Training Reports

- **175.** Employee-wise training report
- **176.** Division / Department / Function-wise training report
- **177.** Tag / label-wise training report (single and multiple tag / label)
- **178.** Period-wise training report
- **179.** Gender-wise training report
- **180.** Group-wise training report
- **181.** Report on training feedback
- **182.** Training Calendar
- **183.** Report in combination of multiple criteria
- **184.** Scheduled report (templet-wise) auto sending to relevant stakeholders
- **185.** AI integration to suggest training to employees considering skill-gap, role-requirement, mandatory courses for that role (adjusted automatically with the change of role) etc.

### Training Needs Assessment

- **186.** Submission of divisional training requirement
- **187.** Regular program wise TNA can be done through nomination / survey module (outlined later)
- **188.** Individual Development plan submission
- **189.** Time-to-time changes in the TNA module / process may happen; thereby the changes in module / new development may be required

## e-Learning Module


### Course Creation

- **190.** Configuration: course title, course code, short description, detailed description, learning objectives, difficulty level, estimated duration, mandatory status (all employee / role / division / department / function etc.) tags, keywords, version number, expiry date, course thumbnail (image / video), module-wise thumbnail (image / video), sub-title management (English and bangla)
- **191.** Basic course structure: organize course -> module (section) -> lesson (activity) -> feedback -> assessment -> certification
- **192.** Learning rules: sequential learning, conditional access to next content (mandatory completion), completion criteria, minimum score, pass mark, time limit, course expiry, auto re-enrollment, refresher interval etc.
- **193.** Content type: video, SCORM package, zip, youtube video, streaming link, PDF, .doc, PPT, excel, image with protection options (preview only / download allowed / print allowed / water mark etc.) as well as interactive contents HTML5, H5P, image comparison, bangla language content / UI support, closed caption / subtitles for videos etc. Offline and low-bandwith playback support is also needed. etc.
- **194.** Content support: drag & drop, uploader, reordering etc.
- **195.** Content control: playback speed, allow / disallow speed control, allow / disallow skipping, prevent forward seeking, resume from last watch position, picture-in-picture, full screen, tracking mechanism: watch percentage, page scrolled, time spent, interoperable learning-activity tracking (xAPI/cmi5) etc.
- **196.** Assessment: embedded assessment – before activity, during activity, end of activity and after a certain pre-defined time (details of the assessment functionalities is discussed in the Assessment / Exam Module)
- **197.** Feedback: activity-level feedback, course-level feedback (details of the feedback functionalities is discussed in the Feedback Module), overall course rating etc.

### Course Administration

- **198.** Certification: configurable by admin, multiple templets can be created, digital signature, auto-generated upon course completion / criteria completion, QR code verification, download (image, pdf), share (email, social media platforms)
- **199.** Learning path: category assign, sequence to multiple courses, pre-requisites, role-based learning, mandatory learning etc.
- **200.** Enrollment: individual enrollment, bulk upload (excel-based, excel cells drag & drop), role-wise admin enrollment, grade / role / branch / division / department / location-wise enrollment, enrollment request by trainee, create batch and scheduling with criteria during enrollment, external learner profile creation (individual / bulk) etc.
- **201.** Notification & communication: Configurable reminder frequency, automated enrollment notifications with customized email, course due and overdue reminders (web, in-app and email) to trainee, manager alerts for team progress / overdue course and assessment, feedback request reminders, automated certificate to trainee's designated email, announcement center, email / SMS / push notification / whatsapp integration support etc.
- **202.** Version control: with or without uploading new course / content assigning to trainees as fresh course; with previous data backup, archive and restore functionality
- **203.** Search: global search, filter by division / department / office / region / difficulty / popularity / grade / designation etc.
- **204.** Direct access to course from the shared link after logging in.

### Dashboards

- **205.** Trainee dashboard: course-wise completion status, last viewed course, bookmarks, downloads, discussion forum, learning goal / KPI & progress, upcoming exam, latest exam results, leaderboard for the completed exams, certificates, upcoming schedules (exam, training, course etc.), calendar view of the assigned tasks, course enrolled – completed / upcoming – hours, exam enrolled - completed / pending, progress bar, points / badges / star / rewards etc.
- **206.** Manager dashboard: all as the trainee and learning goal / KPI & progress of the reportees, Absent / course non-completion report of the reportees etc.
- **207.** Reports: course-wise completion and assessment result, year & course-wise completion and assessment results, year & branch-wise reports, trainee's individual training report, branch / division / department-wise report, topic-wise report, tag-wise report, gender-wise report, training / course category-wise report, medium-wise report etc.
- **208.** Separate dashboards and analytics for trainings, e-learning, exam, feedback etc.
- **209.** Integration of AI tools to identify employees at risk of missing mandatory compliance deadlines, or forecasting division-level skill gaps before they become a performance problem

## Assessment / Exam Module


### (no sub-category)

- **210.** Direct access to exam from the shared link after logging in.
- **211.** Question type: MCQ, true/false, fill in blank, short answer (bound by character number), essay, case study, Image MCQ / case study, matching, drag & drop etc.
- **212.** Exam Configuration: Exam title, instructions, reading material attachment, passing score, mark for each question setting, negative marking, question randomization, option shuffle within question, question bank upload, time limit, attempt limit, exam availability, exam proctoring (webcam, face verification against EID photo, window / browser restriction, tab switch detection, copy-paste restriction, gaze count etc.), auto submit upon time limit exceeds, grace time, no of questions in display, pop-up message when a participant leaves / submits exam without answering all the questions, individual enrollment, bulk upload (excel-based, excel cells drag & drop), role-wise admin enrollment, grade / role / branch / division / department / location-wise enrollment etc.
- **213.** Exam evaluation: automatic (MCQ, Fill in the blanks, true/false), manual and AI assistance (for descriptive answers), trainer assignment (for descriptive questions – both question wise and exam wise), plagiarism detection etc.
- **214.** Result setting: Instant / scheduled, with whole questions, with / without correct answer, Score / percentage display, Grade setting (Excellent, Very Good etc.) etc.
- **215.** Question pull: from questions uploaded under specific exam, from one / multiple question bank, difficulty level wise etc.
- **216.** Question Bank: topic-wise (folders), question category (mandatory to pull or not), difficulty level, tags, single / bulk upload (excel), bulk download (topic / category / question bank-wise), duplicate detection, random question generation, question expiry, count of type-wise question under question bank, multiple exams using same question banks / topics etc.
- **217.** Dashboard: exam tagging with scheduled training, participation rate, pending participation, edit exam, exam summary (nos enrolled, nos participated), graphical presentation of different reports / results, participants can download individual exam wise excel report, exam results / participation status of reportees in the manager's dashboard etc.
- **218.** Notification & communication: Configurable reminder frequency, automated enrollment notifications with customized email, exam due and overdue reminders (web, in-app and email) to trainee, manager alerts for team progress / overdue exam, feedback request reminders, email / SMS / push notification / whatsapp integration support etc
- **219.** 'Star Icon' for top scorer, Gallery option to show top exam performer's pictures and details.
- **220.** If there are multiple exams in a same month for a team/individual, average marks/highest mark will be fetched and it will depend on admin's decision / quiz setting.

## Feedback / Survey Module


### (no sub-category)

- **221.** Direct access to feedback / survey from the shared link after logging in.
- **222.** Feedback types & configuration: stand-alone or attached to training / course / exam, training needs assessment, manager feedback, post training feedback components: content feedback, trainer feedback (for single / multiple trainer), logistics feedback, add templet, add category, add management level, add question, question type, calculation and evaluation etc.
- **223.** Question types: Likert scale, star rating, drop-down, open text box etc.
- **224.** Notification & communication: email / sms / whatsapp / push notification (web / app), link / QR code
- **225.** Analysis: data export in excel, trainer comparison, comparison with other feedback, trend chart, pie chart etc.
- **226.** AI-driven sentiment analysis, theme extraction, flagging the recurring issues through feedback etc.

## Knowledge Corner (Virtual)


### (no sub-category)

- **227.** File type: Image, audio, video, pdf, ppt, excel, doc etc. with protection options (preview only / download allowed / print allowed / water mark etc.)
- **228.** Content support: folder creation – multiple files under same folder, multiple folders under master folder, functionalities - drag & drop, uploader, reordering etc.
- **229.** Administration and Search: privacy control, bulk upload, content / topic tags, bookmark / favourites management, sharing content (through Employee ID, email), content link generation for sharing, content tagging with course / exam reading material section, global search, filter by topic / tag etc.

## Library Management (Physical books)


### Book Entry

- **230.** Add text boxes: 'Book Name', 'Author', 'Publishers', 'Year of Publishing', 'Year of Purchase', 'Category', 'Quantity', 'tag' etc.
- **231.** Assign system generated unique number to the books
- **232.** Add individual entry and Bulk Upload option (templet needed)

### Assign Book

- **233.** Add 'Search' button. Books can be searched with name, author, publisher, tag etc. information.
- **234.** Status of the book; i.e. available or not available will be shown
- **235.** Add 'Assign to employee' button. Employee information can be searched through EID, name etc.
- **236.** Add 'Return date' box. Date can be picked up through calendar / date picker.
- **237.** Add 'Submit' button
- **238.** There will be 'Employee' facing end of this module. They can request book through this module. Search option, availability status and request button will be available to them. HR Admin will approve (with return date) or reject the request.

### Reports

- **239.** Add filter to get customized report. Filter can be done through category, author, tag etc.
- **240.** Other reports; e.g. assigned books, overdue return etc.

## Competency & Learning Journey Management Module


### (no sub-category)

- **241.** Framework setup: add framework, framework name, description, project duration (start and end date), status (active / inactive – restore)
- **242.** Competency assessment: category setup (management level), competency setup, employee assignment, tagging with feedback / survey module, calculation, evaluation criteria assignment, competency level assessment
- **243.** Learning journey: training / course assignment with competency level, progress report (admin level, manager level, trainee level)

## Integration & API


### (no sub-category)

- **244.** With HR-IS, leave portal, customer service portal, attendance system, meeting room booking system, different performance tracking module, MS Teams / Zoom, Outlook (mail and calendar), SMS gateway, Whatsapp, Power BI for reporting & analytics, other tools / platforms as required
- **245.** AI chatbot / virtual learning assistant
- **246.** The whole system will be available in web version (both intra-net and internet) as well as mobile app (android and IOS)

## Intra-Module Integration


### (no sub-category)

- **247.** The modules mentioned in the above should be workable both independently and connected to other specific module. For example: stand-alone exam can be designed as well as the created exams can be linked with e-learning / online / physical trainings scheduled in prior modules.

## Security & Governance


### (no sub-category)

- **248.** Any further technical requirements (addition / modification) will be managed by IT Division
- **249.** As per standard and security protocol of City Bank; to be suggested by IT Division
- **250.** The whole system should be compatible with agile / modular design principles.
