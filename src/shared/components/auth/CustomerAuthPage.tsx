import React, { useState } from 'react';
import { ShoppingBag, User, Mail, Phone, Lock, MapPin, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../services/firebase';
import { useAuth } from '../../context/AuthContext';
import { useStore } from '../../context/StoreContext';
import { userService } from '../../services/userService';
import { notificationService } from '../../services/notificationService';
import { UserProfile } from '../../types';

export const CustomerAuthPage: React.FC<{ onRegistered?: () => void }> = ({ onRegistered }) => {
  const { setUserProfile } = useAuth();
  const { activeLocalAreas, isLoadingAreas } = useStore();

  const [isLogin, setIsLogin] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [selectedAreaId, setSelectedAreaId] = useState('');
  const [address, setAddress] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleAreaChange = (areaId: string) => {
    setSelectedAreaId(areaId);
    const chosenArea = activeLocalAreas.find((a) => a.id === areaId);
    if (chosenArea && chosenArea.pinCodes.length > 0) {
      setPinCode(chosenArea.pinCodes[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!isLogin && !selectedAreaId) {
      setError('Please select your Local Area in Dooars for grocery deliveries.');
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        // Real Firebase sign in flow
        const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password.trim());
        const profile = await userService.getUserProfile(userCredential.user.uid);
        if (profile) {
          setUserProfile(profile);
        } else {
          const realCustomer: UserProfile = {
            uid: userCredential.user.uid,
            email: userCredential.user.email || email.trim(),
            displayName: userCredential.user.displayName || 'Customer',
            role: 'customer',
            status: 'active',
          };
          await userService.createUserProfile(realCustomer);
          setUserProfile(realCustomer);
        }
        setSuccess('Welcome back! Signed in successfully.');
        if (onRegistered) onRegistered();
      } else {
        // Real Firebase registration flow
        let userUid = '';
        try {
          const cred = await createUserWithEmailAndPassword(auth, email.trim(), password.trim());
          userUid = cred.user.uid;
        } catch (authErr: any) {
          if (authErr.code === 'auth/email-already-in-use') {
            const cred = await signInWithEmailAndPassword(auth, email.trim(), password.trim());
            userUid = cred.user.uid;
          } else {
            throw authErr;
          }
        }

        const chosenArea = activeLocalAreas.find((a) => a.id === selectedAreaId);
        const newCustomer: UserProfile = {
          uid: userUid,
          email: email.trim().toLowerCase(),
          displayName: fullName.trim(),
          phone: phone.trim(),
          role: 'customer',
          localAreaId: selectedAreaId,
          localAreaName: chosenArea ? chosenArea.name : '',
          pinCode: pinCode.trim() || (chosenArea?.pinCodes[0] || '735206'),
          district: chosenArea?.district || 'Alipurduar',
          state: chosenArea?.state || 'West Bengal',
          address: address.trim(),
          status: 'active',
          totalOrders: 0,
          totalSpent: 0,
        };

        // Write directly to genuine Firestore collection
        await userService.createUserProfile(newCustomer);
        setUserProfile(newCustomer);

        // Send real-time notification to Super Admin
        await notificationService.sendNotification(
          'new_customer',
          'New Customer Registration',
          `${newCustomer.displayName} (${newCustomer.phone || newCustomer.email}) registered from ${newCustomer.localAreaName}`,
          'customers',
          userUid
        );

        setSuccess('Account created successfully! Welcome to Dooars Daily Basket.');
        if (onRegistered) onRegistered();
      }
    } catch (err: any) {
      setError(err.message || 'Authentication error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-8 bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-sm">
      <div className="text-center mb-6">
        <div className="w-14 h-14 bg-emerald-100 text-emerald-800 rounded-2xl flex items-center justify-center mx-auto mb-3">
          <ShoppingBag className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
          {isLogin ? 'Customer Sign In' : 'Create Customer Account'}
        </h2>
        <p className="text-xs text-gray-500 mt-1">
          {isLogin
            ? 'Access your daily basket cart, tracking & order history'
            : 'Get farm-fresh produce & groceries delivered to your home'}
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {!isLogin && (
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Your Full Name"
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              />
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
            Email Address <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="customer@example.com"
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none"
            />
          </div>
        </div>

        {!isLogin && (
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Mobile Number <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 9876543210"
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              />
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
            Password <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none"
            />
          </div>
        </div>

        {!isLogin && (
          <>
            {/* Real-time Local Area Dropdown */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Your Local Area (Dooars) <span className="text-red-500">*</span>
              </label>
              {isLoadingAreas ? (
                <div className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-xs text-gray-500">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                  <span>Loading serviceable areas...</span>
                </div>
              ) : activeLocalAreas.length === 0 ? (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                  No active local areas configured by Admin currently.
                </div>
              ) : (
                <div className="relative">
                  <MapPin className="w-4 h-4 text-emerald-600 absolute left-3 top-2.5" />
                  <select
                    required
                    value={selectedAreaId}
                    onChange={(e) => handleAreaChange(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  >
                    <option value="">-- Choose your Local Area --</option>
                    {activeLocalAreas.map((area) => (
                      <option key={area.id} value={area.id}>
                        {area.name} — {area.district} ({area.pinCodes.join(', ')})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Delivery Address / Landmark
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="House / Road / Landmark"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  PIN Code
                </label>
                <input
                  type="text"
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value)}
                  placeholder="PIN"
                  maxLength={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>
            </div>
          </>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-sm font-semibold transition shadow-sm flex items-center justify-center gap-2 cursor-pointer"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : isLogin ? (
            'Sign In to Account'
          ) : (
            'Register as Customer'
          )}
        </button>
      </form>

      <div className="mt-4 text-center">
        <button
          type="button"
          onClick={() => {
            setIsLogin(!isLogin);
            setError(null);
            setSuccess(null);
          }}
          className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold"
        >
          {isLogin ? "Don't have an account? Register here" : 'Already registered? Sign In'}
        </button>
      </div>
    </div>
  );
};
