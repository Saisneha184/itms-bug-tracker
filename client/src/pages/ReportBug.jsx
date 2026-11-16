import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createBug, fetchUsers } from '../api.js';
import { PRIORITIES, SEVERITIES, PRIORITY_META, SEVERITY_META, STATUS_META } from '../constants.js';
import { Avatar } from '../components/Avatar.jsx';
import {
  Bug, AlertTriangle, ChevronRight, CheckCircle2,
  ArrowLeft, Info, User, Tag, FileText, AlignLeft,
} from 'lucide-react';
import './ReportBug.css';

// ── Step config ───────────────────────────────────────────────────────────────
const STEPS = [
  { id: 'details',     label: 'Bug Details',   icon: Bug },
  { id: 'classify',   label: 'Classification', icon: Tag },
  { id: 'reporter',   label: 'Reporter',       icon: User },
  { id: 'review',     label: 'Review',         icon: CheckCircle2 },
];

const PRIORITY_DESC = {
  Low:      'Minor issue, no urgency. Can be deferred to a future sprint.',
  Medium:   'Should be fixed in the current or next sprint.',
  High:     'Needs to be fixed soon, affects important functionality.',
  Critical: 'Must be fixed immediately. Blocking users or causing data loss.',
};

const SEVERITY_DESC = {
  Minor:   'Small visual or cosmetic issue with no functional impact.',
  Major:   'Feature broken or degraded but a workaround exists.',
  Blocker: 'Complete blocker — the system or feature cannot be used at all.',
};

// ── Main component ────────────────────────────────────────────────────────────
export function ReportBug() {
  const navigate = useNavigate();
  const [step,    setStep]    = useState(0);
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState(null);
  const [errors,  setErrors]  = useState({});

  const [form, setForm] = useState({
    title:       '',
    description: '',
    stepsToReproduce: '',
    expectedBehavior: '',
    actualBehavior:   '',
    priority:    'Medium',
    severity:    'Major',
    reportedBy:  '',
  });

  useEffect(() => {
    fetchUsers().then(u => {
      setUsers(u);
      setForm(f => ({ ...f, reportedBy: u[0]?.id ?? '' }));
    });
  }, []);

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    setErrors(e => ({ ...e, [k]: '' }));
  };

  // ── Validation per step ──────────────────────────────────────────────────
  function validate(stepIdx) {
    const e = {};
    if (stepIdx === 0) {
      if (!form.title.trim())       e.title       = 'Title is required.';
      if (!form.description.trim()) e.description = 'Description is required.';
    }
    if (stepIdx === 2) {
      if (!form.reportedBy) e.reportedBy = 'Please select a reporter.';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function nextStep() {
    if (!validate(step)) return;
    setStep(s => s + 1);
  }

  function prevStep() { setStep(s => s - 1); }

  // ── Submit ───────────────────────────────────────────────────────────────
  async function handleSubmit() {
    setLoading(true);
    try {
      // Combine description fields into one block
      const fullDesc = [
        form.description,
        form.stepsToReproduce  ? `\nSteps to Reproduce:\n${form.stepsToReproduce}`  : '',
        form.expectedBehavior  ? `\nExpected Behavior:\n${form.expectedBehavior}`   : '',
        form.actualBehavior    ? `\nActual Behavior:\n${form.actualBehavior}`        : '',
      ].filter(Boolean).join('\n');

      const bug = await createBug({
        title:       form.title.trim(),
        description: fullDesc.trim(),
        priority:    form.priority,
        severity:    form.severity,
        reportedBy:  form.reportedBy,
      });
      setCreated(bug);
    } catch (err) {
      setErrors({ submit: err.message });
    } finally {
      setLoading(false);
    }
  }

  // ── Success screen ───────────────────────────────────────────────────────
  if (created) {
    return <SuccessScreen bug={created} onViewBug={() => navigate('/bugs')} onAnother={() => { setCreated(null); setStep(0); setForm({ title:'', description:'', stepsToReproduce:'', expectedBehavior:'', actualBehavior:'', priority:'Medium', severity:'Major', reportedBy: users[0]?.id ?? '' }); }} />;
  }

  const reporter = users.find(u => u.id === form.reportedBy);

  return (
    <div className="report-page">
      {/* Header */}
      <div className="report-page__header">
        <button className="btn-back" onClick={() => navigate(-1)} aria-label="Go back">
          <ArrowLeft size={15} />
          <span>Back</span>
        </button>
        <div>
          <h1 className="page-title">Report a Bug</h1>
          <p className="page-sub">Submit a new issue to the ITMS project</p>
        </div>
      </div>

      <div className="report-layout">
        {/* Stepper sidebar */}
        <aside className="stepper" aria-label="Form steps">
          {STEPS.map((s, i) => {
            const done    = i < step;
            const active  = i === step;
            const Icon    = s.icon;
            return (
              <div
                key={s.id}
                className={`stepper__item${active ? ' stepper__item--active' : ''}${done ? ' stepper__item--done' : ''}`}
                aria-current={active ? 'step' : undefined}
              >
                <div className="stepper__circle">
                  {done ? <CheckCircle2 size={14} /> : <Icon size={14} />}
                </div>
                <div className="stepper__text">
                  <span className="stepper__num">Step {i + 1}</span>
                  <span className="stepper__label">{s.label}</span>
                </div>
                {i < STEPS.length - 1 && <div className="stepper__line" />}
              </div>
            );
          })}
        </aside>

        {/* Form panel */}
        <div className="report-form-panel">
          {/* ── Step 0: Bug Details ── */}
          {step === 0 && (
            <FormSection title="Bug Details" subtitle="Describe what went wrong clearly and concisely." icon={<FileText size={16}/>}>
              <div className="form-group">
                <label className="form-label" htmlFor="rb-title">
                  Bug Title <span className="required">*</span>
                </label>
                <input
                  id="rb-title"
                  className={`form-input${errors.title ? ' form-input--error' : ''}`}
                  type="text"
                  placeholder="e.g. Login page crashes on empty password field"
                  value={form.title}
                  onChange={e => set('title', e.target.value)}
                  maxLength={120}
                  aria-required="true"
                  aria-describedby={errors.title ? 'rb-title-err' : undefined}
                />
                <div className="form-hint-row">
                  {errors.title
                    ? <span id="rb-title-err" className="form-error-text" role="alert">{errors.title}</span>
                    : <span className="form-hint">Keep it short and specific — one sentence.</span>
                  }
                  <span className="form-char">{form.title.length}/120</span>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="rb-desc">
                  Description <span className="required">*</span>
                </label>
                <textarea
                  id="rb-desc"
                  className={`form-textarea${errors.description ? ' form-input--error' : ''}`}
                  placeholder="Describe the bug in detail…"
                  value={form.description}
                  onChange={e => set('description', e.target.value)}
                  rows={4}
                  aria-required="true"
                  aria-describedby={errors.description ? 'rb-desc-err' : undefined}
                />
                {errors.description && <span id="rb-desc-err" className="form-error-text" role="alert">{errors.description}</span>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="rb-steps">Steps to Reproduce</label>
                <textarea
                  id="rb-steps"
                  className="form-textarea"
                  placeholder={`1. Go to the login page\n2. Leave the password field empty\n3. Click Submit`}
                  value={form.stepsToReproduce}
                  onChange={e => set('stepsToReproduce', e.target.value)}
                  rows={4}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="rb-expected">Expected Behavior</label>
                  <textarea
                    id="rb-expected"
                    className="form-textarea"
                    placeholder="What should have happened?"
                    value={form.expectedBehavior}
                    onChange={e => set('expectedBehavior', e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="rb-actual">Actual Behavior</label>
                  <textarea
                    id="rb-actual"
                    className="form-textarea"
                    placeholder="What actually happened?"
                    value={form.actualBehavior}
                    onChange={e => set('actualBehavior', e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
            </FormSection>
          )}

          {/* ── Step 1: Classification ── */}
          {step === 1 && (
            <FormSection title="Classification" subtitle="Set the priority and severity so the team can triage correctly." icon={<Tag size={16}/>}>
              <div className="form-group">
                <label className="form-label">Priority</label>
                <div className="option-cards" role="radiogroup" aria-label="Priority">
                  {PRIORITIES.map(p => {
                    const meta = PRIORITY_META[p];
                    const active = form.priority === p;
                    return (
                      <button
                        key={p}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        className={`option-card${active ? ' option-card--active' : ''}`}
                        style={{ '--card-color': meta.color }}
                        onClick={() => set('priority', p)}
                      >
                        <span className="option-card__icon" style={{ color: meta.color }}>{meta.icon}</span>
                        <span className="option-card__label" style={{ color: active ? meta.color : '' }}>{p}</span>
                        <span className="option-card__desc">{PRIORITY_DESC[p]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Severity</label>
                <div className="severity-cards" role="radiogroup" aria-label="Severity">
                  {SEVERITIES.map(s => {
                    const meta   = SEVERITY_META[s];
                    const active = form.severity === s;
                    return (
                      <button
                        key={s}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        className={`severity-card${active ? ' severity-card--active' : ''}`}
                        style={{ '--card-color': meta.color }}
                        onClick={() => set('severity', s)}
                      >
                        <span className="severity-card__label" style={{ color: active ? meta.color : '' }}>{s}</span>
                        <span className="severity-card__desc">{SEVERITY_DESC[s]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Info box */}
              <div className="info-box" role="note">
                <Info size={14} />
                <div>
                  <strong>Tip:</strong> Priority = when to fix it. Severity = how badly it's broken.
                  A <em>Low priority Blocker</em> is rare but valid — e.g. a rarely-used feature that is completely broken.
                </div>
              </div>
            </FormSection>
          )}

          {/* ── Step 2: Reporter ── */}
          {step === 2 && (
            <FormSection title="Reporter" subtitle="Who is reporting this bug?" icon={<User size={16}/>}>
              <div
                className="reporter-grid"
                role="radiogroup"
                aria-label="Select reporter"
              >
                {users.map(u => {
                  const active = form.reportedBy === u.id;
                  return (
                    <button
                      key={u.id}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      className={`reporter-card${active ? ' reporter-card--active' : ''}`}
                      onClick={() => set('reportedBy', u.id)}
                    >
                      <Avatar user={u} size={36} />
                      <div className="reporter-card__info">
                        <span className="reporter-card__name">{u.name}</span>
                        <span className="reporter-card__role">{u.role}</span>
                      </div>
                      {active && <CheckCircle2 size={16} className="reporter-card__check" />}
                    </button>
                  );
                })}
              </div>
              {errors.reportedBy && <span className="form-error-text" role="alert">{errors.reportedBy}</span>}
            </FormSection>
          )}

          {/* ── Step 3: Review ── */}
          {step === 3 && (
            <FormSection title="Review & Submit" subtitle="Check all details before submitting." icon={<CheckCircle2 size={16}/>}>
              <div className="review-card">
                <div className="review-card__header">
                  <span className="review-badge" style={{ background: STATUS_META.Open.bg, color: STATUS_META.Open.color, borderColor: `${STATUS_META.Open.color}33` }}>
                    Open
                  </span>
                  <span className="review-id">New Bug</span>
                </div>

                <h2 className="review-title">{form.title || <span className="text-muted">(No title)</span>}</h2>

                {form.description && (
                  <p className="review-desc">{form.description}</p>
                )}

                {form.stepsToReproduce && (
                  <div className="review-section">
                    <div className="review-section-label">Steps to Reproduce</div>
                    <pre className="review-pre">{form.stepsToReproduce}</pre>
                  </div>
                )}

                {(form.expectedBehavior || form.actualBehavior) && (
                  <div className="review-row">
                    {form.expectedBehavior && (
                      <div className="review-section review-section--half">
                        <div className="review-section-label">Expected</div>
                        <p className="review-desc">{form.expectedBehavior}</p>
                      </div>
                    )}
                    {form.actualBehavior && (
                      <div className="review-section review-section--half">
                        <div className="review-section-label">Actual</div>
                        <p className="review-desc">{form.actualBehavior}</p>
                      </div>
                    )}
                  </div>
                )}

                <div className="review-meta">
                  <MetaChip label="Priority" value={form.priority} color={PRIORITY_META[form.priority]?.color} icon={PRIORITY_META[form.priority]?.icon} />
                  <MetaChip label="Severity" value={form.severity} color={SEVERITY_META[form.severity]?.color} />
                  <div className="review-meta-item">
                    <span className="review-meta-label">Reporter</span>
                    <div className="review-meta-user">
                      <Avatar user={reporter} size={20} />
                      <span style={{ color: 'var(--text-secondary)' }}>{reporter?.name ?? '—'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {errors.submit && (
                <div className="form-error-box" role="alert">
                  <AlertTriangle size={14} />
                  {errors.submit}
                </div>
              )}
            </FormSection>
          )}

          {/* Navigation buttons */}
          <div className="form-nav">
            {step > 0
              ? <button className="btn btn--ghost" onClick={prevStep}>← Back</button>
              : <span />
            }
            {step < STEPS.length - 1
              ? <button className="btn btn--primary" onClick={nextStep}>
                  Continue <ChevronRight size={14} />
                </button>
              : <button className="btn btn--submit" onClick={handleSubmit} disabled={loading}>
                  {loading ? <span className="spinner" aria-hidden="true" /> : <Bug size={14} />}
                  {loading ? 'Submitting…' : 'Submit Bug Report'}
                </button>
            }
          </div>
        </div>

        {/* Live preview sidebar */}
        <aside className="preview-panel" aria-label="Live preview">
          <div className="preview-panel__title">Live Preview</div>
          <div className="preview-card">
            <div className="preview-card__header">
              <span
                className="preview-status"
                style={{ background: STATUS_META.Open.bg, color: STATUS_META.Open.color }}
              >
                Open
              </span>
              <span className="preview-new">New</span>
            </div>
            <div className="preview-card__title">
              {form.title || <span className="text-muted">Bug title will appear here…</span>}
            </div>
            {form.description && (
              <p className="preview-card__desc">{form.description.substring(0, 100)}{form.description.length > 100 ? '…' : ''}</p>
            )}
            <div className="preview-card__chips">
              <span className="preview-chip" style={{ color: PRIORITY_META[form.priority]?.color }}>
                {PRIORITY_META[form.priority]?.icon} {form.priority}
              </span>
              <span className="preview-chip" style={{ color: SEVERITY_META[form.severity]?.color }}>
                {form.severity}
              </span>
            </div>
            {reporter && (
              <div className="preview-card__reporter">
                <Avatar user={reporter} size={18} />
                <span>{reporter.name}</span>
              </div>
            )}
          </div>

          {/* Field completion checklist */}
          <div className="preview-checklist" aria-label="Field completion">
            <div className="preview-checklist__title">Checklist</div>
            <ChecklistItem done={!!form.title.trim()}       label="Title" />
            <ChecklistItem done={!!form.description.trim()} label="Description" />
            <ChecklistItem done={!!form.stepsToReproduce}   label="Reproduction steps" optional />
            <ChecklistItem done={!!form.expectedBehavior}   label="Expected behavior" optional />
            <ChecklistItem done={!!form.actualBehavior}     label="Actual behavior" optional />
            <ChecklistItem done                             label={`Priority: ${form.priority}`} />
            <ChecklistItem done                             label={`Severity: ${form.severity}`} />
            <ChecklistItem done={!!form.reportedBy}         label="Reporter selected" />
          </div>
        </aside>
      </div>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function FormSection({ title, subtitle, icon, children }) {
  return (
    <div className="form-section">
      <div className="form-section__header">
        <span className="form-section__icon">{icon}</span>
        <div>
          <h2 className="form-section__title">{title}</h2>
          <p  className="form-section__sub">{subtitle}</p>
        </div>
      </div>
      <div className="form-section__body">{children}</div>
    </div>
  );
}

function MetaChip({ label, value, color, icon }) {
  return (
    <div className="review-meta-item">
      <span className="review-meta-label">{label}</span>
      <span className="review-meta-val" style={{ color }}>
        {icon && <span style={{ marginRight: 4 }}>{icon}</span>}
        {value}
      </span>
    </div>
  );
}

function ChecklistItem({ done, label, optional }) {
  return (
    <div className={`checklist-item${done ? ' checklist-item--done' : ''}`}>
      <span className="checklist-item__dot" aria-hidden="true">{done ? '✓' : optional ? '○' : '·'}</span>
      <span className="checklist-item__label">
        {label}
        {optional && <span className="checklist-optional"> (optional)</span>}
      </span>
    </div>
  );
}

function SuccessScreen({ bug, onViewBug, onAnother }) {
  return (
    <div className="success-screen" role="main" aria-live="polite">
      <div className="success-card">
        <div className="success-icon" aria-hidden="true">🎉</div>
        <h2 className="success-title">Bug Reported!</h2>
        <p className="success-sub">Your bug has been successfully submitted to the ITMS project.</p>

        <div className="success-bug-id">{bug.id}</div>
        <div className="success-bug-title">{bug.title}</div>

        <div className="success-meta">
          <span
            className="badge"
            style={{
              background: STATUS_META.Open.bg,
              color:      STATUS_META.Open.color,
              borderColor:`${STATUS_META.Open.color}33`,
            }}
          >
            Open
          </span>
          <span style={{ color: PRIORITY_META[bug.priority]?.color, fontSize: 12, fontWeight: 500 }}>
            {PRIORITY_META[bug.priority]?.icon} {bug.priority}
          </span>
          <span style={{ color: SEVERITY_META[bug.severity]?.color, fontSize: 12, fontWeight: 500 }}>
            {bug.severity}
          </span>
        </div>

        <div className="success-actions">
          <button className="btn btn--primary" onClick={onViewBug}>View in Bug List</button>
          <button className="btn btn--ghost"   onClick={onAnother}>Report Another Bug</button>
        </div>
      </div>
    </div>
  );
}
