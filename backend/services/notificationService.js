const nodemailer = require('nodemailer');

class NotificationService {
    constructor() {
        // Check if using Brevo (API) or Resend or SMTP
        this.useBrevoAPI = process.env.EMAIL_HOST === 'api.brevo.com';
        this.useResendAPI = process.env.EMAIL_HOST === 'api.resend.com';
        
        if (this.useBrevoAPI) {
            // Use Brevo REST API
            this.brevoApiKey = process.env.EMAIL_PASS;
            console.log('Using Brevo REST API for emails');
        } else if (this.useResendAPI) {
            // Use Resend REST API
            this.resendApiKey = process.env.EMAIL_PASS;
            console.log('Using Resend REST API for emails');
        } else {
            // Create email transporter using SMTP (for SendGrid, Gmail, Mailjet, etc.)
            const smtpHost = process.env.EMAIL_HOST || 'smtp.gmail.com';
            console.log(`Creating SMTP transport with host: ${smtpHost}`);
            this.transporter = nodemailer.createTransport({
                host: smtpHost,
                port: process.env.EMAIL_PORT || 587,
                secure: false,
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                },
                tls: {
                    rejectUnauthorized: false
                },
                debug: true,
                logger: true
            });
        }

        this.emailEnabled = !!(process.env.EMAIL_USER && process.env.EMAIL_PASS);
        console.log(`Email service enabled: ${this.emailEnabled}`);
        console.log(`Email host: ${process.env.EMAIL_HOST}`);
        
        // Initialize Twilio if credentials available
        this.twilioEnabled = !!(process.env.TWILIO_SID && process.env.TWILIO_TOKEN && process.env.TWILIO_PHONE);
        if (this.twilioEnabled) {
            try {
                const twilio = require('twilio');
                this.twilioClient = twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);
                this.twilioPhone = process.env.TWILIO_PHONE;
                console.log('Twilio SMS service initialized');
            } catch (error) {
                console.log('Twilio not installed. Run: npm install twilio');
                this.twilioEnabled = false;
            }
        }
    }

    async sendEmailReminder(to, habitName, userName) {
        if (!this.emailEnabled) {
            console.log('Email not configured. Skipping email reminder.');
            return;
        }

        try {
            if (this.useBrevoAPI) {
                // Use Brevo REST API
                await this.sendBrevoEmail(to, habitName, userName);
            } else if (this.useResendAPI) {
                // Use Resend REST API
                await this.sendResendEmail(to, habitName, userName);
            } else {
                // Use SMTP
                await this.sendSMTPEmail(to, habitName, userName);
            }
        } catch (error) {
            console.error('❌ Email sending failed:', error.message);
            console.error('Full error:', error);
        }
    }

    async sendBrevoEmail(to, habitName, userName) {
        const emailData = {
            sender: {
                name: "Consistency Tracker",
                email: "faizsayeed524@gmail.com"
            },
            to: [{ email: to }],
            subject: `Reminder: Time to complete "${habitName}"`,
            htmlContent: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #6366f1;">Hello ${userName}!</h2>
                    <p>This is a friendly reminder to complete your habit:</p>
                    <div style="background: #f9fafb; padding: 20px; border-radius: 12px; margin: 20px 0;">
                        <h3 style="margin: 0; color: #1f2937;">${habitName}</h3>
                    </div>
                    <p>Stay consistent and keep building those good habits!</p>
                    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
                    <p style="font-size: 12px; color: #6b7280;">
                        You received this email because you enabled reminders in Consistency Tracker.<br>
                        To unsubscribe, update your notification settings in the app.
                    </p>
                </div>
            `
        };

        console.log(`Sending email via Brevo API to ${to}`);
        
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'api-key': this.brevoApiKey,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(emailData)
        });

        const result = await response.json();

        if (response.ok) {
            console.log(`[${new Date().toISOString()}] ✅ Email sent to ${to}, MessageId: ${result.messageId}`);
        } else {
            console.error(`❌ Brevo API error:`, result);
            throw new Error(result.message || 'Brevo API failed');
        }
    }

    async sendResendEmail(to, habitName, userName) {
        const emailData = {
            from: 'onboarding@resend.dev',
            to: to,
            subject: `Reminder: Time to complete "${habitName}"`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #6366f1;">Hello ${userName}!</h2>
                    <p>This is a friendly reminder to complete your habit:</p>
                    <div style="background: #f9fafb; padding: 20px; border-radius: 12px; margin: 20px 0;">
                        <h3 style="margin: 0; color: #1f2937;">${habitName}</h3>
                    </div>
                    <p>Stay consistent and keep building those good habits!</p>
                    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
                    <p style="font-size: 12px; color: #6b7280;">
                        You received this email because you enabled reminders in Consistency Tracker.<br>
                        To unsubscribe, update your notification settings in the app.
                    </p>
                </div>
            `
        };

        console.log(`Sending email via Resend API to ${to}`);
        
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.resendApiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(emailData)
        });

        const result = await response.json();

        if (response.ok) {
            console.log(`[${new Date().toISOString()}] ✅ Email sent to ${to}, ID: ${result.id}`);
        } else {
            console.error(`❌ Resend API error:`, result);
            throw new Error(result.message || 'Resend API failed');
        }
    }

    async sendSMTPEmail(to, habitName, userName) {
        const mailOptions = {
            from: `"Consistency Tracker" <${process.env.EMAIL_USER}>`,
            to: to,
            subject: `Reminder: Time to complete "${habitName}"`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #6366f1;">Hello ${userName}!</h2>
                    <p>This is a friendly reminder to complete your habit:</p>
                    <div style="background: #f9fafb; padding: 20px; border-radius: 12px; margin: 20px 0;">
                        <h3 style="margin: 0; color: #1f2937;">${habitName}</h3>
                    </div>
                    <p>Stay consistent and keep building those good habits!</p>
                    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
                    <p style="font-size: 12px; color: #6b7280;">
                        You received this email because you enabled reminders in Consistency Tracker.<br>
                        To unsubscribe, update your notification settings in the app.
                    </p>
                </div>
            `
        };

        console.log(`Sending email via SMTP to ${to}`);
        try {
            const info = await this.transporter.sendMail(mailOptions);
            console.log(`[${new Date().toISOString()}] ✅ Email sent, ID: ${info.messageId}`);
            console.log(`Response:`, info.response);
            console.log(`Accepted:`, info.accepted);
            console.log(`Rejected:`, info.rejected);
        } catch (smtpError) {
            console.error(`❌ SMTP Error:`, smtpError.message);
            console.error(`Full SMTP Error:`, smtpError);
            throw smtpError;
        }
    }

    async sendSMSReminder(phone, habitName) {
        if (!this.twilioEnabled) {
            console.log('Twilio not configured. SMS would send to:', phone);
            return;
        }

        try {
            // Ensure phone numbers are in E.164 format
            const toPhone = phone.startsWith('+') ? phone : '+' + phone;
            const fromPhone = this.twilioPhone.startsWith('+') ? this.twilioPhone : '+' + this.twilioPhone;
            
            // Skip if trying to send to the same number (Twilio restriction)
            if (toPhone === fromPhone) {
                console.log(`⚠️  Skipping SMS - cannot send to same number: ${toPhone}`);
                return;
            }
            
            await this.twilioClient.messages.create({
                body: `Reminder: Time to complete "${habitName}" - Consistency Tracker`,
                from: this.twilioPhone,
                to: toPhone
            });
            console.log(`[${new Date().toISOString()}] SMS reminder sent to ${toPhone} for habit: ${habitName}`);
        } catch (error) {
            console.error('SMS sending failed:', error.message);
        }
    }

    // Check if current time matches reminder time and send notifications
    async checkAndSendReminders(usersWithReminders) {
        const now = new Date();
        
        // Convert UTC to IST (UTC+5:30) for comparison
        // IST offset is +330 minutes (5 hours 30 minutes)
        const istOffset = 330 * 60 * 1000; // 330 minutes in milliseconds
        const istTime = new Date(now.getTime() + istOffset);
        const currentTime = `${String(istTime.getUTCHours()).padStart(2, '0')}:${String(istTime.getUTCMinutes()).padStart(2, '0')}`;
        const currentSeconds = istTime.getUTCSeconds();

        console.log(`[${now.toISOString()}] Checking reminders at IST ${currentTime} (UTC: ${String(now.getUTCHours()).padStart(2, '0')}:${String(now.getUTCMinutes()).padStart(2, '0')})`);

        // Only run at the start of each minute (0-10 seconds)
        if (currentSeconds > 10) {
            console.log('Skipping check - not at start of minute');
            return;
        }

        console.log(`Found ${usersWithReminders.length} users with reminders`);

        let sentCount = 0;
        for (const reminder of usersWithReminders) {
            // MySQL TIME format is HH:MM:SS, so we compare first 5 chars (HH:MM)
            const reminderTime = reminder.reminder_time ? reminder.reminder_time.toString().substring(0, 5) : null;
            
            console.log(`Checking reminder for ${reminder.habit_name}: reminder_time=${reminderTime}, current_time=${currentTime}`);
            
            if (reminderTime === currentTime) {
                console.log(`Time matches! Sending notifications for ${reminder.habit_name}`);
                
                // Send email notification
                if (reminder.email && reminder.email_notifications) {
                    console.log(`Sending email to ${reminder.email}`);
                    await this.sendEmailReminder(
                        reminder.email,
                        reminder.habit_name,
                        reminder.name
                    );
                    sentCount++;
                } else {
                    console.log(`Email not sent - email=${reminder.email}, email_notifications=${reminder.email_notifications}`);
                }

                // Send SMS notification
                if (reminder.phone && reminder.sms_notifications) {
                    console.log(`Sending SMS to ${reminder.phone}`);
                    await this.sendSMSReminder(reminder.phone, reminder.habit_name);
                    sentCount++;
                } else {
                    console.log(`SMS not sent - phone=${reminder.phone}, sms_notifications=${reminder.sms_notifications}`);
                }
            }
        }
        
        if (sentCount > 0) {
            console.log(`[${new Date().toISOString()}] Sent ${sentCount} notifications`);
        } else {
            console.log('No notifications sent - no matching reminder times');
        }
    }
}

module.exports = new NotificationService();
