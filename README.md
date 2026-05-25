# Sayash Vastu Main

Vastu Shastra consultancy main website and serverless email API.

## Email API `/api/send-email`

This repository includes a Vercel Serverless Function built with `Nodemailer` to send contact form/consultation queries via Outlook / Office365 SMTP.

### Environment Variables

To make the email sender work, configure the following environment variables (locally in a `.env` file or in your Vercel Project Settings):

- `EMAIL_USER`: Your Outlook/Office365 email address (e.g., `sender@outlook.com` or `info@sayashvastu.com`).
- `EMAIL_PASS`: Your Outlook/Office365 password or App Password (if MFA is enabled).

### Request Payload

Send a `POST` request to `/api/send-email` with JSON headers (`Content-Type: application/json`):

```json
{
  "name": "John Doe",
  "email": "johndoe@example.com",
  "message": "Interested in home Vastu consultation."
}
```

### Response Formats

#### Success (200 OK)
```json
{
  "success": true,
  "message": "Email sent successfully!"
}
```

#### Error (400 Bad Request)
```json
{
  "success": false,
  "error": "Missing required fields. Provide name, email, and message."
}
```

#### Error (500 Internal Server Error)
```json
{
  "success": false,
  "error": "Failed to send email.",
  "details": "Error message description"
}
```