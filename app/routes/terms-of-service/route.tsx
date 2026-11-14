import type { MetaFunction } from '@remix-run/node';
import { Link } from '@remix-run/react';
import LegalPage, { LEGAL_CONTACT_EMAIL } from '~/components/LegalPage';

export const meta: MetaFunction = () => [
  { title: 'Terms of service — The Foodiedex' },
  { name: 'description', content: 'The terms for using The Foodiedex.' },
];

export default function TermsPage() {
  const mail = <a href={`mailto:${LEGAL_CONTACT_EMAIL}`}>{LEGAL_CONTACT_EMAIL}</a>;

  return (
    <LegalPage title="Terms of service">
      <p>
        These terms apply when you use The Foodiedex (&ldquo;we&rdquo;, &ldquo;us&rdquo;), a personal list of restaurants
        you have been to or want to try. By creating an account or using the app, you agree to them. If you do not
        agree, please do not use the app.
      </p>

      <h2>Your account</h2>
      <ul>
        <li>You must be at least 13 years old to use The Foodiedex.</li>
        <li>Give accurate sign-up details and keep your password to yourself. You are responsible for what happens under your account.</li>
        <li>Tell us at {mail} if you think someone else has access to your account.</li>
      </ul>

      <h2>Your content</h2>
      <p>
        Your lists, notes, ratings and photos stay yours. You give us permission to store them, process them and show
        them to you and to the people you share them with, only so the app can work. That permission ends when you
        delete the content or your account.
      </p>
      <p>
        Only add photos and text you have the right to share. You are responsible for what you post, including in lists
        you share with others or through a public link.
      </p>

      <h2>Sharing</h2>
      <p>
        When you invite people to a list, they can see it and, if you allow it, change it. A public share link lets
        anyone who has it view a read-only copy of the list and save their own copy. You can turn a link off at any
        time, but copies people already saved remain theirs.
      </p>

      <h2>Acceptable use</h2>
      <p>Please do not:</p>
      <ul>
        <li>post anything unlawful, hateful, harassing, or that infringes someone else&rsquo;s rights;</li>
        <li>try to access other people&rsquo;s accounts or lists without permission;</li>
        <li>overload, scrape, probe or otherwise interfere with the app or the services it relies on;</li>
        <li>use the app to send spam or to collect information about other people.</li>
      </ul>

      <h2>Information about places</h2>
      <p>
        Details about a place, such as its photo, cuisine, address, price, distinctions and booking link, may be filled
        in automatically from the place&rsquo;s own website and from OpenStreetMap. They can be wrong or out of date, so
        check with the restaurant before you rely on them. Ratings and notes are the opinions of the people who wrote
        them.
      </p>
      <p>
        Booking, website and map links take you to other services. We do not control them, and their own terms apply
        there.
      </p>

      <h2>The service</h2>
      <p>
        We provide The Foodiedex free of charge, &ldquo;as is&rdquo; and &ldquo;as available&rdquo;. We may change,
        pause or stop any part of it. We will try to give notice before removing a feature you rely on, and to let you
        export or keep your information if we ever shut the service down.
      </p>

      <h2>Ending your use</h2>
      <p>
        You can stop using the app and ask us to delete your account at any time by emailing {mail}. We may suspend or
        close an account that breaks these terms or puts the service or other people at risk.
      </p>

      <h2>Liability</h2>
      <p>
        To the extent the law allows, we give no warranties about the app, and we are not liable for indirect or
        consequential losses, or for losses caused by information about a place, by other users, or by third-party
        services. Nothing in these terms limits rights you have under consumer protection law that cannot be waived.
      </p>

      <h2>Changes to these terms</h2>
      <p>
        If we change these terms, we will update the date at the top of this page. If a change is significant, we will
        tell you in the app or by email before it applies. Continuing to use the app after that means you accept the
        new terms.
      </p>

      <h2>Governing law</h2>
      <p>
        These terms are governed by the laws of the Province of Ontario and the federal laws of Canada that apply
        there.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about these terms: {mail}. How we handle your information is described in our{' '}
        <Link to="/privacy">privacy policy</Link>.
      </p>
    </LegalPage>
  );
}
