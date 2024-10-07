import nodemailer from 'nodemailer';


async function sendEmail({ to, subject, html }) {
    try {

        let transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL,
                pass: process.env.PASS,
            },
        });

        let info = await transporter.sendMail({
            from: process.env.EMAIL,
            to: to,
            subject: subject,
            html: html,
        });

        console.log('Message sent: %s', info.messageId);
        return { success: true, message: 'Email sent successfully' };
    } catch (error) {
        console.error('Error sending email:', error);
        return { success: false, message: 'Error sending email' };
    }
}

export default sendEmail;
