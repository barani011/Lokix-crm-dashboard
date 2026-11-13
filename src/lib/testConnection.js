
import { supabase } from './supabase';

export async function testDatabaseConnection() {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('id')
      .limit(1);

    if (error) {
      console.error('Supabase database test failed:', error);

      return {
        success: false,
        message: error.message,
        code: error.code
      };
    }

    console.log('Supabase database connected successfully!');
    console.log('Projects returned:', data);

    return {
      success: true,
      message: 'Database connected successfully!',
      data
    };
  } catch (error) {
    console.error('Supabase connection error:', error);

    return {
      success: false,
      message: error.message || 'Unable to reach Supabase.'
    };
  }
}
