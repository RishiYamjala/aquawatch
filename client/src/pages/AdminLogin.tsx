import { useState, type FormEvent } from "react";
import { Link } from "wouter";
import { ArrowLeft, ArrowRight, Droplet, Eye, EyeOff, LockKeyhole, ShieldCheck } from "lucide-react";

export default function AdminLogin() {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [notice, setNotice] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("Authentication is not connected yet. Your ID and password were not sent or saved.");
  }

  return (
    <div className="app-shell admin-shell">
      <header className="site-header admin-header">
        <Link href="/" className="brand" aria-label="AquaWatch home">
          <span className="brand-mark"><Droplet size={20} strokeWidth={2.5} /></span>
          <span>Aqua<span className="brand-accent">Watch</span></span>
        </Link>
        <Link href="/" className="admin-back-link"><ArrowLeft size={15} /> Back to AquaWatch</Link>
      </header>

      <main className="admin-main page-width">
        <section className="admin-intro" aria-labelledby="admin-title">
          <span className="admin-eyebrow"><span className="live-dot" /> AQUAWATCH · ADMINISTRATION</span>
          <h1 id="admin-title">A calmer view<br />for the people<br /><em>behind the signal.</em></h1>
          <p>Sign in to the administration area to review community activity and keep local water updates clear and useful.</p>
          <div className="admin-trust-note"><ShieldCheck size={17} /><span>Protected access for authorized administrators</span></div>
          <div className="admin-watermark" aria-hidden="true"><Droplet size={178} strokeWidth={0.7} /></div>
        </section>

        <section className="admin-card" aria-labelledby="signin-title">
          <div className="admin-card-icon"><LockKeyhole size={20} /></div>
          <span className="admin-form-eyebrow">SECURE AREA</span>
          <h2 id="signin-title">Administrator sign in</h2>
          <p className="admin-form-intro">Enter your administrator ID and password to continue.</p>

          <form className="admin-form" onSubmit={handleSubmit}>
            <label htmlFor="admin-id">Administrator ID</label>
            <input id="admin-id" name="adminId" type="text" autoComplete="username" placeholder="Enter your ID" required />

            <label htmlFor="admin-password">Password</label>
            <div className="admin-password-field">
              <input id="admin-password" name="password" type={passwordVisible ? "text" : "password"} autoComplete="current-password" placeholder="Enter your password" required />
              <button className="password-visibility" type="button" onClick={() => setPasswordVisible((visible) => !visible)} aria-label={passwordVisible ? "Hide password" : "Show password"} aria-pressed={passwordVisible}>
                {passwordVisible ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>

            <button className="admin-submit" type="submit">Continue to admin <ArrowRight size={17} /></button>
          </form>

          <div className="admin-setup-note" role="note">
            <LockKeyhole size={15} />
            <p>This login page is a frontend preview. Authentication has not been configured; form values are not transmitted or stored.</p>
          </div>
          {notice && <p className="admin-notice" role="status">{notice}</p>}
          <Link href="/" className="admin-home-link">Return to the public site</Link>
        </section>
      </main>
    </div>
  );
}
