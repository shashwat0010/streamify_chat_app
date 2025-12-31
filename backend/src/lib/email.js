import nodemailer from "nodemailer";

export const sendVerificationEmail = async (email, verificationToken) => {
    try {
        let transporter;

        // Use environment variables if provided
        if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
            const port = parseInt(process.env.SMTP_PORT || "587");
            const secure = port === 465; // true for 465, false for other ports

            console.log(`Configuring SMTP with Host: ${process.env.SMTP_HOST}, Port: ${port}, Secure: ${secure}, User: ${process.env.SMTP_USER}`);

            transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: port,
                secure: secure,
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS.replace(/\s+/g, ''), // Remove spaces if present
                },
                connectionTimeout: 10000, // 10 seconds
                greetingTimeout: 10000, // 10 seconds
                socketTimeout: 10000, // 10 seconds
            });
        } else {
            // Fallback to Ethereal Email for development (no real email sent, just a preview link)
            console.log("No SMTP credentials found. Using Ethereal Email for testing.");
            const testAccount = await nodemailer.createTestAccount();

            transporter = nodemailer.createTransport({
                host: "smtp.ethereal.email",
                port: 587,
                secure: false,
                auth: {
                    user: testAccount.user,
                    pass: testAccount.pass,
                },
            });
        }

        const info = await transporter.sendMail({
            from: '"Streamify App" <no-reply@streamify.com>',
            to: email,
            subject: "Verify your email",
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Verify Your Email</h2>
          <p>Thanks for signing up! Please use the following code to verify your email address:</p>
          <div style="background-color: #f4f4f4; padding: 15px; text-align: center; border-radius: 5px; font-size: 24px; letter-spacing: 5px; font-weight: bold;">
            ${verificationToken}
          </div>
          <p>This code will expire in 24 hours.</p>
        </div>
      `,
        });

        console.log("Message sent: %s", info.messageId);

        // If using Ethereal, log the preview URL
        if (!process.env.SMTP_HOST) {
            console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
        }

        return true;
    } catch (error) {
        console.error("Error sending email:", error);
        return false;
    }
};
