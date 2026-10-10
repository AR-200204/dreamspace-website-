import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";
import { SITE } from "@/lib/config";

export const metadata: Metadata = { title: "Privacy Policy" };

// Plain-language policy. Have a lawyer review it, and update the list of services you actually use.
export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy">
      <p>
        Dreams are personal, so we try to collect as little as possible and be clear about what we do with it. This page explains it in plain language.
      </p>

      <section>
        <h2>What we collect</h2>
        <ul>
          <li>Account details: your email address, username and password (stored as a secure hash, never in plain text). Optional: bio and profile photo.</li>
          <li>What you create: dreams (title, story, mood, tags, date, optional image), comments, reactions, follows, saved dreams, blocks and reports you send.</li>
          <li>Basic technical data our hosts record to run the service, such as IP address and browser type, in server logs.</li>
          <li>If you use Google login, your Google account email and name are shared with us by Google.</li>
        </ul>
      </section>

      <section>
        <h2>Who can see your dreams</h2>
        <ul>
          <li><strong className="text-moon">Public:</strong> shown with your username and on your profile.</li>
          <li><strong className="text-moon">Anonymous:</strong> shown as &ldquo;Anonymous Dreamer&rdquo;. Other users cannot see your username. Our administrators can see who posted, for moderation and safety.</li>
          <li><strong className="text-moon">Private:</strong> visible only to you.</li>
        </ul>
        <p>Public and anonymous dreams can be found by search engines and shared by link. Deleting a dream removes it from {SITE.name}, but copies already shared elsewhere or cached by search engines may remain for a while.</p>
        <p>Your dream streak and the dreams you saved or reacted to are private to you.</p>
      </section>

      <section>
        <h2>Services we use to run {SITE.name}</h2>
        <ul>
          <li>Supabase: database, login and image storage.</li>
          <li>Vercel: website hosting.</li>
          <li>Cloudflare Turnstile (if switched on): checks that sign-ups come from people, not bots.</li>
          <li>An email service: sends confirmation and password-reset emails.</li>
          <li>An AI provider (only if the AI feature is switched on): when someone asks for possible meanings, the text of that <em>shared</em> dream and any question they type are sent to the provider to generate a reply. Private dreams are never sent.</li>
        </ul>
        <p>We do not sell your data and we do not show ads.</p>
      </section>

      <section>
        <h2>Cookies</h2>
        <p>We use only essential cookies that keep you logged in. We don&apos;t use advertising cookies.</p>
      </section>

      <section>
        <h2>Keeping and deleting data</h2>
        <p>
          We keep your data while your account exists. You can edit or delete any dream or comment, and you can delete your whole account in
          Settings, which permanently removes your profile, dreams, comments, reactions and related data. Routine backups kept by our hosting
          provider may hold copies for a limited time afterwards.
        </p>
      </section>

      <section>
        <h2>Your choices and rights</h2>
        <p>
          You can view and change your information in the app. Depending on where you live, you may have extra rights, such as asking for a copy of
          your data or its deletion. Contact us using the details below and we will help.
        </p>
      </section>

      <section>
        <h2>Children</h2>
        <p>{SITE.name} is not meant for children under 13. If you believe a child has created an account, please contact us and we will remove it.</p>
      </section>

      <section>
        <h2>Security</h2>
        <p>We use reasonable measures to protect your data, such as encrypted connections and strict database access rules, but no online service can promise perfect security.</p>
      </section>

      <section>
        <h2>Changes</h2>
        <p>If we change this policy in an important way, we will tell you on the site.</p>
      </section>
    </LegalPage>
  );
}
