
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar as CalendarIcon, MapPin, Clock, X, Edit2, Check, AlertCircle, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const API_Base = 'http://localhost:3001/api';

const Calendar = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ date: '', time: '', notes: '' });

  useEffect(() => {
    if (user?.email) {
      fetchVisits();
    } else {
        setLoading(false);
    }
  }, [user]);

  const fetchVisits = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_Base}/visits?user_email=${user.email}`);
      const data = await res.json();
      if (data.success) {
        setVisits(data.data || []);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to load visits');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this visit?')) return;
    try {
      const res = await fetch(`${API_Base}/visits/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setVisits(visits.filter(v => v.id !== id));
      } else {
        alert('Failed to cancel: ' + data.error);
      }
    } catch (err) {
      alert('Error cancelling visit');
    }
  };

  const startEdit = (visit) => {
    setEditingId(visit.id);
    const dateObj = new Date(visit.visit_time);
    setEditForm({
      date: dateObj.toISOString().split('T')[0],
      time: dateObj.toTimeString().slice(0, 5),
      notes: visit.notes || ''
    });
  };

  const saveEdit = async (id) => {
    try {
      const newDateTime = new Date(`${editForm.date}T${editForm.time}`).toISOString();
      const res = await fetch(`${API_Base}/visits/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visit_time: newDateTime,
          notes: editForm.notes
        })
      });
      const data = await res.json();
      if (data.success) {
        setEditingId(null);
        fetchVisits(); // Refresh to show updated data
      } else {
        alert('Update failed: ' + data.error);
      }
    } catch (err) {
      alert('Error updating visit');
    }
  };

  if (loading) return <div className="p-8 text-center text-text-secondary">Loading your schedule...</div>;

  return (
    <div className="max-w-5xl mx-auto pb-20">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-text-primary tracking-tight mb-2">My Schedule</h1>
          <p className="text-text-secondary">Manage your upcoming property visits and inspections.</p>
        </div>
        <button 
           onClick={() => navigate('/analyze')}
           className="flex items-center gap-2 bg-brand-primary text-white px-4 py-2 rounded-lg font-bold hover:bg-brand-secondary transition-colors"
        >
          <Plus className="h-4 w-4" /> New Visit
        </button>
      </div>

      {!user ? (
        <div className="text-center p-12 bg-surface rounded-xl border border-border">
          <p className="text-text-secondary mb-4">Please log in to view your schedule.</p>
          <button onClick={() => navigate('/login')} className="text-brand-primary font-bold">Log In</button>
        </div>
      ) : visits.length === 0 ? (
        <div className="text-center p-12 bg-surface rounded-xl border border-border border-dashed">
          <CalendarIcon className="h-12 w-12 text-text-secondary mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-bold text-text-primary mb-2">No Scheduled Visits</h3>
          <p className="text-text-secondary max-w-md mx-auto mb-6">You haven't scheduled any property visits yet. Analyze a property to book a tour.</p>
          <button 
             onClick={() => navigate('/analyze')} 
             className="text-brand-primary font-bold hover:underline"
          >
            Find Properties
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          <AnimatePresence>
            {visits.map((visit) => (
              <motion.div
                key={visit.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-surface border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
              >
                 <div className="flex flex-col md:flex-row gap-6">
                    {/* Date Badge */}
                    <div className="flex-shrink-0 flex flex-col items-center justify-center bg-brand-primary/10 rounded-lg p-4 min-w-[100px] border border-brand-primary/20">
                        <span className="text-xs font-bold text-brand-primary uppercase tracking-wider">
                           {new Date(visit.visit_time).toLocaleDateString(undefined, { month: 'short' })}
                        </span>
                        <span className="text-3xl font-black text-brand-primary">
                           {new Date(visit.visit_time).getDate()}
                        </span>
                        <span className="text-xs font-medium text-text-secondary">
                           {new Date(visit.visit_time).toLocaleDateString(undefined, { weekday: 'short' })}
                        </span>
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                       {editingId === visit.id ? (
                           // Edit Mode
                           <div className="space-y-4 max-w-lg">
                               <div className="grid grid-cols-2 gap-4">
                                   <div>
                                       <label className="text-xs font-bold text-text-secondary uppercase mb-1 block">Date</label>
                                       <input 
                                         type="date" 
                                         value={editForm.date}
                                         onChange={e => setEditForm({...editForm, date: e.target.value})}
                                         className="w-full bg-background border border-border rounded p-2 text-sm"
                                       />
                                   </div>
                                   <div>
                                       <label className="text-xs font-bold text-text-secondary uppercase mb-1 block">Time</label>
                                       <input 
                                         type="time" 
                                         value={editForm.time}
                                         onChange={e => setEditForm({...editForm, time: e.target.value})}
                                         className="w-full bg-background border border-border rounded p-2 text-sm"
                                       />
                                   </div>
                               </div>
                               <div>
                                   <label className="text-xs font-bold text-text-secondary uppercase mb-1 block">Notes</label>
                                   <textarea 
                                      value={editForm.notes}
                                      onChange={e => setEditForm({...editForm, notes: e.target.value})}
                                      className="w-full bg-background border border-border rounded p-2 text-sm h-20"
                                   />
                               </div>
                               <div className="flex gap-2">
                                   <button onClick={() => saveEdit(visit.id)} className="flex items-center gap-1 bg-green-500 text-white px-3 py-1.5 rounded text-sm font-bold">
                                       <Check className="h-3 w-3" /> Save
                                   </button>
                                   <button onClick={() => setEditingId(null)} className="flex items-center gap-1 bg-surface-elevated text-text-secondary px-3 py-1.5 rounded text-sm font-bold border border-border">
                                       <X className="h-3 w-3" /> Cancel
                                   </button>
                               </div>
                           </div>
                       ) : (
                           // View Mode
                           <>
                             <div className="flex items-start justify-between">
                                <div>
                                    <h3 className="text-xl font-bold text-text-primary mb-1">{visit.property_address}</h3>
                                    <div className="flex items-center gap-4 text-sm text-text-secondary mt-2">
                                        <div className="flex items-center gap-1.5">
                                            <Clock className="h-4 w-4 text-brand-primary" />
                                            {new Date(visit.visit_time).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                        <div className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase ${
                                            visit.status === 'scheduled' ? 'bg-green-500/10 text-green-500' : 'bg-gray-500/10 text-gray-500'
                                        }`}>
                                            {visit.status}
                                        </div>
                                    </div>
                                    {visit.notes && (
                                        <p className="mt-4 text-sm text-text-secondary bg-surface-elevated p-3 rounded-lg border border-border inline-block max-w-2xl">
                                            <span className="font-bold opacity-70 block text-[10px] uppercase mb-1">Notes</span>
                                            {visit.notes}
                                        </p>
                                    )}
                                </div>

                                <div className="flex flex-col gap-2">
                                     <button 
                                        onClick={() => startEdit(visit)}
                                        className="p-2 text-text-secondary hover:text-brand-primary hover:bg-brand-primary/10 rounded-lg transition-colors"
                                        title="Edit Visit"
                                     >
                                        <Edit2 className="h-4 w-4" />
                                     </button>
                                     <button 
                                        onClick={() => handleCancel(visit.id)}
                                        className="p-2 text-text-secondary hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                        title="Cancel Visit"
                                     >
                                        <X className="h-4 w-4" />
                                     </button>
                                </div>
                             </div>
                           </>
                       )}
                    </div>
                 </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default Calendar;
