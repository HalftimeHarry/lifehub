/// <reference path="../pb_data/types.d.ts" />

/**
 * Manual trigger endpoint to test auto-completion
 * Access via: POST /api/complete-appointments
 */

routerAdd("POST", "/api/complete-appointments", (e) => {
  const now = new Date().toISOString();
  
  try {
    // Find all appointments where end time has passed
    // Note: active field might not exist on all records, so we check for it
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
    const completedIds = [];

    appointments.forEach((appointment) => {
      try {
        // Mark as completed (active = false)
        const form = new RecordUpsertForm($app, appointment);
        form.loadData({
          active: false
        });
        form.submit();
        completedCount++;
        completedIds.push(appointment.id);
      } catch (err) {
        console.error(`Failed to complete appointment ${appointment.id}:`, err);
      }
    });

    return e.json(200, {
      success: true,
      completed: completedCount,
      appointmentIds: completedIds,
      message: `Auto-completed ${completedCount} appointments`
    });
  } catch (err) {
    console.error("[Manual Trigger] Error:", err);
    return e.json(500, {
      success: false,
      error: err.message
    });
  }
});

console.log("[Hooks] Manual complete-appointments endpoint registered");
