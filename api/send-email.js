const nodemailer = require('nodemailer');

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed. Use POST.' });
  }

  const { name, email, message, to, subject, html } = req.body || {};

  // Ensure environment variables are set
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error('Environment variables EMAIL_USER or EMAIL_PASS are missing.');
    return res.status(500).json({ 
      success: false, 
      error: 'Internal Server Error. Mail configuration missing.' 
    });
  }

  // Setup transporter for Outlook Office365 SMTP
  const transporter = nodemailer.createTransport({
    host: 'smtp.office365.com',
    port: 587,
    secure: false, // Office365 uses STARTTLS (587/false)
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      ciphers: 'SSLv3',
      rejectUnauthorized: false
    }
  });

  try {
    // Determine dynamic options to support both direct contact forms and general portal notifications
    const targetRecipient = to || 'info@sayashvastu.com';
    const emailReplyTo = email || undefined;
    const emailSubject = subject || `New Sayash Vastu Contact Query from ${name || 'Customer'}`;
    const emailText = message || `You have received a new contact form submission.\n\nName: ${name || 'N/A'}\nEmail: ${email || 'N/A'}\nMessage:\n${message || 'N/A'}`;
    const emailHtml = html || `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #c9a84c; border-bottom: 2px solid #c9a84c; padding-bottom: 10px;">New Vastu Consultation Query</h2>
        <p><strong>Name:</strong> ${name || 'N/A'}</p>
        <p><strong>Email:</strong> <a href="mailto:${email || ''}" style="color: #c9a84c; text-decoration: none;">${email || 'N/A'}</a></p>
        <p><strong>Message:</strong></p>
        <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #c9a84c; border-radius: 4px; white-space: pre-wrap; font-style: italic;">
          ${message || 'No message provided.'}
        </div>
        <br />
        <hr style="border: 0; border-top: 1px solid #eee;" />
        <p style="font-size: 11px; color: #888;">This email was sent automatically from the contact form on Sayash Vastu Main website.</p>
      </div>
    `;

    const mailOptions = {
      from: process.env.EMAIL_USER, // Office365 requires the "from" to match the authenticated user
      to: targetRecipient,
      replyTo: emailReplyTo,
      subject: emailSubject,
      text: emailText,
      html: emailHtml
    };

    // Send email
    await transporter.sendMail(mailOptions);

    return res.status(200).json({ 
      success: true, 
      message: 'Email sent successfully!' 
    });
  } catch (error) {
    console.error('Nodemailer Error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to send email.', 
      details: error.message 
    });
  }
};
