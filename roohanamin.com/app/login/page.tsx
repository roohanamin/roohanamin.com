import { Brand } from "@/components/brand";
import { LoginForm } from "@/components/login-form";
import { InstallHelp } from "@/components/pwa";
import { isConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
export const dynamic = "force-dynamic";
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ expired?: string }>;
}) {
  const configured = isConfigured();
  if (configured) {
    const client = await createClient();
    const {
      data: { user },
    } = await client.auth.getUser();
    if (user) redirect("/weight");
  }
  const { expired } = await searchParams;
  return (
    <div className="site-shell">
      <header className="site-header">
        <Brand />
        <span className="header-note">
          A little consistency goes a long way.
        </span>
      </header>
      <main id="main" className="login-layout">
        <section className="login-intro">
          <p className="eyebrow">
            <span className="dot" /> YOUR DAILY CHECK-IN
          </p>
          <h1>
            Small steps.
            <br />
            <span>A clearer picture.</span>
          </h1>
          <p className="intro-copy">
            A simple place to track your weight.
            <br />
            Just you, your progress, and one day at a time.
          </p>
          <div className="illustration" aria-hidden="true">
            <div className="illustration-head">
              <span>A little, every day</span>
              <span>↗</span>
            </div>
            <svg viewBox="0 0 440 125" fill="none">
              <path
                d="M0 100 Q30 100 48 79 T96 77 T144 55 T192 59 T240 39 T288 43 T336 20 T384 24 T440 6"
                stroke="#52654d"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <path
                d="M0 124H440M0 84H440M0 44H440"
                stroke="#d8ddd0"
                strokeDasharray="3 7"
              />
            </svg>
            <div className="illustration-foot">
              <span>YOUR PACE</span>
              <span>YOUR PROGRESS</span>
            </div>
          </div>
          <div className="feature-tags">
            <span>◎ Private to you</span>
            <span>↗ Made for your phone</span>
          </div>
        </section>
        <section className="card login-card">
          <span className="card-kicker">WELCOME TO WEIGHT LOG</span>
          <h2>A fresh check-in.</h2>
          <p>Sign in to your own little corner.</p>
          {expired && (
            <p role="alert" className="error">
              That link expired or was opened in another browser. Request a
              fresh link below.
            </p>
          )}
          <LoginForm configured={configured} />
          <InstallHelp />
        </section>
      </main>
      <footer className="site-footer">
        <span>Less noise. More perspective.</span>
        <span>roohanamin.com</span>
      </footer>
    </div>
  );
}
