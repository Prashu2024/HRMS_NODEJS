import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const EyeOpen = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);
const EyeClosed = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);
const HRMSIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);
const FieldErr = ({ msg }) => !msg ? null : (
  <p style={{ display:'flex', alignItems:'center', gap:5, fontSize:11.5, color:'#ef4444', marginTop:6, fontWeight:500 }}>
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
    {msg}
  </p>
);

function PwdStrength({ pwd }) {
  let score = 0;
  if (pwd.length >= 8)          score++;
  if (/[A-Z]/.test(pwd))        score++;
  if (/[0-9]/.test(pwd))        score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  const levels = [
    { label:'Weak',   color:'#ef4444', width:'25%'  },
    { label:'Fair',   color:'#f97316', width:'50%'  },
    { label:'Good',   color:'#eab308', width:'75%'  },
    { label:'Strong', color:'#22c55e', width:'100%' },
  ];
  const lvl = levels[Math.max(score - 1, 0)];
  return (
    <div style={{ marginTop:7 }}>
      <div style={{ height:3, borderRadius:99, background:'#e2e8f0', overflow:'hidden', marginBottom:4 }}>
        <div style={{ height:'100%', borderRadius:99, background:lvl.color, width:lvl.width, transition:'width .3s, background .3s' }} />
      </div>
      <span style={{ fontSize:11, fontWeight:600, color:lvl.color }}>{lvl.label}</span>
    </div>
  );
}

const EMPTY_LOGIN    = { username:'', password:'' };
const EMPTY_REGISTER = { username:'', email:'', password:'', confirmPassword:'', role:'staff' };

export default function Login() {
  const { login, register, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab]             = useState('login');
  const [mounted, setMounted]     = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Login state
  const [lForm, setLForm]   = useState(EMPTY_LOGIN);
  const [lErrors, setLErrors] = useState({});
  const [lApiErr, setLApiErr] = useState('');
  const [lLoading, setLLoading] = useState(false);
  const [showLPwd, setShowLPwd] = useState(false);

  // Register state
  const [rForm, setRForm]   = useState(EMPTY_REGISTER);
  const [rErrors, setRErrors] = useState({});
  const [rApiErr, setRApiErr] = useState('');
  const [rLoading, setRLoading] = useState(false);
  const [showRPwd, setShowRPwd] = useState(false);
  const [showRCfm, setShowRCfm] = useState(false);

  const firstRef = useRef(null);

  useEffect(() => {
    if (isAuthenticated) { navigate('/', { replace: true }); return; }
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, [isAuthenticated, navigate]);

  useEffect(() => { if (mounted) firstRef.current?.focus(); }, [mounted, tab]);

  const switchTab = (t) => {
    setTab(t);
    setLForm(EMPTY_LOGIN); setLErrors({}); setLApiErr('');
    setRForm(EMPTY_REGISTER); setRErrors({}); setRApiErr('');
    setSuccessMsg('');
  };

  // ── Login ──
  const lChange = (e) => {
    const { name, value } = e.target;
    setLForm(f => ({ ...f, [name]: value }));
    if (lApiErr) setLApiErr('');
    if (lErrors[name]) setLErrors(fe => ({ ...fe, [name]: '' }));
  };
  const validateLogin = () => {
    const e = {};
    if (!lForm.username.trim()) e.username = 'Username is required';
    if (!lForm.password)        e.password = 'Password is required';
    return e;
  };
  const handleLogin = async (ev) => {
    ev.preventDefault(); setLApiErr('');
    const errs = validateLogin();
    if (Object.keys(errs).length) { setLErrors(errs); return; }
    setLLoading(true);
    const result = await login(lForm.username.trim(), lForm.password);
    setLLoading(false);
    if (result.success) { navigate('/', { replace: true }); }
    else { setLApiErr(result.error); setLForm(f => ({ ...f, password: '' })); }
  };

  // ── Register ──
  const rChange = (e) => {
    const { name, value } = e.target;
    setRForm(f => ({ ...f, [name]: value }));
    if (rApiErr) setRApiErr('');
    if (rErrors[name]) setRErrors(fe => ({ ...fe, [name]: '' }));
  };
  const validateRegister = () => {
    const e = {};
    if (!rForm.username.trim())             e.username = 'Username is required';
    else if (rForm.username.trim().length < 3) e.username = 'At least 3 characters';
    else if (!/^[a-zA-Z0-9_]+$/.test(rForm.username)) e.username = 'Letters, numbers, underscores only';
    if (!rForm.email.trim())                e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rForm.email)) e.email = 'Enter a valid email';
    if (!rForm.password)                    e.password = 'Password is required';
    else if (rForm.password.length < 8)     e.password = 'At least 8 characters';
    else if (!/[A-Z]/.test(rForm.password)) e.password = 'Must include one uppercase letter';
    else if (!/[0-9]/.test(rForm.password)) e.password = 'Must include one number';
    if (!rForm.confirmPassword)             e.confirmPassword = 'Please confirm your password';
    else if (rForm.password !== rForm.confirmPassword) e.confirmPassword = 'Passwords do not match';
    return e;
  };
  const handleRegister = async (ev) => {
    ev.preventDefault(); setRApiErr('');
    const errs = validateRegister();
    if (Object.keys(errs).length) { setRErrors(errs); return; }
    setRLoading(true);
    const result = await register({ username: rForm.username.trim(), email: rForm.email.trim(), password: rForm.password, role: rForm.role });
    setRLoading(false);
    if (result.success) {
      setSuccessMsg(`Account created! Sign in as "${rForm.username.trim()}".`);
      setRForm(EMPTY_REGISTER); setRErrors({});
      setTimeout(() => { setSuccessMsg(''); switchTab('login'); }, 1800);
    } else { setRApiErr(result.error); }
  };

  const ic = (err) => `lf-input${err ? ' has-error' : ''}`;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        .lr{min-height:100vh;display:flex;align-items:center;justify-content:center;background:#f0f2f5;padding:20px;font-family:'Sora',sans-serif;position:relative;overflow:hidden}
        .lr::before{content:'';position:fixed;inset:0;background:radial-gradient(ellipse 80% 60% at 20% 10%,rgba(59,130,246,.07) 0%,transparent 60%),radial-gradient(ellipse 60% 50% at 80% 90%,rgba(99,102,241,.06) 0%,transparent 55%),radial-gradient(ellipse 40% 40% at 60% 30%,rgba(16,185,129,.04) 0%,transparent 50%);pointer-events:none}
        .lr::after{content:'';position:fixed;inset:0;background-image:radial-gradient(circle,rgba(0,0,0,.06) 1px,transparent 1px);background-size:28px 28px;pointer-events:none}
        .lp{position:relative;z-index:1;width:100%;max-width:460px;opacity:0;transform:translateY(24px);transition:opacity .5s cubic-bezier(.22,1,.36,1),transform .5s cubic-bezier(.22,1,.36,1)}
        .lp.vis{opacity:1;transform:translateY(0)}
        .lb{display:flex;align-items:center;gap:14px;margin-bottom:26px;padding-left:2px;opacity:0;transform:translateY(10px);transition:opacity .5s .1s cubic-bezier(.22,1,.36,1),transform .5s .1s cubic-bezier(.22,1,.36,1)}
        .lp.vis .lb{opacity:1;transform:translateY(0)}
        .lb-icon{width:50px;height:50px;flex-shrink:0;background:linear-gradient(135deg,#2563eb 0%,#1d4ed8 100%);border-radius:14px;display:flex;align-items:center;justify-content:center;color:#fff;box-shadow:0 4px 14px rgba(37,99,235,.35)}
        .lb-name{font-size:22px;font-weight:700;color:#0f172a;letter-spacing:-.5px}
        .lb-name span{color:#2563eb}
        .lb-tag{font-size:11px;color:#94a3b8;margin-top:3px;text-transform:uppercase;letter-spacing:.06em}
        .lcard{background:#fff;border-radius:20px;box-shadow:0 1px 3px rgba(0,0,0,.04),0 8px 32px rgba(0,0,0,.08),0 0 0 1px rgba(0,0,0,.04);overflow:hidden;opacity:0;transform:translateY(12px);transition:opacity .5s .15s cubic-bezier(.22,1,.36,1),transform .5s .15s cubic-bezier(.22,1,.36,1)}
        .lp.vis .lcard{opacity:1;transform:translateY(0)}
        .laccent{height:3px;background:linear-gradient(90deg,#2563eb 0%,#6366f1 50%,#06b6d4 100%)}
        .ltabs{display:grid;grid-template-columns:1fr 1fr;background:#f8fafc;border-bottom:1px solid #e2e8f0}
        .ltab{padding:14px 0;text-align:center;font-size:13.5px;font-weight:600;font-family:'Sora',sans-serif;color:#94a3b8;cursor:pointer;background:none;border:none;border-bottom:2.5px solid transparent;transition:color .2s,border-color .2s,background .2s;letter-spacing:.01em}
        .ltab:hover:not(.active){color:#475569;background:#f1f5f9}
        .ltab.active{color:#2563eb;border-bottom-color:#2563eb;background:#fff}
        .lcbody{padding:30px 36px 32px}
        .lh1{font-size:19px;font-weight:700;color:#0f172a;letter-spacing:-.4px;margin-bottom:3px}
        .lsub{font-size:13px;color:#64748b;margin-bottom:22px}
        .lalert{display:flex;align-items:flex-start;gap:9px;border-radius:10px;padding:11px 14px;font-size:13px;margin-bottom:18px;animation:sdown .25s cubic-bezier(.22,1,.36,1)}
        .lalert svg{flex-shrink:0;margin-top:1px}
        .lalert.err{background:#fef2f2;border:1px solid #fecaca;border-left:3px solid #ef4444;color:#b91c1c}
        .lalert.ok{background:#f0fdf4;border:1px solid #bbf7d0;border-left:3px solid #22c55e;color:#15803d}
        @keyframes sdown{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}
        .lg{margin-bottom:16px}
        .llabel{display:block;font-size:12px;font-weight:600;color:#374151;margin-bottom:6px;letter-spacing:.04em;text-transform:uppercase}
        .liwrap{position:relative;display:flex;align-items:center}
        .liicon{position:absolute;left:13px;color:#94a3b8;display:flex;align-items:center;pointer-events:none;transition:color .2s}
        .liwrap:focus-within .liicon{color:#2563eb}
        .lf-input{width:100%;height:43px;background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:10px;padding:0 14px 0 40px;font-size:14px;font-family:'Sora',sans-serif;color:#0f172a;outline:none;transition:border-color .2s,box-shadow .2s,background .2s}
        .lf-input::placeholder{color:#cbd5e1}
        .lf-input:focus{border-color:#2563eb;background:#fff;box-shadow:0 0 0 3px rgba(37,99,235,.1)}
        .lf-input.has-error{border-color:#ef4444;background:#fef2f2}
        .lf-input.has-error:focus{box-shadow:0 0 0 3px rgba(239,68,68,.1)}
        .lf-input.wt{padding-right:44px}
        .lf-input.mono{font-family:'JetBrains Mono',monospace;letter-spacing:.05em}
        .ltoggle{position:absolute;right:12px;background:none;border:none;cursor:pointer;color:#94a3b8;display:flex;align-items:center;padding:4px;border-radius:6px;transition:color .2s,background .2s}
        .ltoggle:hover{color:#475569;background:#f1f5f9}
        .lroles{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px}
        .lrole{padding:9px 6px;border-radius:9px;cursor:pointer;border:1.5px solid #e2e8f0;background:#f8fafc;font-size:12.5px;font-weight:600;color:#64748b;font-family:'Sora',sans-serif;display:flex;align-items:center;justify-content:center;gap:5px;transition:all .15s}
        .lrole:hover{border-color:#93c5fd;color:#2563eb;background:#eff6ff}
        .lrole.sel{border-color:#2563eb;color:#2563eb;background:#eff6ff;box-shadow:0 0 0 2px rgba(37,99,235,.12)}
        .lsubmit{width:100%;height:46px;background:linear-gradient(135deg,#2563eb 0%,#1d4ed8 100%);border:none;border-radius:11px;color:#fff;font-size:14.5px;font-weight:600;font-family:'Sora',sans-serif;cursor:pointer;margin-top:22px;display:flex;align-items:center;justify-content:center;gap:8px;box-shadow:0 4px 14px rgba(37,99,235,.3);transition:transform .15s,box-shadow .15s,opacity .15s;position:relative;overflow:hidden}
        .lsubmit::before{content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(255,255,255,.12) 0%,transparent 60%);opacity:0;transition:opacity .2s}
        .lsubmit:hover:not(:disabled)::before{opacity:1}
        .lsubmit:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 6px 20px rgba(37,99,235,.38)}
        .lsubmit:active:not(:disabled){transform:translateY(0)}
        .lsubmit:disabled{opacity:.7;cursor:not-allowed}
        .lspin{width:17px;height:17px;border:2px solid rgba(255,255,255,.35);border-top-color:#fff;border-radius:50%;animation:spin .65s linear infinite}
        @keyframes spin{to{transform:rotate(360deg)}}
        .lfoot{margin-top:18px;text-align:center;font-size:12px;color:#94a3b8;opacity:0;transition:opacity .5s .3s}
        .lp.vis .lfoot{opacity:1}
        @media(max-width:480px){.lcbody{padding:24px 20px 26px}.lb-name{font-size:20px}}
      `}</style>

      <div className="lr">
        <div className={`lp${mounted ? ' vis' : ''}`}>

          {/* Brand */}
          <div className="lb">
            <div className="lb-icon"><HRMSIcon /></div>
            <div>
              <div className="lb-name">HRMS <span>Lite</span></div>
              <div className="lb-tag">Human Resource Management</div>
            </div>
          </div>

          {/* Card */}
          <div className="lcard">
            <div className="laccent" />

            {/* Tab switcher */}
            <div className="ltabs">
              <button className={`ltab${tab === 'login' ? ' active' : ''}`} onClick={() => switchTab('login')}>Sign In</button>
              <button className={`ltab${tab === 'register' ? ' active' : ''}`} onClick={() => switchTab('register')}>Create Account</button>
            </div>

            <div className="lcbody">
              {tab === 'login' ? (
                <>
                  <h1 className="lh1">Welcome back</h1>
                  <p className="lsub">Sign in to your account to continue</p>

                  {lApiErr && (
                    <div className="lalert err">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                      {lApiErr}
                    </div>
                  )}
                  {successMsg && (
                    <div className="lalert ok">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                      {successMsg}
                    </div>
                  )}

                  <form onSubmit={handleLogin} noValidate>
                    <div className="lg">
                      <label className="llabel" htmlFor="lu">Username</label>
                      <div className="liwrap">
                        <span className="liicon"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></span>
                        <input ref={firstRef} id="lu" name="username" type="text" autoComplete="username" value={lForm.username} onChange={lChange} placeholder="Enter your username" className={ic(lErrors.username)} />
                      </div>
                      <FieldErr msg={lErrors.username} />
                    </div>

                    <div className="lg">
                      <label className="llabel" htmlFor="lp">Password</label>
                      <div className="liwrap">
                        <span className="liicon"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></span>
                        <input id="lp" name="password" type={showLPwd ? 'text' : 'password'} autoComplete="current-password" value={lForm.password} onChange={lChange} placeholder="Enter your password" className={`${ic(lErrors.password)} wt${lForm.password ? ' mono' : ''}`} />
                        <button type="button" className="ltoggle" tabIndex={-1} onClick={() => setShowLPwd(v => !v)}>{showLPwd ? <EyeClosed /> : <EyeOpen />}</button>
                      </div>
                      <FieldErr msg={lErrors.password} />
                    </div>

                    <button type="submit" className="lsubmit" disabled={lLoading}>
                      {lLoading ? <><div className="lspin" />Signing in…</> : <>Sign In <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg></>}
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <h1 className="lh1">Create an account</h1>
                  <p className="lsub">Fill in the details below to get started</p>

                  {rApiErr && (
                    <div className="lalert err">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                      {rApiErr}
                    </div>
                  )}

                  <form onSubmit={handleRegister} noValidate>
                    {/* Username */}
                    <div className="lg">
                      <label className="llabel" htmlFor="ru">Username</label>
                      <div className="liwrap">
                        <span className="liicon"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></span>
                        <input ref={firstRef} id="ru" name="username" type="text" autoComplete="username" value={rForm.username} onChange={rChange} placeholder="e.g. john_doe" className={ic(rErrors.username)} />
                      </div>
                      <FieldErr msg={rErrors.username} />
                    </div>

                    {/* Email */}
                    <div className="lg">
                      <label className="llabel" htmlFor="re">Email Address</label>
                      <div className="liwrap">
                        <span className="liicon"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg></span>
                        <input id="re" name="email" type="email" autoComplete="email" value={rForm.email} onChange={rChange} placeholder="e.g. john@company.com" className={ic(rErrors.email)} />
                      </div>
                      <FieldErr msg={rErrors.email} />
                    </div>

                    {/* Password */}
                    <div className="lg">
                      <label className="llabel" htmlFor="rp">Password</label>
                      <div className="liwrap">
                        <span className="liicon"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></span>
                        <input id="rp" name="password" type={showRPwd ? 'text' : 'password'} autoComplete="new-password" value={rForm.password} onChange={rChange} placeholder="Min 8 chars, 1 uppercase, 1 number" className={`${ic(rErrors.password)} wt${rForm.password ? ' mono' : ''}`} />
                        <button type="button" className="ltoggle" tabIndex={-1} onClick={() => setShowRPwd(v => !v)}>{showRPwd ? <EyeClosed /> : <EyeOpen />}</button>
                      </div>
                      {rForm.password && <PwdStrength pwd={rForm.password} />}
                      <FieldErr msg={rErrors.password} />
                    </div>

                    {/* Confirm Password */}
                    <div className="lg">
                      <label className="llabel" htmlFor="rc">Confirm Password</label>
                      <div className="liwrap">
                        <span className="liicon"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></span>
                        <input id="rc" name="confirmPassword" type={showRCfm ? 'text' : 'password'} autoComplete="new-password" value={rForm.confirmPassword} onChange={rChange} placeholder="Re-enter your password" className={`${ic(rErrors.confirmPassword)} wt${rForm.confirmPassword ? ' mono' : ''}`} />
                        <button type="button" className="ltoggle" tabIndex={-1} onClick={() => setShowRCfm(v => !v)}>{showRCfm ? <EyeClosed /> : <EyeOpen />}</button>
                      </div>
                      <FieldErr msg={rErrors.confirmPassword} />
                    </div>

                    {/* Role */}
                    <div className="lg" style={{ marginBottom:0 }}>
                      <label className="llabel">Role</label>
                      <div className="lroles">
                        {[{v:'staff',l:'Staff',i:'👤'},{v:'manager',l:'Manager',i:'🗂️'},{v:'admin',l:'Admin',i:'⚡'}].map(r => (
                          <button key={r.v} type="button" className={`lrole${rForm.role===r.v?' sel':''}`} onClick={() => setRForm(f => ({ ...f, role: r.v }))}>
                            <span>{r.i}</span>{r.l}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button type="submit" className="lsubmit" disabled={rLoading}>
                      {rLoading ? <><div className="lspin" />Creating account…</> : <>Create Account <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg></>}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>

          <div className="lfoot">HRMS Lite © {new Date().getFullYear()} — Secure access portal</div>
        </div>
      </div>
    </>
  );
}

