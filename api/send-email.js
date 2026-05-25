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

  const { name, email, message } = req.body || {};

  // Request validation
  if (!name || !email || !message) {
    return res.status(400).json({ 
      success: false, 
      error: 'Missing required fields. Provide name, email, and message.' 
    });
  }

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
    secure: false, // true for 465, false for other ports. Office365 uses STARTTLS (587/false)
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
    const mailOptions = {
      from: process.env.EMAIL_USER, // Office365 requires the "from" to match the authenticated user
      to: 'info@sayashvastu.com',
      replyTo: email, // Direct replies back to the sender
      subject: `New Sayash Vastu Contact Form Submission from ${name}`,
      text: `You have received a new contact form submission.\n\nName: ${name}\nEmail: ${email}\nMessage:\n${message}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #c9933b; border-bottom: 2px solid #c9933b; padding-bottom: 10px;">New Vastu Consultation Query</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> <a href="mailto:${email}" style="color: #c9933b; text-decoration: none;">${email}</a></p>
          <p><strong>Message:</strong></p>
          <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #c9933b; border-radius: 4px; white-space: pre-wrap; font-style: italic;">
            ${message}
          </div>
          <br />
          <hr style="border: 0; border-top: 1px solid #eee;" />
          <p style="font-size: 11px; color: #888;">This email was sent automatically from the contact form on Sayash Vastu Main website.</p>
        </div>
      `
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
