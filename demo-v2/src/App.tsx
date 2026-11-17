import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import Shell from './components/Shell';
import { PlatformMap, WorkflowView } from './pages/Home';
import { Login } from './pages/Welcome';
import { CommandCenter } from './pages/Command';
import { ExamV2 } from './pages/Hero';
import { CompetencyPage } from './pages/competency/Competency';
import { FeedbackHub } from './pages/feedback/FeedbackHub';
import { Certificates } from './pages/Learning';
import { Knowledge, LibraryPage, Mobile } from './pages/Platform';
import { Administration } from './pages/admin/Administration';
import { ConnectedBank, SetupMasters } from './pages/Admin';
// Training Management System (TMS)
import { TrainingRequest } from './pages/tms/TrainingRequest';
import { RequestInbox } from './pages/tms/RequestInbox';
import { NominationSetup } from './pages/tms/NominationSetup';
import { LcNomination, NominationStatus } from './pages/tms/Nominations';
import { Scheduling } from './pages/tms/Scheduling';
import { PlannedTraining } from './pages/tms/Planned';
import { Attendance } from './pages/tms/Attendance';
import { Bonds } from './pages/tms/Bonds';
import { TrainingDb } from './pages/tms/TrainingDb';
import { FeedbackPage } from './pages/tms/Feedback';
import { TrainingCalendar } from './pages/tms/Calendar';
import { CourseEnrolments } from './pages/tms/Courses';
// Decisions (enterprise workflow)
import { RequestReview } from './pages/decisions/RequestReview';
import { FinanceApproval } from './pages/decisions/Finance';
import { TrainerSessions } from './pages/decisions/Trainer';
import { SupervisorRequests } from './pages/decisions/Supervisor';
import { HrApprovals } from './pages/decisions/HrApprovals';
// Employee
import { MyLearning } from './pages/employee/MyLearning';
import { MyRecord } from './pages/employee/Record';
// LMS / L&D
import { CoursePage } from './pages/learning/Course';
import { AssessmentReview } from './pages/learning/AssessmentReview';
import { AssessmentResults } from './pages/learning/AssessmentResults';
import { LearningJourney } from './pages/learning/Journey';
// Oversight
import { DivisionDashboard, RoleHome, TeamDashboard } from './pages/oversight/Dashboards';
import { RequestDetail } from './pages/oversight/RequestDetail';
import { Modules } from './pages/Modules';
import { Intelligence } from './pages/oversight/Intelligence';
import { LearningHub } from './pages/learning/Hub';
import { ExamsHub } from './pages/assessment/Exams';
import { ExamBuilder } from './pages/assessment/ExamBuilder';
import { TakeExam } from './pages/assessment/TakeExam';
import { IntegrityReview } from './pages/assessment/Integrity';
import { GradingSheet } from './pages/assessment/Grading';
import { CourseSetup } from './pages/decisions/CourseSetup';
import { TrainingAssessment, TrainingCourse } from './pages/learning/TrainingCourse';
import { EmployeeRecord, PeopleDirectory } from './pages/PeopleDirectory';
import { ReportsPage } from './pages/oversight/Reports';
import { CoveragePage } from './pages/oversight/Coverage';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route element={<Shell />}>
          <Route path="/overview" element={<CommandCenter />} />
          <Route path="/r/:role" element={<RoleHome />} />
          <Route path="/workflow" element={<WorkflowView />} />
          <Route path="/learning" element={<Modules />} />
          <Route path="/people" element={<PeopleDirectory />} />
          <Route path="/people/:id" element={<EmployeeRecord />} />
          <Route path="/platform" element={<PlatformMap />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/connected" element={<ConnectedBank />} />
          <Route path="/coverage" element={<CoveragePage />} />
          {/* Division Head / Learning Champion */}
          <Route path="/division" element={<DivisionDashboard />} />
          <Route path="/division/requests/:id" element={<RequestDetail />} />
          <Route path="/request/new" element={<TrainingRequest />} />
          <Route path="/nominate" element={<LcNomination />} />
          {/* HR Admin */}
          <Route path="/hr/requests" element={<RequestInbox />} />
          <Route path="/hr/requests/:id" element={<RequestReview />} />
          <Route path="/hr/nomination-request" element={<NominationSetup />} />
          <Route path="/hr/nomination-status" element={<NominationStatus />} />
          <Route path="/hr/schedule" element={<Scheduling />} />
          <Route path="/hr/approvals" element={<HrApprovals />} />
          <Route path="/hr/attendance" element={<Attendance />} />
          <Route path="/hr/planned" element={<PlannedTraining />} />
          <Route path="/hr/bonds" element={<Bonds />} />
          <Route path="/hr/training-db" element={<TrainingDb />} />
          <Route path="/hr/calendar" element={<TrainingCalendar />} />
          <Route path="/hr/courses" element={<CourseEnrolments />} />
          <Route path="/hr/setup" element={<SetupMasters />} />
          {/* Other roles */}
          <Route path="/finance" element={<FinanceApproval />} />
          <Route path="/trainer" element={<TrainerSessions />} />
          <Route path="/trainer/course-setup" element={<CourseSetup />} />
          <Route path="/learning/training" element={<TrainingCourse />} />
          <Route path="/learning/training/assessment" element={<TrainingAssessment />} />
          <Route path="/employee" element={<MyLearning />} />
          <Route path="/employee/feedback" element={<FeedbackPage />} />
          <Route path="/employee/record" element={<MyRecord />} />
          <Route path="/employee/certificates" element={<Certificates />} />
          <Route path="/supervisor" element={<SupervisorRequests />} />
          <Route path="/supervisor/team" element={<TeamDashboard />} />
          <Route path="/executive" element={<Intelligence />} />
          {/* Learning & development modules */}
          <Route path="/learning/hub" element={<LearningHub />} />
          <Route path="/learning/course" element={<CoursePage />} />
          <Route path="/assessment" element={<ExamsHub />} />
          <Route path="/assessment/aml" element={<ExamV2 />} />
          <Route path="/assessment/new" element={<ExamBuilder />} />
          <Route path="/assessment/take/:id" element={<TakeExam />} />
          <Route path="/assessment/integrity/:id" element={<IntegrityReview />} />
          <Route path="/assessment/grading/:examId" element={<GradingSheet />} />
          <Route path="/assessment/review" element={<AssessmentReview />} />
          <Route path="/assessment/results" element={<AssessmentResults />} />
          <Route path="/competency" element={<CompetencyPage />} />
          <Route path="/feedback" element={<FeedbackHub />} />
          <Route path="/journey" element={<LearningJourney />} />
          <Route path="/tna" element={<DivisionDashboard />} />
          <Route path="/knowledge" element={<Knowledge />} />
          <Route path="/library" element={<LibraryPage />} />
          <Route path="/mobile" element={<Mobile />} />
          {/* System admin */}
          <Route path="/admin" element={<Administration />} />
          <Route path="/admin/audit" element={<Navigate to="/admin/maker-checker" replace />} />
          <Route path="/admin/security" element={<Navigate to="/admin/roles" replace />} />
          <Route path="/admin/:tab" element={<Administration />} />
        </Route>
        <Route path="*" element={<Navigate to="/overview" replace />} />
      </Routes>
    </HashRouter>
  );
}
