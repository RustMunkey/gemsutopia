import emailjs from '@emailjs/browser';

// Initialize EmailJS with your public key
export const initEmailJS = () => {
  emailjs.init(process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || '');
};

// EmailJS configuration
export const EMAILJS_CONFIG = {
  serviceId: process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || '',
  templateIds: {
    orderReceipt: process.env.NEXT_PUBLIC_EMAILJS_ORDER_RECEIPT_TEMPLATE_ID || '',
    newsletter: process.env.NEXT_PUBLIC_EMAILJS_NEWSLETTER_TEMPLATE_ID || '',
    signUpConfirmation: process.env.NEXT_PUBLIC_EMAILJS_SIGNUP_TEMPLATE_ID || '',
    signInNotification: process.env.NEXT_PUBLIC_EMAILJS_SIGNIN_TEMPLATE_ID || '',
  },
};

// Email sending functions
export const sendOrderReceiptEmail = async (orderData: {
  customerEmail: string;
  customerName: string;
  orderId: string;
  amount: number;
  items: Array<{ name: string; price: number; quantity: number }>;
}) => {
  try {
    const templateParams = {
      to_email: orderData.customerEmail,
      customer_name: orderData.customerName,
      order_id: orderData.orderId,
      order_total: orderData.amount.toFixed(2),
      order_items: orderData.items.map(item => 
        `${item.name} (Qty: ${item.quantity}) - $${item.price.toFixed(2)}`
      ).join('\n'),
      company_name: 'Gemsutopia',
      support_email: 'gemsutopia@gmail.com',
    };

    const result = await emailjs.send(
      EMAILJS_CONFIG.serviceId,
      EMAILJS_CONFIG.templateIds.orderReceipt,
      templateParams
    );

    return { success: true, result };
  } catch (error) {
    console.error('Failed to send order receipt email:', error);
    return { success: false, error };
  }
};

export const sendNewsletterConfirmation = async (email: string) => {
  try {
    const templateParams = {
      to_email: email,
      company_name: 'Gemsutopia',
      unsubscribe_link: `${process.env.NEXT_PUBLIC_SITE_URL}/unsubscribe?email=${email}`,
    };

    const result = await emailjs.send(
      EMAILJS_CONFIG.serviceId,
      EMAILJS_CONFIG.templateIds.newsletter,
      templateParams
    );

    return { success: true, result };
  } catch (error) {
    console.error('Failed to send newsletter confirmation email:', error);
    return { success: false, error };
  }
};

export const sendSignUpConfirmationEmail = async (userData: {
  email: string;
  firstName: string;
  lastName: string;
}) => {
  try {
    console.log('EmailJS Config:', {
      serviceId: EMAILJS_CONFIG.serviceId,
      templateId: EMAILJS_CONFIG.templateIds.signUpConfirmation,
      publicKey: process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY
    });

    const templateParams = {
      to_email: userData.email,
      user_name: `${userData.firstName} ${userData.lastName}`,
      company_name: 'Gemsutopia',
      login_link: `${process.env.NEXT_PUBLIC_SITE_URL}/sign-in`,
      support_email: 'gemsutopia@gmail.com',
    };

    console.log('Template params:', templateParams);

    const result = await emailjs.send(
      EMAILJS_CONFIG.serviceId,
      EMAILJS_CONFIG.templateIds.signUpConfirmation,
      templateParams
    );

    console.log('EmailJS success:', result);
    return { success: true, result };
  } catch (error: any) {
    console.error('Failed to send sign up confirmation email:', error);
    console.error('Error details:', {
      message: error?.message,
      status: error?.status,
      text: error?.text
    });
    return { success: false, error };
  }
};

export const sendSignInNotificationEmail = async (userData: {
  email: string;
  name: string;
  loginTime: string;
  ipAddress?: string;
}) => {
  try {
    const templateParams = {
      to_email: userData.email,
      user_name: userData.name,
      login_time: userData.loginTime,
      ip_address: userData.ipAddress || 'Unknown',
      company_name: 'Gemsutopia',
      support_email: 'gemsutopia@gmail.com',
    };

    const result = await emailjs.send(
      EMAILJS_CONFIG.serviceId,
      EMAILJS_CONFIG.templateIds.signInNotification,
      templateParams
    );

    return { success: true, result };
  } catch (error) {
    console.error('Failed to send sign in notification email:', error);
    return { success: false, error };
  }
};