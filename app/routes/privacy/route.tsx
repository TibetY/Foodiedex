import type { MetaFunction } from '@remix-run/node';
import { Link } from '@remix-run/react';
import LegalPage, { LEGAL_CONTACT_EMAIL } from '~/components/LegalPage';

export const meta: MetaFunction = () => [
  { title: 'Privacy policy — The Foodiedex' },
  { name: 'description', content: 'What The Foodiedex collects, why, who it is shared with, and how to delete it.' },
];

export default function PrivacyPage() {
  const mail = <a href={`mailto:${LEGAL_CONTACT_EMAIL}`}>{LEGAL_CONTACT_EMAIL}</a>;

  return (
    <LegalPage title="Privacy policy">
      <p>
        The Foodiedex (&ldquo;we&rdquo;, &ldquo;us&rdquo;) is a personal list of restaurants you have been to or want to
        try. This policy explains what we collect when you use it, why, who it is shared with, and how to have it
        deleted. We do not sell your information, show ads, or use analytics or tracking tools.
      </p>

      <h2>What we collect</h2>
      <p>
        <strong>Your account.</strong> Your email address and a password, or, if you continue with Google, the name,
        email address and profile picture Google shares with us. Passwords are handled by our sign-in provider and are
        never visible to us.
      </p>
      <p>
        <strong>Your profile.</strong> The display name and profile photo you choose.
      </p>
      <p>
        <strong>What you add.</strong> Your lists and the places on them: names, addresses, websites, booking links,
        cuisine and tags, ratings, notes, visit counts, favourites, photos, saved filter views, and who you have invited
        to a list.
      </p>
      <p>
        <strong>Your location, only when you ask.</strong> If you tap &ldquo;Add a place near me&rdquo;, your browser
        asks your permission, and your approximate coordinates are used once to find places nearby. We do not store
        your location.
      </p>
      <p>
        <strong>Technical data.</strong> Our hosting provider keeps standard server logs, such as IP address, browser
        type and the pages requested, to run and protect the service.
      </p>

      <h2>Cookies and local storage</h2>
      <p>We use only what the app needs to work:</p>
      <ul>
        <li>Sign-in cookies, which keep you signed in.</li>
        <li>Two preference cookies, which remember your light or dark theme and accent colour. The same choices are also saved in your browser&rsquo;s local storage.</li>
      </ul>
      <p>We use no advertising, analytics or cross-site tracking cookies.</p>

      <h2>How we use it</h2>
      <ul>
        <li>To run your account and show you your lists.</li>
        <li>To fill in a place&rsquo;s details for you: its photo, cuisine, address and booking link.</li>
        <li>To show places on a map and find places near you.</li>
        <li>To send sign-in and password-reset emails.</li>
        <li>To keep the service secure and working.</li>
      </ul>

      <h2>Who can see your information</h2>
      <ul>
        <li>
          <strong>People you share a list with</strong> see that list, its places, and the ratings and notes members
          leave on it, along with members&rsquo; display names and profile photos.
        </li>
        <li>
          <strong>Anyone with a public share link</strong> can view a read-only copy of that list and the list
          owner&rsquo;s display name, without an account. You can turn a link off at any time.
        </li>
        <li>
          <strong>Photos</strong> are stored at addresses that are not listed anywhere but can be opened by anyone who
          has the exact link.
        </li>
      </ul>

      <h2>Services we rely on</h2>
      <p>These providers process information for us, only to run the parts of the app named:</p>
      <ul>
        <li><strong>Supabase</strong>: accounts and sign-in, the database, and photo storage.</li>
        <li><strong>Netlify</strong>: hosting the website and its server.</li>
        <li><strong>Google</strong>: &ldquo;Continue with Google&rdquo; sign-in, and the web font, which your browser downloads from Google&rsquo;s servers.</li>
        <li>
          <strong>OpenStreetMap services</strong> (Nominatim, Photon by Komoot, the Overpass API, and the OpenStreetMap
          map tiles): place search, addresses, nearby places and the map. They receive your search text, addresses or
          location, and your browser loads map images from them.
        </li>
      </ul>
      <p>
        When you add a place&rsquo;s website, our server visits that website to read its public details and photo. The
        restaurant&rsquo;s site sees our server, not you. Booking and website links open the third party&rsquo;s own
        site, which has its own privacy policy.
      </p>
      <p>
        Our providers may store information outside your country, including in the United States, where it may be
        accessible to authorities under local law.
      </p>

      <h2>How long we keep it</h2>
      <p>
        We keep your information for as long as you have an account. You can delete places, lists and photos in the
        app at any time. To delete your account and everything in it, email us at {mail} from the address on your
        account, and we will delete it within 30 days. Copies in backups are removed as those backups expire.
      </p>

      <h2>Your rights</h2>
      <p>
        You can ask to see the personal information we hold about you, to correct it, or to delete it, and you can
        withdraw your consent at any time by deleting your account. Email {mail}. If you are not satisfied with our
        answer, you can complain to the Office of the Privacy Commissioner of Canada.
      </p>

      <h2>Children</h2>
      <p>The Foodiedex is not meant for children under 13, and we do not knowingly collect their information.</p>

      <h2>Changes</h2>
      <p>
        If we change this policy, we will update the date at the top of this page. If a change is significant, we will
        tell you in the app or by email before it applies.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about this policy or your information: {mail}. See also our{' '}
        <Link to="/terms-of-service">terms of service</Link>.
      </p>
    </LegalPage>
  );
}
