import {
  ArrowLeft, ArrowRight, Award, BookOpen, Check, CheckCircle2, Circle, Clock3, FileCheck2,
  Lightbulb, ListChecks, Play, RotateCcw, ShieldCheck, Sparkles
} from "lucide-react";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import type { Role } from "../auth/roles";
import { AppLink } from "../components/AppLink";
import { readStoredJson, writeStoredJson } from "../lib/browser/storage";
import { workspaceConfigForRole } from "./workspaceConfig";

type SignedInRole = Exclude<Role, "public">;

type LearningLesson = {
  id: string;
  title: string;
  minutes: number;
  summary: string;
  outcome: string;
  steps: string[];
  materials: string[];
  tip: string;
  actionSection: string;
};

type LearningCourse = {
  id: string;
  title: string;
  description: string;
  accent: string;
  roles?: SignedInRole[];
  lessons: LearningLesson[];
};

export type LearningProgress = Record<string, string[]>;

const ALL_SIGNED_IN_ROLES: SignedInRole[] = [
  "programme-assistant", "reviewer", "nsc", "national-coordinator", "cpmt", "agency-admin", "platform-admin", "it-admin"
];

const COURSE_CATALOG: LearningCourse[] = [
  {
    id: "workspace-essentials",
    title: "Workspace essentials",
    description: "Learn the record, evidence and access habits that keep programme work clear and auditable.",
    accent: "#006b73",
    roles: ALL_SIGNED_IN_ROLES,
    lessons: [
      {
        id: "understand-scope", title: "Understand your scope", minutes: 5,
        summary: "Start with the role, assignment, geography and expiry that determine what you can see and change.",
        outcome: "You can explain your active assignment and recognize work that should be escalated rather than edited.",
        steps: ["Open your profile and read each active assignment.", "Compare the assignment with the record owner and country.", "Use Support when a required record is outside your scope."],
        materials: ["Active role", "Assignment details", "Access expiry"],
        tip: "Access to a page does not replace record-level authorization.",
        actionSection: "profile"
      },
      {
        id: "work-with-evidence", title: "Work with evidence", minutes: 7,
        summary: "Connect claims, figures and decisions to the source material that supports them.",
        outcome: "You can distinguish a draft statement, a verified result and a formal decision.",
        steps: ["Check the source, date and owner before using a document.", "Attach evidence to the record it supports.", "Keep comments and changes in the record history."],
        materials: ["Source document", "Evidence date", "Record reference"],
        tip: "A clear evidence trail is more useful than a long narrative without sources.",
        actionSection: "saved"
      },
      {
        id: "recover-drafts", title: "Save, resume and recover work", minutes: 4,
        summary: "Use durable drafts, validation and history before moving a record to its next stage.",
        outcome: "You know how to resume incomplete work without creating duplicate records.",
        steps: ["Return to the existing record from your action queue.", "Resolve validation issues section by section.", "Confirm the saved version before advancing."],
        materials: ["Record identifier", "Validation summary", "Latest saved time"],
        tip: "Resume the existing record whenever one already exists for the same application or report.",
        actionSection: "overview"
      }
    ]
  },
  {
    id: "complete-application",
    title: "Prepare a complete grant application",
    description: "A guided path from eligibility and project design through budget, safeguards, attachments and submission.",
    accent: "#0072bc",
    roles: ["programme-assistant", "national-coordinator"],
    lessons: [
      {
        id: "call-eligibility", title: "1. Confirm the call and eligibility", minutes: 8,
        summary: "Match the organization, location, request and proposed work to the correct funding opportunity before drafting.",
        outcome: "You have a clear eligibility basis and the correct application record.",
        steps: ["Select the correct funding cycle and intake source.", "Confirm applicant type, geography and funding range.", "Record any eligibility question before continuing."],
        materials: ["Funding call", "Applicant registration", "Eligibility evidence"],
        tip: "Do not reshape an ineligible idea to fit a call without programme guidance.",
        actionSection: "intake"
      },
      {
        id: "organization-basics", title: "2. Add organization and project basics", minutes: 12,
        summary: "Enter the legal identity, contacts, project location, requested amount and concise project summary.",
        outcome: "The application can be identified, contacted and routed without ambiguity.",
        steps: ["Use the organization’s registered name and current contact details.", "Choose a specific project location and implementation period.", "Write a short summary that connects the problem, action and intended change."],
        materials: ["Registration record", "Authorized contact", "Project location"],
        tip: "Use specific names and dates; avoid placeholders that become hard to trace later.",
        actionSection: "proposals"
      },
      {
        id: "project-design", title: "3. Explain the project design", minutes: 18,
        summary: "Describe the problem, community priorities, proposed approach, beneficiaries and implementation partners.",
        outcome: "A reviewer can understand why the project is needed, who shaped it and how the approach should work.",
        steps: ["Describe the local problem using evidence and community perspectives.", "Explain the activities and why they fit the context.", "Identify beneficiary groups, partners and meaningful participation."],
        materials: ["Problem evidence", "Consultation notes", "Partner roles"],
        tip: "Connect every major activity to a stated need and an intended result.",
        actionSection: "proposals"
      },
      {
        id: "results-workplan", title: "4. Build results and the workplan", minutes: 20,
        summary: "Translate the project idea into measurable results, activities, indicators, responsibilities and dates.",
        outcome: "The results framework and workplan tell one consistent delivery story.",
        steps: ["Define outputs and outcomes before selecting indicators.", "Give each activity an owner and realistic timeframe.", "Name the evidence that will verify each indicator."],
        materials: ["Results framework", "Workplan", "Verification sources"],
        tip: "Indicators should measure change, not simply repeat the activity description.",
        actionSection: "proposals"
      },
      {
        id: "budget-cofinancing", title: "5. Complete budget and cofinancing", minutes: 18,
        summary: "Build an itemized, justified budget and record cash and in-kind contributions separately.",
        outcome: "Requested funding, cofinancing and activities reconcile without unexplained gaps.",
        steps: ["Link each budget line to an activity or delivery need.", "Explain the quantity, basis and reason for material costs.", "Identify cofinancing source, type, status and supporting evidence."],
        materials: ["Detailed budget", "Cost assumptions", "Cofinancing evidence"],
        tip: "A contribution is not confirmed until its source and status are documented.",
        actionSection: "proposals"
      },
      {
        id: "risk-documents", title: "6. Address risk and supporting materials", minutes: 16,
        summary: "Complete safeguards, inclusion, risk and sustainability responses, then attach the required documents.",
        outcome: "Risks and inclusion commitments are specific, proportionate and supported.",
        steps: ["Identify environmental, social, fiduciary and delivery risks.", "State mitigation owners and monitoring actions.", "Check every required attachment for version, date and legibility."],
        materials: ["Risk assessment", "Safeguards evidence", "Required attachments"],
        tip: "Do not leave a risk blank because it seems unlikely; explain why it is not material.",
        actionSection: "proposals"
      },
      {
        id: "validate-submit", title: "7. Validate, preview and submit", minutes: 10,
        summary: "Resolve validation issues, inspect the complete application version and use the controlled submission step.",
        outcome: "The submitted version is complete, internally consistent and ready for formal review.",
        steps: ["Run validation and resolve every blocking issue.", "Preview the full application and verify totals, names and attachments.", "Confirm submission only after the authorized owner approves the version."],
        materials: ["Validation summary", "Application preview", "Submission authority"],
        tip: "Submission creates a controlled version; preview it as a reviewer will see it.",
        actionSection: "proposals"
      }
    ]
  },
  {
    id: "review-decide",
    title: "Review and decide consistently",
    description: "Apply criteria, manage conflicts and connect recommendations and decisions to evidence.",
    accent: "#7a4eab",
    roles: ["reviewer", "nsc", "national-coordinator", "cpmt"],
    lessons: [
      {
        id: "conflict-independence", title: "Declare conflicts and independence", minutes: 6,
        summary: "Confirm whether you can participate before protected evidence or decision materials are opened.",
        outcome: "Your access and participation reflect a recorded conflict declaration.",
        steps: ["Read the applicant and partner names.", "Declare any actual, potential or perceived conflict.", "Follow recusal instructions before continuing."],
        materials: ["Assignment notice", "Conflict policy", "Declaration"],
        tip: "When uncertain, disclose the relationship and let the authorized process decide.",
        actionSection: "reviews"
      },
      {
        id: "criteria-evidence", title: "Assess criteria against evidence", minutes: 18,
        summary: "Record findings against the approved criteria and cite the application material that supports each finding.",
        outcome: "Another authorized reviewer can follow the reasoning without guessing.",
        steps: ["Read the immutable application version first.", "Separate facts, judgement and clarification questions.", "Cite the relevant section or attachment for each material finding."],
        materials: ["Application version", "Review criteria", "Evidence references"],
        tip: "A strong score without evidence is not a complete review.",
        actionSection: "reviews"
      },
      {
        id: "recommend-decision", title: "Record recommendations and decisions", minutes: 12,
        summary: "Keep technical recommendations, committee authority, conditions and formal decisions distinct.",
        outcome: "The record shows who recommended, who decided and what conditions apply.",
        steps: ["Complete the independent recommendation before committee action.", "Record quorum, recusals and conditions in the meeting record.", "Preserve the final decision and its authority."],
        materials: ["Reviewer recommendation", "Meeting record", "Decision conditions"],
        tip: "Coordination can prepare the process but must not replace independent or committee authority.",
        actionSection: "decisions"
      }
    ]
  },
  {
    id: "deliver-report",
    title: "Manage delivery and reporting",
    description: "Move from an approved award through agreement, monitoring, evidence, results and annual reporting.",
    accent: "#c64d2f",
    roles: ["programme-assistant", "reviewer", "nsc", "national-coordinator", "cpmt", "agency-admin"],
    lessons: [
      {
        id: "agreement-startup", title: "Set up the grant for delivery", minutes: 12,
        summary: "Confirm the approved scope, conditions, agreement, milestones and roles before implementation starts.",
        outcome: "The delivery record reflects the approved decision and signed agreement.",
        steps: ["Compare the agreement with the approved application and conditions.", "Set milestone dates, responsibilities and required evidence.", "Record any external handoff without changing the authoritative source."],
        materials: ["Approval decision", "Signed agreement", "Milestone schedule"],
        tip: "Resolve differences between approval and agreement before recording delivery progress.",
        actionSection: "grants"
      },
      {
        id: "monitor-evidence", title: "Monitor progress with evidence", minutes: 15,
        summary: "Prepare visits, capture observations and follow actions through to resolution.",
        outcome: "Monitoring shows what was observed, what evidence exists and what must happen next.",
        steps: ["Plan monitoring around milestones, risks and indicators.", "Record observations separately from interpretation.", "Assign follow-up actions with an owner and due date."],
        materials: ["Monitoring plan", "Visit evidence", "Follow-up actions"],
        tip: "A photo can support an observation but rarely proves an outcome by itself.",
        actionSection: "monitoring"
      },
      {
        id: "report-results", title: "Enter results and prepare reporting", minutes: 18,
        summary: "Update indicators, explain variance and connect reported results to verification sources.",
        outcome: "Reported progress can be traced from project evidence to country aggregation.",
        steps: ["Use the approved indicator definition and reporting period.", "Record the value, evidence and explanation together.", "Resolve validation issues before country review and aggregation."],
        materials: ["Indicator definitions", "Verification evidence", "Variance explanation"],
        tip: "Never replace a missing value with a narrative estimate.",
        actionSection: "results"
      },
      {
        id: "close-learn", title: "Close responsibly and retain learning", minutes: 10,
        summary: "Confirm completion, unresolved obligations, final evidence and reusable learning before closure.",
        outcome: "The grant can close without losing accountability or practical knowledge.",
        steps: ["Check deliverables, finance and outstanding follow-up actions.", "Record final results and explain material changes.", "Nominate suitable non-sensitive learning for knowledge review."],
        materials: ["Completion checklist", "Final evidence", "Learning nomination"],
        tip: "Closure is a controlled stage, not simply an inactive status.",
        actionSection: "knowledge"
      }
    ]
  },
  {
    id: "publish-learning",
    title: "Turn evidence into reusable knowledge",
    description: "Classify, clear and share practical learning without exposing restricted programme information.",
    accent: "#8b6b08",
    roles: ["programme-assistant", "national-coordinator", "cpmt", "agency-admin", "platform-admin"],
    lessons: [
      {
        id: "select-material", title: "Select useful learning material", minutes: 8,
        summary: "Choose evidence that answers a real practice question and is complete enough to reuse.",
        outcome: "The nominated material has a clear audience, purpose and evidence basis.",
        steps: ["Identify the practice question the material answers.", "Confirm the source, owner and completeness.", "Remove duplication and unsupported claims."],
        materials: ["Source material", "Audience and purpose", "Evidence basis"],
        tip: "A useful knowledge product begins with a user need, not a file format.",
        actionSection: "knowledge"
      },
      {
        id: "rights-classification", title: "Check rights and classification", minutes: 10,
        summary: "Confirm consent, ownership, sensitivity, branding and publication eligibility before sharing.",
        outcome: "The record has an explicit publication basis and appropriate access classification.",
        steps: ["Identify personal, community and partner rights.", "Apply the correct sensitivity and access classification.", "Record clearance, restrictions and attribution."],
        materials: ["Consent or rights basis", "Classification", "Attribution"],
        tip: "Publication approval and AI eligibility are separate decisions.",
        actionSection: "knowledge"
      },
      {
        id: "publish-discover", title: "Publish for discovery and use", minutes: 9,
        summary: "Add clear metadata, an accessible summary and the themes and places people will use to find the material.",
        outcome: "Authorized audiences can discover, understand and correctly reuse the material.",
        steps: ["Write a plain-language title and summary.", "Add dates, geography, themes, language and resource type.", "Preview the public or restricted experience before publishing."],
        materials: ["Title and summary", "Discovery metadata", "Publication preview"],
        tip: "Good metadata explains what the material is, where it applies and why it matters.",
        actionSection: "knowledge"
      }
    ]
  },
  {
    id: "govern-platform",
    title: "Govern the platform safely",
    description: "Understand configuration, identity, integrations, audit history and controlled operational changes.",
    accent: "#244f75",
    roles: ["agency-admin", "platform-admin", "it-admin"],
    lessons: [
      {
        id: "identity-access", title: "Manage identity and access", minutes: 12,
        summary: "Connect roles to time-bound assignments and verify that sensitive functions remain separated.",
        outcome: "Access changes have a documented purpose, owner, scope and expiry.",
        steps: ["Verify identity before adding an assignment.", "Apply the narrowest role, geography and function required.", "Review expiry, delegation and emergency access history."],
        materials: ["Identity record", "Approved assignment", "Expiry and purpose"],
        tip: "A role label alone is never enough to define production access.",
        actionSection: "access-users"
      },
      {
        id: "configuration-change", title: "Make a controlled configuration change", minutes: 14,
        summary: "Assess impact, document approval, apply a bounded change and verify the resulting experience.",
        outcome: "The change is reversible, observable and linked to its authorization.",
        steps: ["Describe the intended outcome and affected scope.", "Record approval and a rollback path.", "Verify behavior, audit history and service health after the change."],
        materials: ["Change request", "Approval and rollback", "Verification evidence"],
        tip: "Configuration convenience must not bypass lifecycle or authorization controls.",
        actionSection: "access-overview"
      },
      {
        id: "integration-audit", title: "Trace integrations and audit history", minutes: 12,
        summary: "Follow data across authoritative sources, handoffs, processing states and retained audit events.",
        outcome: "You can identify where a record originated, what changed and which system is authoritative.",
        steps: ["Identify the source and receiving system for the record type.", "Inspect failed or delayed handoffs without overwriting source data.", "Use audit history to reconstruct material changes."],
        materials: ["Source-system reference", "Exchange status", "Audit event"],
        tip: "Synchronization status is evidence about a handoff, not proof that two systems are identical.",
        actionSection: "access-integrations"
      }
    ]
  }
];

function parseProgress(value: unknown): LearningProgress {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).map(([courseId, lessonIds]) => [
    courseId,
    Array.isArray(lessonIds) ? lessonIds.filter((item): item is string => typeof item === "string") : []
  ]));
}

export function learningCoursesForRole(role: Role) {
  if (role === "public") return [];
  return COURSE_CATALOG.filter((course) => course.roles?.includes(role));
}

function courseProgress(course: LearningCourse, progress: LearningProgress) {
  const completed = new Set(progress[course.id] || []);
  const completedCount = course.lessons.filter((lesson) => completed.has(lesson.id)).length;
  return { completed, completedCount, percent: course.lessons.length ? Math.round((completedCount / course.lessons.length) * 100) : 0 };
}

function firstIncompleteLesson(course: LearningCourse, progress: LearningProgress) {
  const completed = new Set(progress[course.id] || []);
  return course.lessons.find((lesson) => !completed.has(lesson.id)) || course.lessons[course.lessons.length - 1];
}

export function LearningWorkspace({ role }: { role: Role }) {
  const courses = useMemo(() => learningCoursesForRole(role), [role]);
  const storageKey = `sgp-klp-learning-progress-v1:${role}`;
  const [progress, setProgress] = useState<LearningProgress>(() => readStoredJson(storageKey, {}, parseProgress));
  const [courseId, setCourseId] = useState(() => courses.find((course) => course.id === "complete-application")?.id || courses[0]?.id || "");
  const activeCourse = courses.find((course) => course.id === courseId) || courses[0];
  const [lessonId, setLessonId] = useState(() => activeCourse ? firstIncompleteLesson(activeCourse, progress).id : "");

  useEffect(() => {
    if (!activeCourse) return;
    if (!activeCourse.lessons.some((lesson) => lesson.id === lessonId)) setLessonId(firstIncompleteLesson(activeCourse, progress).id);
  }, [activeCourse?.id]);

  useEffect(() => {
    writeStoredJson(storageKey, progress);
  }, [progress, storageKey]);

  if (!activeCourse) return null;

  const activeLessonIndex = Math.max(0, activeCourse.lessons.findIndex((lesson) => lesson.id === lessonId));
  const activeLesson = activeCourse.lessons[activeLessonIndex];
  const activeProgress = courseProgress(activeCourse, progress);
  const completedLessonCount = courses.reduce((sum, course) => sum + courseProgress(course, progress).completedCount, 0);
  const lessonCount = courses.reduce((sum, course) => sum + course.lessons.length, 0);
  const minutesRemaining = courses.reduce((sum, course) => sum + course.lessons.filter((lesson) => !(progress[course.id] || []).includes(lesson.id)).reduce((lessonSum, lesson) => lessonSum + lesson.minutes, 0), 0);
  const completedCourseCount = courses.filter((course) => courseProgress(course, progress).percent === 100).length;
  const workspace = workspaceConfigForRole(role);
  const actionCandidates: Record<string, string[]> = {
    reviews: ["reviews", "decisions", "proposals"],
    decisions: ["decisions", "reviews", "proposals"],
    grants: ["grants", "agreements", "programmes"],
    monitoring: ["monitoring", "grants", "programmes"],
    results: ["results", "amr", "data-exchange", "analytics"],
    knowledge: ["knowledge", "access-knowledge", "access-documents", "access-site-content"]
  };
  const targetItem = workspace.nav.find((item) => (actionCandidates[activeLesson.actionSection] || [activeLesson.actionSection]).includes(item.id));
  const actionHref = activeLesson.actionSection === "overview" ? workspace.homeHref : targetItem?.href || "/workspace/support";
  const actionLabel = activeLesson.actionSection === "overview" ? "Overview" : targetItem?.label || "Open related guidance";
  const courseStyle = { "--learning-accent": activeCourse.accent } as CSSProperties;

  const selectCourse = (course: LearningCourse) => {
    setCourseId(course.id);
    setLessonId(firstIncompleteLesson(course, progress).id);
  };

  const toggleComplete = () => {
    setProgress((current) => {
      const completed = new Set(current[activeCourse.id] || []);
      if (completed.has(activeLesson.id)) completed.delete(activeLesson.id);
      else completed.add(activeLesson.id);
      return { ...current, [activeCourse.id]: [...completed] };
    });
  };

  const resetCourse = () => {
    setProgress((current) => ({ ...current, [activeCourse.id]: [] }));
    setLessonId(activeCourse.lessons[0].id);
  };

  return <div className="learning-workspace" style={courseStyle}>
    <section className="learning-overview" aria-labelledby="learning-heading">
      <div>
        <span className="learning-eyebrow"><Sparkles /> Guided learning</span>
        <h2 id="learning-heading">Learn the work while you do it</h2>
        <p>Short, role-aware courses explain how to prepare materials, use evidence and complete each controlled workflow.</p>
      </div>
      <div className="learning-overview__metrics" aria-label="Learning progress">
        <div><strong>{completedLessonCount}<span>/{lessonCount}</span></strong><small>Lessons complete</small></div>
        <div><strong>{completedCourseCount}<span>/{courses.length}</span></strong><small>Courses complete</small></div>
        <div><strong>{minutesRemaining}</strong><small>Minutes remaining</small></div>
      </div>
    </section>

    <section className="learning-course-strip" aria-label="Available courses">
      {courses.map((course, index) => {
        const status = courseProgress(course, progress);
        return <button
          key={course.id}
          type="button"
          className={course.id === activeCourse.id ? "active" : ""}
          style={{ "--course-card-accent": course.accent } as CSSProperties}
          onClick={() => selectCourse(course)}
          aria-pressed={course.id === activeCourse.id}
        >
          <span className="learning-course-strip__index">{status.percent === 100 ? <Check /> : String(index + 1).padStart(2, "0")}</span>
          <span><strong>{course.title}</strong><small>{course.lessons.length} lessons · {status.percent}% complete</small></span>
          <i><span style={{ width: `${status.percent}%` }} /></i>
        </button>;
      })}
    </section>

    <section className="learning-course" aria-labelledby="active-course-title">
      <header className="learning-course__header">
        <div className="learning-course__icon"><BookOpen /></div>
        <div>
          <span className="learning-eyebrow">Current course</span>
          <h2 id="active-course-title">{activeCourse.title}</h2>
          <p>{activeCourse.description}</p>
        </div>
        <div className="learning-course__completion">
          <strong>{activeProgress.percent}%</strong>
          <span>Course progress</span>
          {activeProgress.completedCount > 0 && <button type="button" onClick={resetCourse}><RotateCcw /> Restart</button>}
        </div>
      </header>

      <div className="learning-course__body">
        <nav className="learning-lessons" aria-label={`${activeCourse.title} lessons`}>
          <div className="learning-lessons__head"><ListChecks /><span>Course lessons</span></div>
          <ol>
            {activeCourse.lessons.map((lesson, index) => {
              const complete = activeProgress.completed.has(lesson.id);
              return <li key={lesson.id}>
                <button className={lesson.id === activeLesson.id ? "active" : ""} type="button" onClick={() => setLessonId(lesson.id)} aria-current={lesson.id === activeLesson.id ? "step" : undefined}>
                  {complete ? <CheckCircle2 className="complete" /> : <Circle />}
                  <span><small>Lesson {index + 1}</small><strong>{lesson.title.replace(/^\d+\.\s*/, "")}</strong></span>
                  <em>{lesson.minutes} min</em>
                </button>
              </li>;
            })}
          </ol>
        </nav>

        <article className="learning-lesson">
          <header>
            <div className="learning-lesson__meta"><span>Lesson {activeLessonIndex + 1} of {activeCourse.lessons.length}</span><span><Clock3 /> {activeLesson.minutes} minutes</span></div>
            <h3>{activeLesson.title}</h3>
            <p>{activeLesson.summary}</p>
          </header>

          <div className="learning-outcome"><Award /><div><strong>After this lesson</strong><p>{activeLesson.outcome}</p></div></div>

          <div className="learning-lesson__grid">
            <section>
              <div className="learning-section-title"><Play /><h4>Walk through it</h4></div>
              <ol className="learning-steps">{activeLesson.steps.map((step, index) => <li key={step}><span>{index + 1}</span><p>{step}</p></li>)}</ol>
            </section>
            <aside>
              <div className="learning-section-title"><FileCheck2 /><h4>Have these ready</h4></div>
              <ul className="learning-materials">{activeLesson.materials.map((material) => <li key={material}><Check />{material}</li>)}</ul>
              <div className="learning-tip"><Lightbulb /><p><strong>Practice tip</strong>{activeLesson.tip}</p></div>
            </aside>
          </div>

          <footer className="learning-lesson__actions">
            <button type="button" className={`button ${activeProgress.completed.has(activeLesson.id) ? "button--secondary" : "button--primary"}`} onClick={toggleComplete}>
              {activeProgress.completed.has(activeLesson.id) ? <><CheckCircle2 /> Completed</> : <><Check /> Mark lesson complete</>}
            </button>
            <AppLink className="button button--secondary" href={actionHref}><Play /> {actionLabel}</AppLink>
            <div>
              <button type="button" aria-label="Previous lesson" disabled={activeLessonIndex === 0} onClick={() => setLessonId(activeCourse.lessons[activeLessonIndex - 1].id)}><ArrowLeft /></button>
              <span>{activeLessonIndex + 1} / {activeCourse.lessons.length}</span>
              <button type="button" aria-label="Next lesson" disabled={activeLessonIndex === activeCourse.lessons.length - 1} onClick={() => setLessonId(activeCourse.lessons[activeLessonIndex + 1].id)}><ArrowRight /></button>
            </div>
          </footer>
        </article>
      </div>
    </section>

    {activeProgress.percent === 100 && <section className="learning-complete" role="status"><ShieldCheck /><div><span>Course complete</span><h3>{activeCourse.title}</h3><p>Your progress is saved in this browser. You can revisit any lesson while completing real work.</p></div><Award /></section>}
  </div>;
}
