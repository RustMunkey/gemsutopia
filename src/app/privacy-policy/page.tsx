import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Fixed Background */}
      <div 
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: "url('/images/whitemarble.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat"
        }}
      />
      
      <Header />
      
      <div className="flex-grow py-16 relative z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-lg">
            <div className="text-center mb-12">
              <h1 className="text-3xl md:text-4xl font-bold text-black mb-4">Privacy Policy</h1>
              <p className="text-lg text-neutral-600">Last updated: January 2025</p>
            </div>
            
            <div className="prose prose-lg max-w-none text-neutral-700 space-y-8">
              <p className="text-lg mb-6">
                This Privacy Policy describes how and when Gemsutopia (&quot;I&quot;, &quot;me&quot;, &quot;my&quot;) collects, uses, and shares information when you purchase an item from Gemsutopia (Gemsutopia.ca) contact me, or otherwise use my services through this site.
              </p>
              
              <p className="mb-6">
                You agree that by purchasing an item from Gemsutopia or otherwise interacting with Gemsutopia, you have read, understood, and agree to be bound by all of the terms of this Privacy Policy. If you do not agree, you must leave Gemsutopia immediately.
              </p>
              
              <p className="mb-6">
                I may change this Privacy Policy from time to time. If I make changes, I will notify you by revising the date at the top of the page.
              </p>
              
              <p className="mb-6">
                This Privacy Policy does not apply to the practices of third parties that I do not own or control through Gemsutopia such as Gemrockauctions or Etsy.
              </p>
              
              <p className="mb-8">
                Additionally, I will make every reasonable effort to inform you when I interact with third parties with your information; however, you are solely responsible for reviewing, understanding, and agreeing to or not agreeing to any third-party privacy policies.
              </p>

            <section>
              <h2 className="text-2xl font-bold text-black mb-4">Information I Collect</h2>
              <p>
                To fulfill your order, you must provide me with certain information such as your name, e-mail address, postal address, payment information, and the details of the product that you&apos;re ordering. You may also choose to provide me with additional personal information from time to time if you contact me directly.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mb-4">Why I Need Your Information and How I Use It</h2>
              <p className="mb-4">I collect, use and share your information in several legally-permissible ways, including:</p>
              <ul className="list-disc ml-6 space-y-2">
                <li>As needed to provide my services, such as when I use your information to fulfill your order, to settle disputes, or to provide you with customer support;</li>
                <li>When you have provided your affirmative consent, which you may revoke at any time, such as by signing up for my mailing list or to receive notifications from me;</li>
                <li>If necessary to comply with a court order or legal obligation, such as retaining information about your purchases if required by tax law; and</li>
                <li>As necessary for my own legitimate interests, if those legitimate interests are not overridden by your rights or interests, such as (a) providing and enhancing my services;</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mb-4">Information Sharing and Disclosure</h2>
              <p className="mb-4">
                Protecting my customers&apos; personal information is crucially important to my business and something I take very seriously. For these reasons, I share your personal information only for very limited reasons and in limited circumstances, as follows:
              </p>
              <ul className="list-disc ml-6 space-y-4">
                <li>
                  <strong>With Third-Party Service Providers.</strong> I engage the following trusted third parties to perform functions and provider services to my shop:
                  <br /><br />
                  I share you personal information with these third parties, but only to the extent necessary to perform these services;
                </li>
                <li>
                  <strong>In the Event of a Business Transfer.</strong> If I sell or merge my business, I may disclose your information as part of that transaction, only to the extent permitted by law.
                </li>
                <li>
                  <strong>In Compliance with Laws.</strong> I may collect, use, retain, and share your information if I have a good faith belief that doing so is reasonably necessary to: (a) respond to legal process or to government requests; (b) perform legal obligations to which I am bound by agreements; (c) prevent, investigate, and address fraud and other illegal activity, security, or technical issues; or (d) protect the rights, property, and safety of my customers, or others.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mb-4">How Long I Store Your Information</h2>
              <p>
                I retain your personal information only for as long as necessary to provide you with my services and as otherwise described in my Privacy Policy. However, I may also be required to retain this information to comply with my legal and regulatory obligations, to resolve disputes, and to enforce or perform under my agreements. I generally keep your data for the following time period: five (5) years.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mb-4">Transfers of Personal Information Outside the EU</h2>
              <p>
                I may store and process your information through third-party hosting services in the US and other jurisdictions. As a result, I may transfer your personal information to a jurisdiction with different data protection and government surveillance laws than your jurisdiction has. If I am required to transfer information about you outside of the EU, I rely on Privacy Shield as the legal basis for the transfer, as Google Cloud is Privacy Shield certified.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mb-4">Your Rights</h2>
              <p className="mb-4">If you reside in certain territories, including the EU, you have a number of rights in relation to your personal information. While some of these rights apply generally, certain rights apply only in certain limited cases. Your rights are as follows:</p>
              <ul className="list-disc ml-6 space-y-3">
                <li>
                  <strong>Right to Access.</strong> You may have the right to access and receive a copy of the personal information I hold about you by contacting me using the contact information below.
                </li>
                <li>
                  <strong>Right to Change, Restrict, or Delete.</strong> You may also have rights to change, restrict my use of, or delete your personal information. Absent exceptional circumstances (such as where I am required to store information for legal reasons) I will generally delete your personal information upon your request.
                </li>
                <li>
                  <strong>Right to Object.</strong> You can object to (a) my processing of some of your information based on my legitimate interests and (b) receiving marketing messages from me. In such cases, I will delete your personal information unless I have compelling and legitimate grounds to continue storing and using your information or if it is needed for legal reasons.
                </li>
                <li>
                  <strong>Right to Complain.</strong> If you reside in the EU and wish to raise a concern about my use of your information (and without prejudice to any other rights you may have), you have the right to do so with your local data protection authority.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mb-4">How to Contact Me</h2>
              <p>
                You may reach me with any concerns relating to privacy at Gemsutopia@gmail.com
              </p>
            </section>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}