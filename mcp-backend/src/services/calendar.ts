
import { google } from 'googleapis';

export async function createCalendarEvent(
  userEmail: string,
  propertyAddress: string,
  startTimeIso: string
) {
  const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'); // Fix newline issue in env

  if (!serviceAccountEmail || !privateKey) {
    console.warn('[CalendarService] Missing Google Credentials. Skipping calendar event.');
    return { success: false, error: 'Google Credentials missing' };
  }

  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: serviceAccountEmail,
        private_key: privateKey,
      },
      scopes: ['https://www.googleapis.com/auth/calendar'],
    });

    const calendar = google.calendar({ version: 'v3', auth });

    // No need for explicit authorize() call with GoogleAuth
    // await jwtClient.authorize();

    // Calculate end time (assuming 1 hour visit)
    const startDate = new Date(startTimeIso);
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

    const event = {
      summary: `Site Visit: ${propertyAddress}`,
      location: propertyAddress,
      description: `Site visit scheduled via Tera Truce AI.\n\nProperty: ${propertyAddress}\nClient: ${userEmail}`,
      start: {
        dateTime: startDate.toISOString(),
        timeZone: 'UTC', 
      },
      end: {
        dateTime: endDate.toISOString(),
        timeZone: 'UTC',
      },
      attendees: [
        { email: userEmail }, // This triggers the user invite
        // You could add agent email here too
      ],
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 },
          { method: 'popup', minutes: 30 },
        ],
      },
      conferenceData: {
        createRequest: {
          requestId: `visit-${Date.now()}`,
          conferenceSolutionKey: { type: 'hangoutsMeet' },
        },
      },
    };

    // Insert into 'primary' calendar of the Service Account
    // NOTE: For this to work, the Service Account calendar must be shared or used directly.
    // Alternatively, perform Domain-Wide Delegation to impersonate a workspace user.
    // Ideally, for a simpler setup, we just use the service account's own calendar
    // and invite the user.
    
    // We need to enable conference data support (Google Meet) if desired
    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event,
      conferenceDataVersion: 1,
      sendUpdates: 'all', // Send emails to attendees
    });

    console.log(`[CalendarService] Event created: ${response.data.htmlLink}`);
    return { 
      success: true, 
      eventId: response.data.id, 
      link: response.data.htmlLink 
    };

  } catch (error: any) {
    console.error('[CalendarService] Error:', error);
    return { success: false, error: error.message };
  }
}
