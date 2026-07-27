import { Link } from 'react-router-dom';
import { CONFIG } from '../config';
import styles from './Privacy.module.css';

export default function Privacy() {
  return (
    <div className={styles.page}>
      <div className={styles.wrap}>
        <Link to="/" className={styles.back}>&larr; back to the table</Link>
        <h1 className={styles.title}>Privacy Policy</h1>
        <p className={styles.updated}>Last updated: June 2026</p>

        <section>
          <h2>What this is</h2>
          <p>
            This is a small, community-focused app for leaving appreciative notes
            on a virtual cake. It&rsquo;s made for readers and writers of{' '}
            <a href={CONFIG.substackUrl} target="_blank" rel="noopener noreferrer">{CONFIG.newsletter}</a>.
            This page explains what data is collected, why, and what control you have over it.
          </p>
        </section>

        <section>
          <h2>Data you choose to share</h2>
          <p>
            When you submit a slice on the cake, you voluntarily provide:
          </p>
          <ul>
            <li><strong>Your message</strong> &mdash; the kind word you write (2&ndash;1000 characters)</li>
            <li><strong>Your name</strong> &mdash; an optional signature or pseudonym</li>
            <li><strong>A recipient name</strong> &mdash; who the message is for (a person or @handle)</li>
            <li><strong>A recipient type</strong> &mdash; a category like &ldquo;for a writer&rdquo; or &ldquo;left on the table&rdquo;</li>
          </ul>
          <p>
            All of this is stored in our database and displayed publicly on the
            cake and appreciation wall. <strong>Do not share sensitive personal
            information.</strong>
          </p>
        </section>

        <section>
          <h2>Data we collect automatically</h2>
          <p>
            We use <strong>Vercel Analytics</strong> to see basic page-view
            statistics (page views, referrer, browser type, and country-level
            location). This is cookieless and does not identify you personally.
          </p>
          <p>
            The app also loads fonts from <strong>Google Fonts</strong>.
            Your browser sends your IP address to Google when fetching these
            fonts, which is standard for web font loading.
          </p>
        </section>

        <section>
          <h2>What we do not collect</h2>
          <ul>
            <li>No accounts, logins, or passwords</li>
            <li>No email addresses</li>
            <li>No cookies from the app itself</li>
            <li>No IP logging or fingerprinting</li>
            <li>No tracking across other websites</li>
          </ul>
        </section>

        <section>
          <h2>Where your data lives</h2>
          <p>
            Messages are stored in <strong>Supabase</strong> (a hosted
            PostgreSQL database). Supabase is GDPR-compliant and stores data
            in US/EU regions. We do not export, sell, or share this data with
            anyone.
          </p>
        </section>

        <section>
          <h2>How long we keep it</h2>
          <p>
            Messages stay visible on the cake during the current round, and
            remain accessible in the appreciation wall even after the round
            ends. If you want a specific message removed, please reach out{' '}
            <a href={`mailto:${CONFIG.supportEmail}`}>here</a>.
          </p>
        </section>

        <section>
          <h2>Your rights (GDPR)</h2>
          <p>
            If you are in the EU, you have the right to access, correct, or
            delete any personal data associated with your messages. Since the
            app has no user accounts, most data is effectively anonymous. If
            you included identifying information in a message and want it
            removed, contact us with the details and we&rsquo;ll handle it.
          </p>
        </section>

        <section>
          <h2>Contact</h2>
          <p>
            Questions about this policy? Reach out via email{' '}
            <a href={`mailto:${CONFIG.supportEmail}`}>{CONFIG.supportEmail}</a>.
          </p>
        </section>
      </div>

      <footer className={styles.footer}>
        <Link to="/" className={styles.back}>&larr; back to the table</Link>
      </footer>
    </div>
  );
}
