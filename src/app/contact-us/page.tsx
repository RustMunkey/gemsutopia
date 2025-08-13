'use client';
import { useState, useRef, FormEvent } from 'react';
import emailjs from '@emailjs/browser';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { IconMail, IconPhone, IconMapPin } from '@tabler/icons-react';
import { useCMSContent } from '@/hooks/useCMSContent';

export default function ContactUs() {
  const form = useRef<HTMLFormElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const { getContent } = useCMSContent();

  const sendEmail = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    if (!form.current) {
      setMessage('Form error. Please try again.');
      setIsLoading(false);
      return;
    }

    // EmailJS configuration - you'll need to set these up at emailjs.com
    const SERVICE_ID = 'service_gemsutopia';
    const TEMPLATE_ID = 'template_contact';
    const PUBLIC_KEY = 'your_public_key_here';

    emailjs
      .sendForm(SERVICE_ID, TEMPLATE_ID, form.current, PUBLIC_KEY)
      .then(
        () => {
          setMessage('Message sent successfully! We\'ll get back to you soon.');
          form.current?.reset();
        },
        (error) => {
          console.log('FAILED...', error.text);
          setMessage('Failed to send message. Please try again or email us directly at gemsutopia@gmail.ca');
        }
      )
      .finally(() => {
        setIsLoading(false);
      });
  };

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
            <h1 className="text-3xl md:text-4xl font-bold text-black mb-4">Get in Touch</h1>
            <p className="text-lg text-neutral-600">We&apos;d love to hear from you!</p>
          </div>
          
          <div className="flex flex-col items-center max-w-2xl mx-auto">
            <div className="w-full">
              <h2 className="text-2xl font-bold text-black mb-6 text-center">Send a Message</h2>
              <div className="flex items-center justify-center gap-2 mb-6">
                <IconMail className="h-5 w-5 text-black" />
                <span className="font-semibold text-black">Email:</span>
                <a 
                  href="mailto:gemsutopia@gmail.ca" 
                  className="text-neutral-600 hover:text-black underline transition-colors"
                >
                  {getContent('contact', 'email') || 'gemsutopia@gmail.ca'}
                </a>
              </div>
              {message && (
                <div className={`p-4 rounded-lg mb-6 ${
                  message.includes('successfully') 
                    ? 'bg-green-100 text-green-800 border border-green-200' 
                    : 'bg-red-100 text-red-800 border border-red-200'
                }`}>
                  {message}
                </div>
              )}
              <form ref={form} onSubmit={sendEmail} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-black mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="user_name"
                    required
                    className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                    placeholder="Your name"
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-black mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="user_email"
                    required
                    className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                    placeholder="your@email.com"
                  />
                </div>
                
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-black mb-2">
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={5}
                    required
                    className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                    placeholder="Your message"
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-black text-white py-3 px-6 rounded-lg font-semibold hover:bg-neutral-800 transition-colors disabled:bg-neutral-400 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Sending...' : 'Send Message'}
                </button>
              </form>
              
              {/* Additional Contact Information */}
              <div className="mt-8 pt-8 border-t border-neutral-200">
                {getContent('contact', 'phone') && (
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <IconPhone className="h-5 w-5 text-black" />
                    <span className="font-semibold text-black">Phone:</span>
                    <span className="text-neutral-600">{getContent('contact', 'phone')}</span>
                  </div>
                )}
                
                {getContent('contact', 'address') && (
                  <div className="flex items-center justify-center gap-2">
                    <IconMapPin className="h-5 w-5 text-black" />
                    <span className="font-semibold text-black">Address:</span>
                    <span className="text-neutral-600 text-center">{getContent('contact', 'address')}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}