/**
 * Race calendar helpers — cancelled races stay on the calendar but skip scoring, auto-assign, reminders, admin writes.
 */

function isCalendarRaceCancelled(doc) {
  if (!doc) return false;
  return doc.status === 'cancelled';
}

function assertCalendarRaceNotCancelled(doc, context = 'This race') {
  if (isCalendarRaceCancelled(doc)) {
    const err = new Error(`${context} is cancelled and cannot be modified.`);
    err.statusCode = 400;
    throw err;
  }
}

module.exports = {
  isCalendarRaceCancelled,
  assertCalendarRaceNotCancelled
};
