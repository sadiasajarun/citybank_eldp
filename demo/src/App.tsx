import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import Shell from './components/Shell';
import { DemoHome, Login, PlatformMap, WorkflowView } from './pages/Home';
import { DivisionDashboard, TrainingRequest } from './pages/DivisionHead';
import { HrDashboard, RequestInbox, Scheduling, TrainingDatabase } from './pages/Hr';
import { EmployeeDashboard, FeedbackPage, TeamLearning, TrainerDashboard } from './pages/Employee';
import { Certificates, Journey } from './pages/Learning';
import { AttendanceV2, CapabilityProfile, CoursePlayerV2, DevelopmentJourney, ExamV2, ExecutiveCenter, NominationsPage, ReplacementExperience, RequestReview } from './pages/Hero';
import { AuditPage, Integrations, Knowledge, LibraryPage, Mobile, Security, Tna } from './pages/Platform';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route element={<Shell />}>
          <Route path="/demo" element={<DemoHome />} />
          <Route path="/workflow" element={<WorkflowView />} />
          <Route path="/platform" element={<PlatformMap />} />
          <Route path="/demo/training-lifecycle" element={<Navigate to="/division-head/training-request/new" replace />} />
          <Route path="/division-head/dashboard" element={<DivisionDashboard />} />
          <Route path="/division-head/training-request/new" element={<TrainingRequest />} />
          <Route path="/learning-champion/nominations" element={<NominationsPage />} />
          <Route path="/hr/dashboard" element={<HrDashboard />} />
          <Route path="/hr/requests" element={<RequestInbox />} />
          <Route path="/hr/requests/:id" element={<RequestReview />} />
          <Route path="/hr/training/:id/schedule" element={<Scheduling />} />
          <Route path="/hr/training/:id/attendance" element={<AttendanceV2 />} />
          <Route path="/hr/training-database" element={<TrainingDatabase />} />
          <Route path="/hr/competencies" element={<CapabilityProfile />} />
          <Route path="/hr/analytics" element={<ExecutiveCenter />} />
          <Route path="/hr/tna" element={<Tna />} />
          <Route path="/employee/dashboard" element={<EmployeeDashboard />} />
          <Route path="/employee/training/:id" element={<Navigate to="/employee/dashboard" replace />} />
          <Route path="/employee/learning-history" element={<DevelopmentJourney />} />
          <Route path="/employee/feedback" element={<FeedbackPage />} />
          <Route path="/employee/journey" element={<Journey />} />
          <Route path="/employee/certificates" element={<Certificates />} />
          <Route path="/supervisor/approvals" element={<ReplacementExperience />} />
          <Route path="/supervisor/team" element={<TeamLearning />} />
          <Route path="/trainer/dashboard" element={<TrainerDashboard />} />
          <Route path="/learning/course/info-security-2026" element={<CoursePlayerV2 />} />
          <Route path="/assessment/aml-certification" element={<ExamV2 />} />
          <Route path="/resources/knowledge" element={<Knowledge />} />
          <Route path="/resources/library" element={<LibraryPage />} />
          <Route path="/admin/integrations" element={<Integrations />} />
          <Route path="/admin/audit" element={<AuditPage />} />
          <Route path="/admin/security" element={<Security />} />
          <Route path="/mobile" element={<Mobile />} />
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </HashRouter>
  );
}
