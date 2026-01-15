import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUsage() {
    // The original first attempt is being removed/replaced based on the instruction's intent.
    // The instruction implies changing the first query to not specify a schema.
    // However, the provided "Code Edit" snippet shows the *second* query being modified
    // to remove the .schema('private') call and become a public schema query.
    // I will interpret the instruction as making the second query (data1, error1)
    // query the public schema by removing the .schema('private') call,
    // as indicated by the "Code Edit" snippet.

    // The original first query (data, error) is commented out or removed as it's redundant
    // with the new interpretation of the instruction focusing on the data1/error1 block.
    // If the intent was to modify the first block, the instruction would be applied there.
    // Given the "Code Edit" snippet, the focus is on the data1/error1 block.

    // Attempt 1: Public schema selection (modified from original 'Attempt 1: Schema selection')
    const { data: data1, error: error1 } = await supabase
        .from('api_usage')
        .select('*');

    if (error1) {
        console.error('Error fetching usage:', error1);
    } else {
        console.log('API Usage Stats (from DB):');
        console.table(data1);
    }
}

checkUsage();
