import nodemailer from 'nodemailer';

// Create a transporter object using the SMTP settings
const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendEmail = async ({to, subject, body}) => {
    try {
        const response = await transporter.sendMail({
            from: process.env.SENDER_EMAIL,
            to,
            subject,
            html: body,
        });
        console.log('Email sent successfully to:', to);
        return response;
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
}

export default sendEmail;