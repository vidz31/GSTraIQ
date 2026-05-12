import React, { useState, useEffect } from 'react';
import { 
  User, 
  Building2, 
  Fingerprint, 
  Globe, 
  MapPin, 
  Phone, 
  Mail, 
  Briefcase,
  Save,
  CheckCircle2,
  UserPlus,
  ShieldCheck,
  Trash2,
  Users
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Profile = () => {
  const [isSaving, setIsSaving] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [members, setMembers] = useState([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const { user, updateUser, activeBusiness } = useAuth();
  const activeBusinessId = activeBusiness?._id;
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    if (user) {
      reset({
        businessName: user.businessName || '',
        gstin: user.gstin || '',
        industry: user.industry || '',
        turnover: user.turnover || '',
        address: user.address || '',
        email: user.email || '',
        phone: user.phone || ''
      });
    }
  }, [user, reset]);

  useEffect(() => {
    const fetchMembers = async () => {
      if (!activeBusinessId) return;
      try {
        const response = await api.get(`/businesses/${activeBusinessId}`);
        setMembers(response.data.members || []);
      } catch (error) {
        console.error('Failed to fetch members');
      }
    };
    fetchMembers();
  }, [activeBusinessId]);

  const onSubmit = async (data) => {
    setIsSaving(true);
    try {
      const response = await api.put('/auth/profile', data);
      updateUser(response.data);
      toast.success('Business profile updated successfully!');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!activeBusinessId) return toast.error('Please select a business first');
    
    setIsInviting(true);
    try {
      await api.post(`/businesses/${activeBusinessId}/invite`, {
        email: inviteEmail,
        role: 'ca'
      });
      toast.success(`Invitation sent to ${inviteEmail}`);
      setInviteEmail('');
      // Refresh members
      const response = await api.get(`/businesses/${activeBusinessId}`);
      setMembers(response.data.members || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send invitation');
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemoveMember = async (memberUserId) => {
    if (!activeBusinessId) return;
    if (!window.confirm('Are you sure you want to remove this member?')) return;

    try {
      await api.delete(`/businesses/${activeBusinessId}/members/${memberUserId}`);
      toast.success('Member removed successfully');
      // Refresh members
      const response = await api.get(`/businesses/${activeBusinessId}`);
      setMembers(response.data.members || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to remove member');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Business Profile</h1>
          <p className="text-gray-500 font-medium">Configure your business details and manage your team.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <div className="card text-center p-8">
            <div className="w-24 h-24 bg-gradient-to-br from-primary-500 to-primary-700 rounded-3xl mx-auto mb-4 flex items-center justify-center text-white shadow-xl shadow-primary-100 border-4 border-white">
              <Building2 size={40} />
            </div>
            <h2 className="text-xl font-bold text-gray-900">{user?.businessName || 'Your Business'}</h2>
            <p className="text-sm text-gray-500 font-medium mb-6 uppercase tracking-wider">Verified Business</p>
            <div className="pt-6 border-t border-gray-100 flex justify-center gap-4">
               <div className="text-center">
                  <p className="text-lg font-bold text-gray-900">98%</p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase">Health Score</p>
               </div>
               <div className="w-px h-8 bg-gray-100"></div>
               <div className="text-center">
                  <p className="text-lg font-bold text-gray-900">Active</p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase">Status</p>
               </div>
            </div>
          </div>

          <div className="card bg-primary-900 text-white p-6">
             <h3 className="font-bold mb-2 flex items-center gap-2">
                <CheckCircle2 size={18} className="text-primary-400" />
                Why complete this?
             </h3>
             <p className="text-xs text-primary-200 leading-relaxed">
                Accurate business information allows GSTraIQ to apply industry-specific tax rules, identify niche-specific anomalies, and provide more precise revenue forecasts.
             </p>
          </div>
        </div>

        {/* Profile Form */}
        <div className="lg:col-span-2 space-y-8">
          <form onSubmit={handleSubmit(onSubmit)} className="card p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-2">Legal Business Name</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    {...register('businessName', { required: true })}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">GSTIN Number</label>
                <div className="relative">
                  <Fingerprint className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    {...register('gstin', { required: true, pattern: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/ })}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all uppercase"
                    placeholder="27AAAAA0000A1Z5"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Industry Sector</label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <select 
                    {...register('industry')}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all appearance-none"
                  >
                    <option>Technology</option>
                    <option>Manufacturing</option>
                    <option>Retail</option>
                    <option>Healthcare</option>
                    <option>Logistics</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Annual Turnover</label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <select 
                    {...register('turnover')}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all appearance-none"
                  >
                    <option>Under 1.5Cr</option>
                    <option>1.5Cr - 5Cr</option>
                    <option>5Cr - 10Cr</option>
                    <option>10Cr - 50Cr</option>
                    <option>Above 50Cr</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Primary Phone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    {...register('phone')}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-2">Registered Address</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-4 text-gray-400" size={18} />
                  <textarea 
                    {...register('address')}
                    rows={3}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all resize-none"
                  ></textarea>
                </div>
              </div>
            </div>

            <div className="pt-6 flex justify-end">
              <button 
                type="submit" 
                disabled={isSaving}
                className="btn-primary px-8 py-3 flex items-center gap-2 disabled:opacity-70"
              >
                {isSaving ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                ) : (
                  <Save size={20} />
                )}
                <span>Update Business Profile</span>
              </button>
            </div>
          </form>

          {/* CA / Team Management Section */}
          <div className="card p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Users className="text-primary-600" size={20} />
                  Manage Team & CA
                </h3>
                <p className="text-sm text-gray-400">Invite your Accountant or CA to manage this business.</p>
              </div>
            </div>

            {!activeBusinessId ? (
              <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <Building2 className="mx-auto text-gray-300 mb-3" size={40} />
                <p className="text-sm text-gray-500 font-medium mb-4">You need to create a business before you can invite a CA.</p>
                <p className="text-xs text-gray-400">Click the "+ Add Business" button in the top navbar to get started.</p>
              </div>
            ) : (
              <>
                <form onSubmit={handleInvite} className="flex gap-3 mb-8">
                  <div className="relative flex-1">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      type="email"
                      required
                      placeholder="CA or Partner's Email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all"
                    />
                  </div>
                  <button 
                    type="submit"
                    disabled={isInviting || !inviteEmail}
                    className="px-6 py-2.5 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    <UserPlus size={18} />
                    {isInviting ? 'Sending...' : 'Invite CA'}
                  </button>
                </form>

                <div className="space-y-4">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Active Members</p>
                  {members.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                      <p className="text-sm text-gray-400 italic">No team members added yet.</p>
                    </div>
                  ) : (
                    members.map((member, idx) => (
                      <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-primary-600 font-bold shadow-sm border border-gray-100">
                            {member.user?.name?.[0] || member.user?.email?.[0] || '?'}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900">{member.user?.name || 'Pending User'}</p>
                            <p className="text-xs text-gray-500">{member.user?.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-tight ${
                            member.role === 'owner' ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'
                          }`}>
                            {member.role}
                          </span>
                          {member.role !== 'owner' && (
                            <button 
                              onClick={() => handleRemoveMember(member.user?._id)}
                              className="text-gray-300 hover:text-red-500 transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
