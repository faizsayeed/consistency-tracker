const nodemailer = require('nodemailer');

class NotificationService {
    constructor() {
        // Create email transporter using SMTP
        this.transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST || 'smtp.gmail.com',
            port: process.env.EMAIL_PORT || 587,
            secure: false,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            },
            tls: {
                rejectUnauthorized: false
            },
            debug: true, // Enable debug logging
            logger: true  // Log to console
        });

        this.emailEnabled = !!(process.env.EMAIL_USER && process.env.EMAIL_PASS);
        console.log(`Email service enabled: ${this.emailEnabled}`);
        console.log(`Email user: ${process.env.EMAIL_USER}`);
        
        // Initialize Twilio if credentials available
        this.twilioEnabled = !!(process.env.TWILIO_SID && process.env.TWILIO_TOKEN && process.env.TWILIO_PHONE);
        if (this.twilioEnabled) {
            try {
                const twilio = require('twilio');
                this.twilioClient = twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);
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

        try {
            const info = await this.transporter.sendMail(mailOptions);
            console.log(`[${new Date().toISOString()}] Email reminder sent to ${to} for habit: ${habitName}`);
            console.log('Email response:', info.response);
        } catch (error) {
            console.error('Email sending failed:', error.message);
            console.error('Full error:', error);
        }
    }

    async sendSMSReminder(phone, habitName) {
        // Always show as console log since we don't have a real Twilio number
        console.log(`SMS to ${phone}: "Reminder: Time to complete '${habitName}'"`);
        console.log('Note: SMS would be sent if TWILIO_PHONE was a valid Twilio number');
        return;
        
        // Code below won't execute - keeping for reference when you get a real Twilio number
        if (!this.twilioEnabled) {
            return;
        }

        try {
            // Ensure phone numbers are in E.164 format
            const toPhone = phone.startsWith('+') ? phone : '+' + phone;
            
            await this.twilioClient.messages.create({
                body: `Reminder: Time to complete "${habitName}" - Consistency Tracker`,
                from: process.env.TWILIO_PHONE,
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
