import { createClient } from '@supabase/supabase-js';

const getEnv = (name: string): string | undefined => {
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      // @ts-ignore
      return import.meta.env[name];
    }
    // @ts-ignore
    if (typeof process !== 'undefined' && process.env) {
      return process.env[name];
    }
  } catch (e) {
    return undefined;
  }
  return undefined;
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL') || 'https://ptbyeiuzfnsreeioqeco.supabase.co';
const supabaseKey = getEnv('VITE_SUPABASE_ANON_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0YnllaXV6Zm5zcmVlaW9xZWNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxNDEzNzYsImV4cCI6MjA4NDcxNzM3Nn0.raVOXrqmHAXLmGN05I7qYy2BtInzwCwZGSpO9dRHEis';

export const supabase = createClient(supabaseUrl, supabaseKey);

export const db = {
  storage: {
    async upload(path: string, base64Data: string) {
      try {
        const mimeMatch = base64Data.match(/^data:(.*);base64,/);
        const contentType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
        
        const base64Content = base64Data.split(',')[1];
        const byteCharacters = atob(base64Content);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: contentType });

        const { data, error } = await supabase.storage
          .from('submissions')
          .upload(path, blob, {
            contentType: contentType,
            upsert: true
          });

        if (error) {
          if (error.message.includes('row-level security')) {
            throw new Error('STORAGE_POLICY_ERROR: SupabaseのStorage Policiesでアップロード権限(INSERT)を許可してください。');
          }
          throw error;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('submissions')
          .getPublicUrl(path);

        return publicUrl;
      } catch (err) {
        console.error("Storage Upload Error:", err);
        throw err;
      }
    }
  },
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
