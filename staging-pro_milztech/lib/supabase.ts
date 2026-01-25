
import { createClient } from '@supabase/supabase-js';

// Vite環境(import.meta.env)とNode/Cloudflare環境(process.env)の両方をチェックします
const getEnv = (name: string) => {
  // @ts-ignore
  return (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[name]) || process.env[name];
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL') || 'https://ptbyeiuzfnsreeioqeco.supabase.co';
const supabaseKey = getEnv('VITE_SUPABASE_ANON_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0YnllaXV6Zm5zcmVlaW9xZWNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxNDEzNzYsImV4cCI6MjA4NDcxNzM3Nn0.raVOXrqmHAXLmGN05I7qYy2BtInzwCwZGSpO9dRHEis';

export const supabase = createClient(supabaseUrl, supabaseKey);

export const db = {
  submissions: {
    async fetchAll() {
      try {
        const { data, error } = await supabase
          .from('submissions')
          .select('*')
          .order('timestamp', { ascending: false });
        if (error) throw error;
        return data || [];
      } catch (err) {
        console.error("Submissions FetchAll Error:", err);
        return [];
      }
    },
    async fetchByUser(userId: string) {
      try {
        const { data, error } = await supabase
          .from('submissions')
          .select('*')
          .eq('ownerId', userId)
          .order('timestamp', { ascending: false });
        if (error) throw error;
        return data || [];
      } catch (err) {
        console.error("Submissions FetchByUser Error:", err);
        return [];
      }
    },
    async fetchByEditor(editorId: string) {
      try {
        const { data, error } = await supabase
          .from('submissions')
          .select('*')
          .eq('assignedEditorId', editorId)
          .order('timestamp', { ascending: false });
        if (error) throw error;
        return data || [];
      } catch (err) {
        console.error("Submissions FetchByEditor Error:", err);
        return [];
      }
    },
    async insert(submission: any) {
      const { error } = await supabase.from('submissions').insert([submission]);
      if (error) throw error;
    },
    async update(id: string, updates: any) {
      const { error } = await supabase.from('submissions').update(updates).eq('id', id);
      if (error) throw error;
    },
    async delete(id: string) {
      const { error } = await supabase.from('submissions').delete().eq('id', id);
      if (error) throw error;
    }
  },
  editors: {
    async fetchAll() {
      try {
        const { data, error } = await supabase.from('editors').select('*').order('name');
        if (error) throw error;
        return data || [];
      } catch (err) {
        console.error("Editors FetchAll Error:", err);
        return [];
      }
    },
    async insert(editor: any) {
      const { error } = await supabase.from('editors').insert([editor]);
      if (error) throw error;
    },
    async delete(id: string) {
      const { error } = await supabase.from('editors').delete().eq('id', id);
      if (error) throw error;
    }
  }
};
