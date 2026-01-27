
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ClientPlatform } from './components/ClientPlatform';
import { AdminDashboard } from './components/AdminDashboard';
import { LandingPage } from './components/LandingPage';
import { Submission, User, Editor } from './types';
import { Layout } from './components/Layout';
import { Login } from './components/Login';
import { supabase, db } from './lib/supabase';
import { sendStudioEmail, EMAIL_TEMPLATES } from './lib/email';

const ADMIN_EMAILS = [
  'masashi@milz.tech', 
  'masashi@thisismerci.com'
];

const normalizeEmail = (email: string | undefined | null) => {
  if (!email) return '';
  return email.toLowerCase().trim().replace(/[\s\p{C}]/gu, '');
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [editors, setEditors] = useState<Editor[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [showAuth, setShowAuth] = useState(false);
  const initializationId = useRef(0);

  const loadSubmissions = useCallback(async (currentUserId: string, role: string, editorRecordId?: string) => {
    setIsSyncing(true);
    try {
      let subData: Submission[] = [];
      if (role === 'admin') {
        subData = await db.submissions.fetchAll() as Submission[];
      } else if (role === 'editor' && editorRecordId) {
        subData = await db.submissions.fetchByEditor(editorRecordId) as Submission[];
      } else {
        subData = await db.submissions.fetchByUser(currentUserId) as Submission[];
      }
      setSubmissions(subData || []);
    } catch (e) {
      console.error("[Data] Sync Error:", e);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  const identifyAndInitialize = async (authSession: any) => {
    const currentId = ++initializationId.current;
    try {
      if (authSession?.user) {
        const authEmail = normalizeEmail(authSession.user.email);
        let role: 'admin' | 'editor' | 'user' = 'user';
        
        if (ADMIN_EMAILS.some(e => normalizeEmail(e) === authEmail)) {
          role = 'admin';
        }

        let editorsList: Editor[] = [];
        try {
          editorsList = await db.editors.fetchAll() as Editor[];
          setEditors(editorsList);
        } catch (err) {
          console.warn("[Auth] Editor list fetch failed", err);
        }

        if (currentId !== initializationId.current) return;

        const matchedEditor = editorsList.find(e => normalizeEmail(e.email) === authEmail);
        let editorRecordId: string | undefined = undefined;
        if (matchedEditor) {
          editorRecordId = matchedEditor.id;
          if (role !== 'admin') role = 'editor';
        }

        const finalUser: User = { id: authSession.user.id, email: authEmail, role, editorRecordId };
        await loadSubmissions(finalUser.id, finalUser.role, finalUser.editorRecordId);
        
        if (currentId !== initializationId.current) return;
        setUser(finalUser);
      } else {
        setUser(null);
        setSubmissions([]);
      }
    } catch (err) {
      console.error("[Auth] Initialization error:", err);
    } finally {
      if (currentId === initializationId.current) {
        setIsInitializing(false);
      }
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => identifyAndInitialize(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (_event === 'SIGNED_IN') setIsInitializing(true);
      if (_event === 'SIGNED_IN' || _event === 'INITIAL_SESSION' || _event === 'SIGNED_OUT') {
        identifyAndInitialize(session);
      }
    });
    return () => subscription.unsubscribe();
  }, [loadSubmissions]);

  const handleLogout = async () => {
    setIsInitializing(true);
    setUser(null);
    setShowAuth(false);
    setSubmissions([]);
    await supabase.auth.signOut();
    setIsInitializing(false);
  };

  const handleUpdateStatus = async (id: string, updates: Partial<Submission>) => {
    try {
      await db.submissions.update(id, updates);
      
      // メール送信用のデータを特定（現在のステートまたは更新後のデータ）
      const currentSub = submissions.find(s => s.id === id);
      
      setSubmissions(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));

      // 納品通知メールのトリガー
      if (updates.resultDataUrl && currentSub?.ownerEmail) {
        try {
          await sendStudioEmail(
            currentSub.ownerEmail,
            `Results Ready for Review: ${currentSub.id}`,
            EMAIL_TEMPLATES.DELIVERY_READY(currentSub.id)
          );
          console.log(`[Email] Delivery notification sent to ${currentSub.ownerEmail}`);
        } catch (e) {
          console.error("[Email] Delivery notification failed:", e);
        }
      }
    } catch (err: any) {
      console.error("Database Update Error:", err);
      alert(`Update Failed: ${err.message}`);
    }
  };

  const handleDeliverWithEmail = async (id: string, dataUrl: string) => {
    const nextStatus = user?.role === 'admin' ? 'completed' : 'reviewing';
    await handleUpdateStatus(id, { resultDataUrl: dataUrl, status: nextStatus });
  };

  const handleNewSubmission = async (s: Submission) => {
    try {
      await db.submissions.insert(s);
      setSubmissions(prev => [s, ...prev]);
    } catch (err: any) {
      console.error("Insert Error:", err);
      throw err;
    }
  };

  if (isInitializing) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-6">
      <div className="relative">
        <div className="w-16 h-16 border-[3px] border-slate-200 rounded-full"></div>
        <div className="absolute top-0 left-0 w-16 h-16 border-[3px] border-slate-900 border-t-transparent rounded-full animate-spin"></div>
      </div>
      <div className="text-center space-y-2">
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-900">Synchronizing Session</p>
        <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">Accessing StagingPro Studio Cluster</p>
      </div>
    </div>
  );

  if (!user) {
    if (showAuth) {
      return <Login onLogin={() => {}} onBack={() => setShowAuth(false)} />;
    }
    return <LandingPage onStart={() => setShowAuth(true)} />;
  }

  return (
    <Layout user={user} onLogout={handleLogout}>
      {(user.role === 'admin' || user.role === 'editor') ? (
        <AdminDashboard 
          user={user}
          submissions={submissions} 
          onDelete={(id) => db.submissions.delete(id).then(() => setSubmissions(s => s.filter(x => x.id !== id)))}
          onDeliver={handleDeliverWithEmail}
          onRefresh={() => loadSubmissions(user.id, user.role, user.editorRecordId)}
          onAssign={(id, editorId) => {
            const editorVal = editorId || undefined;
            handleUpdateStatus(id, { assignedEditorId: editorVal, status: editorId ? 'processing' : 'pending' });
          }}
          onApprove={(id) => handleUpdateStatus(id, { status: 'completed' })}
          onReject={(id, notes) => handleUpdateStatus(id, { status: 'processing', revisionNotes: notes })}
          isSyncing={isSyncing}
          editors={editors}
          onAddEditor={async (name, specialty, email) => {
            const newEditor = { id: `ed_${Math.random().toString(36).substr(2, 5)}`, name, email: email?.toLowerCase().trim(), specialty };
            await db.editors.insert(newEditor);
            const list = await db.editors.fetchAll() as Editor[];
            setEditors(list);
          }}
          onDeleteEditor={(id) => db.editors.delete(id).then(() => setEditors(e => e.filter(x => x.id !== id)))}
        />
      ) : (
        <ClientPlatform 
          user={user}
          onSubmission={handleNewSubmission} 
          userSubmissions={submissions}
        />
      )}
    </Layout>
  );
};

export default App;
