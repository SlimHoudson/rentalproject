import React, { useState, useEffect } from 'react';
import api from '../utils/api';

const AdminUsersPage = () => {
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [modal, setModal] = useState(null); // { type: 'delete' | 'role', user }

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setIsLoading(true);
            const res = await api.get('/users');
            setUsers(res.data?.data || res.data || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteUser = async () => {
        const { user } = modal;
        try {
            await api.delete(`/users/${user._id}`);
            setUsers(users.filter(u => u._id !== user._id));
            setModal(null);
        } catch (err) {
            alert('Protocol failure: ' + err.message);
        }
    };

    const handleChangeRole = async () => {
        const { user } = modal;
        const nextRole = user.role === 'admin' ? 'user' : 'admin';
        try {
            const res = await api.put(`/users/${user._id}`, { role: nextRole });
            const updatedUser = res.data?.data || res.data;
            setUsers(users.map(u => u._id === user._id ? updatedUser : u));
            setModal(null);
        } catch (err) {
            alert('Protocol failure: ' + err.message);
        }
    };

    const filteredUsers = users.filter(u => 
        (u.name || '').toLowerCase().includes(search.toLowerCase()) || 
        (u.email || '').toLowerCase().includes(search.toLowerCase())
    );

    if (isLoading) {
        return (
            <div className="min-h-[80vh] flex items-center justify-center">
                <div className="flex flex-col items-center gap-6">
                    <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground animate-pulse">Syncing User Registry</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 lg:p-12 space-y-12 animate-fade-in max-w-[1600px] mx-auto">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div className="space-y-2">
                    <h2 className="text-4xl font-black tracking-tight text-foreground uppercase">Identity Management</h2>
                    <p className="text-muted-foreground font-medium flex items-center gap-3">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest border border-primary/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                            Active Registry
                        </span>
                        {users.length} verified identities within the sanctuary
                    </p>
                </div>
            </header>

            <div className="card overflow-hidden">
                <header className="p-8 border-b border-border flex flex-col lg:flex-row items-center gap-8 bg-muted/10">
                    <div className="relative w-full lg:w-96 group">
                        <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground/50 group-focus-within:text-primary transition-colors">person_search</span>
                        <input 
                            className="w-full pl-14 pr-6 py-4 rounded-2xl text-xs font-bold border border-border bg-muted/30 outline-none focus:bg-card focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all uppercase tracking-widest" 
                            placeholder="Scan identities..." 
                            value={search} 
                            onChange={(e) => setSearch(e.target.value)} 
                        />
                    </div>
                    <div className="ml-auto text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                        Syncing {filteredUsers.length} entries
                    </div>
                </header>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-muted/5 border-b border-border">
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Entity Profile</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Protocol Authority</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Registry Date</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground text-right">Administrative</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="py-24 text-center">
                                        <div className="flex flex-col items-center gap-6 opacity-20">
                                            <span className="material-symbols-outlined text-7xl">face_retouching_off</span>
                                            <p className="text-[10px] font-black uppercase tracking-[0.3em]">No matching entities found</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((u) => (
                                    <tr key={u._id} className="hover:bg-muted/5 transition-colors group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-6">
                                                <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-xl font-black text-primary shadow-inner">
                                                    {(u.name || 'U').charAt(0).toUpperCase()}
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="font-black text-foreground text-sm uppercase tracking-tight">{u.name}</p>
                                                    <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">{u.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <button 
                                                onClick={() => setModal({ type: 'role', user: u })}
                                                className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-[0.15em] border transition-all hover:scale-105 active:scale-95 ${
                                                    u.role === 'admin' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-muted text-muted-foreground border-border'
                                                }`}
                                            >
                                                {u.role}
                                            </button>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3 text-muted-foreground">
                                                <span className="material-symbols-outlined text-sm">event</span>
                                                <span className="text-[11px] font-black uppercase tracking-widest">
                                                    {new Date(u.createdAt).toLocaleDateString('en-US', {
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: '2-digit'
                                                    })}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <button
                                                onClick={() => setModal({ type: 'delete', user: u })}
                                                className="w-10 h-10 rounded-2xl bg-card border border-border text-destructive shadow-xl hover:bg-destructive/10 transition-all flex items-center justify-center ml-auto opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0"
                                            >
                                                <span className="material-symbols-outlined text-base">person_remove</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modals */}
            {modal?.type === 'delete' && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-card border border-border rounded-[3rem] p-12 max-w-md w-full shadow-2xl text-center space-y-8">
                        <div className="w-20 h-20 rounded-3xl bg-destructive/10 flex items-center justify-center mx-auto shadow-inner">
                            <span className="material-symbols-outlined text-4xl text-destructive">warning</span>
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-2xl font-black text-foreground tracking-tight uppercase">Purge Entity?</h3>
                            <p className="text-muted-foreground text-sm font-medium">You are about to remove <span className="text-foreground font-black tracking-tight">{modal.user.name}</span> from the sanctuary registry.</p>
                        </div>
                        <div className="flex gap-4">
                            <button onClick={() => setModal(null)} className="flex-1 py-4 rounded-2xl border border-border text-muted-foreground font-black text-[10px] uppercase tracking-widest hover:bg-muted/50 transition-all">Abort</button>
                            <button onClick={handleDeleteUser} className="flex-1 py-4 rounded-2xl bg-destructive text-white font-black text-[10px] uppercase tracking-widest hover:brightness-110 shadow-2xl shadow-destructive/20 transition-all">Authorize Purge</button>
                        </div>
                    </div>
                </div>
            )}

            {modal?.type === 'role' && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-card border border-border rounded-[3rem] p-12 max-w-md w-full shadow-2xl text-center space-y-8">
                        <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto shadow-inner">
                            <span className="material-symbols-outlined text-4xl text-primary">security</span>
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-2xl font-black text-foreground tracking-tight uppercase">Authority Override</h3>
                            <p className="text-muted-foreground text-sm font-medium">Elevate or revoke authority for <span className="text-foreground font-black tracking-tight">{modal.user.name}</span>?</p>
                        </div>
                        <div className="flex gap-4">
                            <button onClick={() => setModal(null)} className="flex-1 py-4 rounded-2xl border border-border text-muted-foreground font-black text-[10px] uppercase tracking-widest hover:bg-muted/50 transition-all">Cancel</button>
                            <button onClick={handleChangeRole} className="flex-1 py-4 rounded-2xl bg-primary text-white font-black text-[10px] uppercase tracking-widest hover:brightness-110 shadow-2xl shadow-primary/20 transition-all">Confirm Change</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminUsersPage;
