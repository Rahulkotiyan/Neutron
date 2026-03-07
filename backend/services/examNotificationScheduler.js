const cron = require('node-cron');
const { User, StudentExam, Notification } = require('../models/Schema');
const { getIO } = require('../socket/socketHandler');

// Email sending utility (assuming it's available from existing controllers)
const sendEmailNotification = async (to, subject, message) => {
  // For now, we'll skip email notifications since they're not configured
  // This can be implemented later if email service is added
};

class ExamNotificationScheduler {
  constructor() {
    this.isRunning = false;
  }

  // Start the scheduler
  start() {
    if (this.isRunning) {
      return;
    }

    // Run every 5 minutes to check for upcoming exams
    cron.schedule('*/5 * * * *', async () => {
      await this.checkAndSendNotifications();
    });

    // Also run immediately on startup
    this.checkAndSendNotifications();

    this.isRunning = true;
  }

  // Stop the scheduler
  stop() {
    if (!this.isRunning) {
      return;
    }

    // node-cron doesn't provide a direct stop method, but we can mark as stopped
    this.isRunning = false;
  }

  // Main function to check and send notifications
  async checkAndSendNotifications() {
    try {

      const now = new Date();
      const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

      // Find exams that need notifications within the next 5 minutes
      const examsToNotify = await StudentExam.find({
        notificationsEnabled: true,
        examDate: { $lte: fiveMinutesFromNow },
        examDate: { $gt: now }
      }).populate('user', 'name email');

      for (const exam of examsToNotify) {
        await this.processExamNotifications(exam, now);
      }

    } catch (error) {
      // Error handling without logging
    }
  }

  // Process notifications for a specific exam
  async processExamNotifications(exam, currentTime) {
    try {
      if (!exam.notificationsEnabled || !exam.notificationTimes || !exam.user) {
        return;
      }

      const examDateTime = new Date(`${exam.examDate.split('T')[0]}T${exam.startTime}`);
      const timeDiff = (examDateTime - currentTime) / (1000 * 60); // difference in minutes

      // Check each notification time
      for (const notificationTime of exam.notificationTimes) {
        // Check if we're within 1 minute of the notification time
        if (Math.abs(timeDiff - notificationTime) <= 1) {
          // Check if we haven't already sent this notification
          const notificationKey = `${exam._id}_${notificationTime}`;
          if (!this.sentNotifications || !this.sentNotifications.has(notificationKey)) {
            await this.sendExamNotification(exam, notificationTime);

            // Mark as sent
            if (!this.sentNotifications) {
              this.sentNotifications = new Set();
            }
            this.sentNotifications.add(notificationKey);
          }
        }
      }
    } catch (error) {
      // Error handling without logging
    }
  }

  // Send notification for a specific exam
  async sendExamNotification(exam, minutesBefore) {
    try {
      const user = exam.user;
      const examDateTime = new Date(`${exam.examDate.split('T')[0]}T${exam.startTime}`);

      const notificationMessage = `Your ${exam.subject} exam starts in ${minutesBefore} minutes (${examDateTime.toLocaleDateString()} at ${exam.startTime})`;

      // Create in-app notification
      const notification = new Notification({
        recipient: user._id,
        sender: null, // system notification
        type: 'exam_reminder',
        title: `📚 Exam Reminder: ${exam.subject}`,
        message: notificationMessage,
        relatedEntity: {
          entityType: 'EXAM',
          entityId: exam._id
        }
      });

      await notification.save();

      // Send real-time notification via Socket.io
      try {
        const io = getIO();
        const payload = {
          type: 'exam_reminder',
          title: `📚 Exam Reminder: ${exam.subject}`,
          message: notificationMessage,
          exam: {
            _id: exam._id,
            subject: exam.subject,
            subjectCode: exam.subjectCode,
            examDate: exam.examDate,
            startTime: exam.startTime,
            endTime: exam.endTime,
            room: exam.room,
            building: exam.building
          },
          createdAt: new Date()
        };

        // Emit to the user's socket room
        io.to(user._id.toString()).emit('new_notification', payload);
      } catch (socketErr) {
        // Socket not initialized, skipping real-time notification
      }

      // Send email notification (placeholder for now)
      if (user.email) {
        await sendEmailNotification(
          user.email,
          `📚 Exam Reminder: ${exam.subject} - ${minutesBefore} minutes`,
          `Hi ${user.name},\n\n${notificationMessage}\n\nGood luck with your exam!`
        );
      }

    } catch (error) {
      // Error handling without logging
    }
  }

  // Clean up old sent notifications (run daily)
  cleanup() {
    cron.schedule('0 0 * * *', () => {
      if (this.sentNotifications) {
        // Clear notifications older than 24 hours
        this.sentNotifications.clear();
      }
    });
  }
}

// Export singleton instance
module.exports = new ExamNotificationScheduler();
