import "dotenv/config";
import { createCalendarEvent } from "./services/calendar.js";

async function main() {
  const userEmail = "gokulvijayanand@gmail.com"; // Using the email from other tests
  const propertyAddress = "Test Property 101";

  // Schedule for tomorrow 10 AM
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);

  console.log("📅 Testing Google Calendar Event Creation...");
  const result = await createCalendarEvent(
    userEmail,
    propertyAddress,
    tomorrow.toISOString()
  );

  if (result.success) {
    console.log("✅ Event created successfully!");
    console.log("Link:", result.link);
    console.log("Event ID:", result.eventId);
    console.log(
      "Check your Google Calendar for the event with a 24-hour email reminder."
    );
  } else {
    console.error("❌ Failed to create event:", result.error);
  }
}

main();
