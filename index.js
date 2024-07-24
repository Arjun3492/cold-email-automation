const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');
const nodemailer = require('nodemailer');
require('dotenv').config();

// Static values
const companiesPdfPath = process.env.companiesPdfPath;
const resumePath = process.env.resumePath; // Path to the resume
const userEmail = process.env.userEmail;  // Your email address
const userAppPassword = process.env.userAppPassword;  // Your app email password  get at [https://myaccount.google.com/apppasswords]
const mailTitle = process.env.mailTitle;
const templatePath = path.join(__dirname, process.env.IS_PRIVATE ? 'private-template.html' : 'email-template.html');


// Email body function
function getMailBody() {
    return fs.readFileSync(templatePath, 'utf8');
}

// Function to extract emails from PDF
async function extractEmails(companiesPdfPath) {
    const dataBuffer = fs.readFileSync(companiesPdfPath);

    try {
        const data = await pdf(dataBuffer);
        const text = data.text;

        const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
        const emails = text.match(emailRegex);

        return emails ? emails : [];
    } catch (error) {
        console.error('Error extracting emails:', error);
        return [];
    }
}

// Function to send emails
async function sendEmails(emails, resumePath, userEmail, userAppPassword, emailTitle, emailBody) {
    const transporter = nodemailer.createTransport({
        pool: true,
        maxConnections: 5,
        service: 'Gmail',
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
            user: userEmail,
            pass: userAppPassword,
        },

    });

    const mailOptions = {
        from: userEmail,
        subject: emailTitle,
        html: emailBody,
        attachments: [
            {
                filename: path.basename(resumePath),
                path: resumePath,
            },
        ],
    };

    for (const email of emails) {
        mailOptions.to = email;

        try {
            const info = await transporter.sendMail(mailOptions);
            console.log('Email sent to:', email, info.response);
        } catch (error) {
            console.error('Error sending email to:', email, error);
        }
    }

    // Close the pooled connections
    transporter.close();
}

// Main function to execute script
async function main() {
    const emails = await extractEmails(companiesPdfPath);
    await sendEmails(emails, resumePath, userEmail, userAppPassword, mailTitle, getMailBody());
    console.log('Emails sent successfully');
}

// Execute the main function
main();
