/// <reference path="../pb_data/types.d.ts" />

/**
 * Auto-complete appointments cron job
 * Runs every hour to mark appointments as completed if their end time has passed
 */

cronAdd("auto_complete_appointments", "0 * * * *", () => {
  const now = new Date().toISOString();
  
  try {
    // Find all appointments where end time has passed
    const appointments = $app.findRecordsByFilter(
      "appointments",
      `end != "" && end < "${now}"`,
      "-end",
      500
    ).filter((apt) => {
      // Only process if active is true or undefined (default to true)
      return apt.get("active") !== false;
    });

    let completedCount = 0;

    appointments.forEach((appointment) => {
      try {
        // Mark as completed (active = false)
        const form = new RecordUpsertForm($app, appointment);
        form.loadData({
          active: false
        });
        form.submit();
        completedCount++;
      } catch (err) {
        console.error(`Failed to complete appointment ${appointment.id}:`, err);
      }
    });

    if (completedCount > 0) {
      console.log(`[Cron] Auto-completed ${completedCount} appointments`);
    }
  } catch (err) {
    console.error("[Cron] Error in auto_complete_appointments:", err);
  }
});

console.log("[Hooks] Auto-complete appointments cron job registered (runs every hour)");
