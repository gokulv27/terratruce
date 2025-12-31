
import { z } from 'zod';
import { supabase, isDatabaseAvailable } from '../config/database.js';
import { createCalendarEvent } from '../services/calendar.js';
import { sendVisitConfirmation } from '../services/emailService.js';

// =====================================================
// TOOL: Schedule Site Visit
// =====================================================

export const ScheduleSiteVisitSchema = z.object({
  property_address: z.string().describe('Address of the property to visit'),
  user_email: z.string().email().describe('Email of the user requesting the visit'),
  date_time: z.string().datetime().describe('ISO 8601 date time string for the visit (e.g., 2024-01-01T10:00:00Z)'),
  notes: z.string().optional().describe('Optional notes or specific requests for the visit')
});

export async function scheduleSiteVisit(args: z.infer<typeof ScheduleSiteVisitSchema>) {
  console.log(`[ScheduleTool] Scheduling visit for ${args.user_email} at ${args.property_address}`);

  const results = {
    database: false,
    calendar: false,
    email: false,
    errors: [] as string[]
  };

  // 1. Insert into Database
  try {
    // Attempt to create table if it doesn't exist (Quick fix, better in migration)
    // Actually, we rely on setup_database.sql being run.
    const { error: dbError } = await supabase!
      .from('geo_core.visits') // Assuming we create this table in SQL or use public.visits
      .insert({
        property_address: args.property_address,
        user_email: args.user_email,
        visit_time: args.date_time,
        notes: args.notes || '',
        status: 'scheduled'
      });

    // If schema issue, try public schema fallback for robustness
    if (dbError && dbError.code === '42P01') { // Undefined table
        const { error: fallbackError } = await supabase!
        .from('visits')
        .insert({
          property_address: args.property_address,
          user_email: args.user_email,
          visit_time: args.date_time,
          notes: args.notes || '',
          status: 'scheduled'
        });
         if (fallbackError) throw new Error(`DB Insert Failed: ${fallbackError.message}`);
    } else if (dbError) {
        // If it's a "relation does not exist" we might need to create it. 
        // For now, let's just log it and proceed (soft fail on DB, hard fail on Calendar?)
        console.warn('[ScheduleTool] DB Insert Warning:', dbError.message);
        results.errors.push(`Database: ${dbError.message}`);
    } else {
        results.database = true;
    }

  } catch (error: any) {
     console.error('[ScheduleTool] DB Error:', error);
     results.errors.push(`Database: ${error.message}`);
  }

  // 2. Create Calendar Event
  const calendarResult = await createCalendarEvent(
    args.user_email,
    args.property_address,
    args.date_time
  );

  if (calendarResult.success) {
    results.calendar = true;
  } else {
    results.errors.push(`Calendar: ${calendarResult.error}`);
  }

  // 3. Send Email Confirmation
  const emailResult = await sendVisitConfirmation({
    to: args.user_email,
    subject: `Site Visit Confirmed: ${args.property_address}`,
    propertyName: args.property_address,
    visitTime: new Date(args.date_time).toLocaleString(),
    summary: args.notes || "Standard site visit scheduled by AI assistant."
  });

  if (emailResult.success) {
    results.email = true;
  } else {
    results.errors.push(`Email: ${emailResult.error}`);
  }

  // Final Response
  return {
    status: results.calendar ? 'success' : 'partial_failure',
    message: results.calendar 
      ? `Successfully scheduled site visit for ${new Date(args.date_time).toLocaleString()}` 
      : 'Failed to fully schedule visit, please check errors.',
    details: {
      calendar_event: calendarResult.link || null,
      email_sent: results.email,
      database_record: results.database,
      errors: results.errors.length > 0 ? results.errors : undefined
    }
  };
}
