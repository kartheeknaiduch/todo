const nodemailer = require('nodemailer');

// Create a transporter using environment variables
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Verify transporter configuration
transporter.verify(function(error, success) {
  if (error) {
    console.log('Transporter verification error:', error);
  } else {
    console.log('Server is ready to send emails');
  }
});

const sendDeadlineReminder = async (email, todo, customMessage = '') => {
  console.log('Attempting to send email with config:', {
    from: process.env.EMAIL_USER,
    to: email,
    service: 'gmail'
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: `⏰ Deadline Reminder: ${todo.title}`,
    html: `
      <h2>Task Deadline Reminder</h2>
      <p>Your task "${todo.title}" is due soon!</p>
      <p><strong>Deadline:</strong> ${new Date(todo.deadline).toLocaleString()}</p>
      <p><strong>Priority:</strong> ${todo.priority}</p>
      ${customMessage ? `<p><strong>Message:</strong> ${customMessage}</p>` : ''}
      <p>Please make sure to complete this task before the deadline.</p>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info);
    console.log(`Reminder email sent to ${email} for task: ${todo.title}`);
  } catch (error) {
    console.error('Error sending reminder email:', error);
    console.error('Full error details:', JSON.stringify(error, null, 2));
  }
};

module.exports = {
  sendDeadlineReminder
}; 