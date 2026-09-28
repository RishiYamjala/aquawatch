import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import CustomersDashboard from "@/pages/CustomersDashboard";
import { startLogin } from "@/const";
import { ArrowLeft, ArrowRight, Droplet, LockKeyhole, ShieldCheck } from "lucide-react";
import { Link } from "wouter";

export default function AdminLogin() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="admin-auth-loading" role="status" aria-live="polite">
        <span className="admin-card-icon"><LockKeyhole size={20} /></span>
        <p>Checking administrator access…</p>
      </div>
    );
  }

  if (user?.role === "admin") return <CustomersDashboard />;

  if (user) {
    return (
      <div className="app-shell admin-shell">
        <header className="site-header admin-header">
          <Link href="/" className="brand" aria-label="AquaWatch home">
            <span className="brand-mark"><Droplet size={20} strokeWidth={2.5} /></span>
            <span>Aqua<span className="brand-accent">Watch</span></span>
          </Link>
          <Link href="/" className="admin-back-link"><ArrowLeft size={15} /> Back to AquaWatch</Link>
        </header>
        <main className="admin-access-denied">
          <div className="admin-card-icon"><ShieldCheck size={20} /></div>
          <span className="admin-form-eyebrow">RESTRICTED AREA</span>
          <h1>Administrator access required</h1>
          <p>This signed-in account is not authorized to view customer records. If you need access, contact the AquaWatch site owner.</p>
          <Link href="/" className="admin-home-link">Return to the public site</Link>
        </main>
      </div>
    );
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
          <p>Review customer contact details and account status in one private, role-protected workspace.</p>
          <div className="admin-trust-note"><ShieldCheck size={17} /><span>Only authorized AquaWatch administrators can view this page</span></div>
          <div className="admin-watermark" aria-hidden="true"><Droplet size={178} strokeWidth={0.7} /></div>
        </section>

        <section className="admin-card" aria-labelledby="signin-title">
          <div className="admin-card-icon"><LockKeyhole size={20} /></div>
          <span className="admin-form-eyebrow">SECURE AREA</span>
          <h2 id="signin-title">Administrator sign in</h2>
          <p className="admin-form-intro">Continue with your authorized AquaWatch account. Access is checked securely by the server.</p>
          <Button className="admin-submit" onClick={() => startLogin("/admin")}>
            Continue with secure sign-in <ArrowRight size={17} />
          </Button>
          <div className="admin-setup-note" role="note">
            <LockKeyhole size={15} />
            <p>This page does not accept or store a separate shared password. Only accounts with the administrator role can open the customer directory.</p>
          </div>
          <Link href="/" className="admin-home-link">Return to the public site</Link>
        </section>
      </main>
    </div>
  );
}
