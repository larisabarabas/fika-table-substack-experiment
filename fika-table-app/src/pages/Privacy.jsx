import { Link, useNavigate } from 'react-router-dom';
import { CONFIG } from '../config';
import styles from './Privacy.module.css';

export default function Privacy() {
  const navigate = useNavigate();

  const handleBack = (e) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    if (window.history.state?.idx > 0) navigate(-1);
    else navigate('/');
  };

  return (
    <div className={styles.page}>
      <div className={styles.wrap}>
        <Link to="/" className={styles.back} onClick={handleBack}>&larr; take me back</Link>
        <h1 className={styles.title}>Privacy Policy</h1>
        <p className={styles.updated}>Last updated: October 2026</p>

        <section>
          <h2>What this is</h2>
          <p>
            This is a small, community-focused app for leaving appreciative notes
            on a virtual cake. It&rsquo;s made for readers and writers of{' '}
            <a href={CONFIG.newsletterURL} target="_blank" rel="noopener noreferrer">{CONFIG.newsletter}</a>.
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
          <h2>Looking people up on Substack</h2>
          <p>
            When you type who a kind word is for, our server looks that name or
            @handle up on Substack&rsquo;s public pages, so we can show you who it
            matches and link to their profile. The text you typed is sent to
            Substack for this. We do not store the result beyond the handle you
            confirm.
          </p>
          <p>
            If you choose to tell someone on Substack, the Note is copied to your
            clipboard and Substack Notes opens in a new tab. We do not post
            anything for you.
          </p>
        </section>

        <section>
          <h2>Changing or deleting your kind word</h2>
          <p>
            There are no accounts, so we can&rsquo;t tell who gave a kind word.
            Instead, when you give one, your browser saves a private edit key in
            its local storage (this is not a cookie). That key is what lets
            you change or delete it.
          </p>
          <ul>
            <li>
              <strong>Delete</strong> it any time. Find your slice on the wall (it
              says &ldquo;Yours&rdquo;), open it and choose &ldquo;Edit or delete
              your kind word&rdquo;. Deleting also puts its slice back on the cake.
            </li>
            <li>
              <strong>Change</strong> the message, your signature and the icing
              color for 24 hours after you give it. Who it&rsquo;s for can&rsquo;t
              be changed. Delete it and write a new one instead.
            </li>
          </ul>
          <p>
            The key works only in the browser that gave the kind word. If you
            clear this site&rsquo;s data or switch browser or device, you can no
            longer change or delete it yourself. Email us and we&rsquo;ll remove it.
          </p>
          <p>
            We never store the key itself, only a one-way hash of it. A hash can
            check a key but can&rsquo;t be turned back into one, so we can&rsquo;t
            read it or give it back to you. A Note you already posted on Substack keeps the
            old words, because Substack holds that copy.
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
            <li>No cookies from the app itself. The edit key above is the only thing it saves in your browser.</li>
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
            ends, until you or we delete them. You can delete your own any time,
            as described above. If you can&rsquo;t (you cleared your browser data,
            or you gave it before deleting was possible), please{' '}
            <a href={`mailto:${CONFIG.supportEmail}`}>email us</a> and we&rsquo;ll remove it.
          </p>
        </section>

        <section>
          <h2>Your rights (GDPR)</h2>
          <p>
            If you are in the EU, you have the right to access, correct, or
            delete any personal data associated with your messages. You can
            correct or delete a kind word yourself in the browser that gave it.
            Since the app has no user accounts, most data is effectively
            anonymous. If you included identifying information in a message and
            want it removed or changed, contact us with the details and
            we&rsquo;ll handle it.
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
        <Link to="/" className={styles.back} onClick={handleBack}>&larr; take me back</Link>
      </footer>
    </div>
  );
}
