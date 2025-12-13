'use client';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return; // Still loading
    if (!session) {
      router.push('/login');
    }
  }, [session, status, router]);

  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!session) {
    return null; // Will redirect
  }

  const user = session.user!;

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p>Welcome, {user.name}!</p>
      <p>Role: {user.role}</p>
      {/* Conditional rendering based on role */}
      {user.role === 'Admin' && (
        <div>
          <h2>Admin Tools</h2>
          <p>Manage system users, businesses, etc.</p>
        </div>
      )}
      {user.role === 'Owner' && (
        <div>
          <h2>Owner Tools</h2>
          <p>Manage your business, agents, transactions.</p>
        </div>
      )}
      {/* Add more based on permissions */}
    </div>
  );
}