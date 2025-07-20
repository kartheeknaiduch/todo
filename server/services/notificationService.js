const User = require('../models/userModel');
const Todo = require('../models/todoModel');
const { sendDeadlineReminder } = require('./emailService');

const checkDeadlines = async () => {
  try {
    console.log('Starting deadline check...');
    const users = await User.find({ 'notificationPreferences.enabled': true });
    console.log(`Found ${users.length} users with notifications enabled`);
    
    for (const user of users) {
      console.log(`Processing user: ${user.email}`);
      const reminderTime = user.notificationPreferences.reminderTime;
      const reminderThreshold = new Date(Date.now() + reminderTime * 60 * 60 * 1000);
      
      console.log(`Looking for todos due before: ${reminderThreshold}`);
      const upcomingTodos = await Todo.find({
        user: user._id,
        deadline: { $lte: reminderThreshold, $gt: new Date() },
        completed: false
      });
      console.log(`Found ${upcomingTodos.length} upcoming todos for user ${user.email}`);

      for (const todo of upcomingTodos) {
        console.log(`Sending reminder for todo: ${todo.title}`);
        await sendDeadlineReminder(user.email, todo, user.notificationPreferences.customMessage);
      }
    }
  } catch (error) {
    console.error('Error checking deadlines:', error);
    console.error('Full error details:', JSON.stringify(error, null, 2));
  }
};

// Run the check every hour
console.log('Starting notification service...');
setInterval(checkDeadlines, 60 * 60 * 1000);
// Run immediately on startup
checkDeadlines();

module.exports = {
  checkDeadlines
}; 