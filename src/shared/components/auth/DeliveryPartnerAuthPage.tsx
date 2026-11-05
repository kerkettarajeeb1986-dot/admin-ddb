import React, { useState } from 'react';
import { Bike, MapPin, Mail, Phone, Lock, CheckCircle2, AlertCircle, RefreshCw, CreditCard, ShieldCheck } from 'lucide-react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../services/firebase';
import { useStore } from '../../context/StoreContext';
import { useAuth } from '../../context/AuthContext';
import { userService } from '../../services/userService';
import { notificationService } from '../../services/notificationService';
import { UserProfile } from '../../types';

export const DeliveryPartnerAuthPage: React.FC<{ onRegistered?: () => void }> = ({ onRegistered }) => {
  const { activeLocalAreas, isLoadingAreas } = useStore();
  const { setUserProfile } = useAuth();

  const [isLogin, setIsLogin] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [selectedAreaId, setSelectedAreaId] = useState('');
  const [address, setAddress] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [vehicleType, setVehicleType] = useState('Motorcycle');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [drivingLicenseNumber, setDrivingLicenseNumber] = useState('');
  const [upiId, setUpiId] = useState('');
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
      setError('Please select an operational Local Area where you can deliver.');
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password.trim());
        const profile = await userService.getUserProfile(userCredential.user.uid);
        if (profile) {
          setUserProfile(profile);
        } else {
          const riderProfile: UserProfile = {
            uid: userCredential.user.uid,
            email: userCredential.user.email || email.trim(),
            displayName: userCredential.user.displayName || 'Delivery Partner',
            role: 'delivery_partner',
            status: 'pending',
          };
          await userService.createUserProfile(riderProfile);
          setUserProfile(riderProfile);
        }
        setSuccess('Logged in as Delivery Partner successfully!');
        if (onRegistered) onRegistered();
      } else {
        let riderUid = '';
        try {
          const cred = await createUserWithEmailAndPassword(auth, email.trim(), password.trim());
          riderUid = cred.user.uid;
        } catch (authErr: any) {
          if (authErr.code === 'auth/email-already-in-use') {
            const cred = await signInWithEmailAndPassword(auth, email.trim(), password.trim());
            riderUid = cred.user.uid;
          } else {
            throw authErr;
          }
        }

        const chosenArea = activeLocalAreas.find((a) => a.id === selectedAreaId);
        const riderProfile: UserProfile = {
          uid: riderUid,
          email: email.trim().toLowerCase(),
          displayName: fullName.trim(),
          phone: phone.trim(),
          role: 'delivery_partner',
          localAreaId: selectedAreaId,
          localAreaName: chosenArea ? chosenArea.name : '',
          district: chosenArea?.district || 'Alipurduar',
          state: chosenArea?.state || 'West Bengal',
          pinCode: pinCode.trim() || (chosenArea?.pinCodes[0] || ''),
          address: address.trim(),
          vehicleType,
          vehicleNumber: vehicleNumber.trim().toUpperCase(),
          drivingLicenseNumber: drivingLicenseNumber.trim().toUpperCase(),
          bankDetails: {
            upiId: upiId.trim(),
          },
          status: 'pending', // Starts as pending for Super Admin approval
          isAvailable: true,
          isOnline: true,
          completedDeliveries: 0,
          totalDeliveryEarnings: 0,
        };

        await userService.createUserProfile(riderProfile);
        setUserProfile(riderProfile);

        // Notify Super Admin
        await notificationService.sendNotification(
          'new_rider_application',
          'New Delivery Rider Application',
          `${fullName} (${vehicleType}) applied for delivery fleet in ${riderProfile.localAreaName} — requires review.`,
          'delivery_partners',
          riderUid
        );

        setSuccess('Application submitted successfully! Super Admin will review and verify your documents.');
        if (onRegistered) onRegistered();
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto my-8 bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-sm">
      <div className="text-center mb-6">
        <div className="w-12 h-12 bg-emerald-100 text-emerald-800 rounded-2xl flex items-center justify-center mx-auto mb-3">
          <Bike className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
          {isLogin ? 'Delivery Fleet Partner Sign In' : 'Delivery Fleet Partner Application'}
        </h2>
        <p className="text-xs text-gray-500 mt-1">
          {isLogin
            ? 'Access your active delivery dispatch & daily earnings'
            : 'Earn flexible income delivering daily grocery baskets in Dooars'}
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
          <>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Full Legal Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Raju Sharma"
                className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Vehicle Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value)}
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                >
                  <option value="Motorcycle">Motorcycle</option>
                  <option value="Scooter">Scooter</option>
                  <option value="Electric Bike">Electric Bike (EV)</option>
                  <option value="Bicycle">Bicycle (Eco)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Vehicle Registration No.
                </label>
                <input
                  type="text"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value)}
                  placeholder="WB-74-XXXX"
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none uppercase"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Driving License Number
              </label>
              <input
                type="text"
                value={drivingLicenseNumber}
                onChange={(e) => setDrivingLicenseNumber(e.target.value)}
                placeholder="WB-XXXXXXXXXXXX"
                className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none uppercase"
              />
            </div>

            {/* DYNAMIC LOCAL AREA DROPDOWN - ONLY ACTIVE AREAS FROM FIREBASE */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Preferred Operational Local Area <span className="text-red-500">*</span>
              </label>
              {isLoadingAreas ? (
                <div className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-xs text-gray-500">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                  <span>Loading operational areas from Firebase...</span>
                </div>
              ) : activeLocalAreas.length === 0 ? (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 space-y-1">
                  <div className="font-semibold flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" /> No active Local Areas available
                  </div>
                  <p className="text-[11px] text-amber-700">
                    Local areas are managed exclusively by the Super Admin in Firebase.
                  </p>
                </div>
              ) : (
                <select
                  required
                  value={selectedAreaId}
                  onChange={(e) => handleAreaChange(e.target.value)}
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none bg-white text-gray-900 font-medium"
                >
                  <option value="">-- Select Active Delivery Zone ({activeLocalAreas.length} available) --</option>
                  {activeLocalAreas.map((area) => (
                    <option key={area.id} value={area.id}>
                      🟢 {area.name} ({area.district}) — PINs: {area.pinCodes.join(', ')}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Residential Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street / locality / landmark"
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none"
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
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Payout UPI ID (PhonePe / GPay)
              </label>
              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="rider@upi"
                className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              />
            </div>
          </>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="rider@example.com"
              className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Mobile Number <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98000 XXXXX"
              className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none font-mono"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
            Password <span className="text-red-500">*</span>
          </label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={loading || (!isLogin && activeLocalAreas.length === 0)}
          className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-sm font-semibold transition shadow-sm disabled:opacity-50 mt-2 cursor-pointer"
        >
          {loading ? 'Submitting Application...' : isLogin ? 'Sign In as Delivery Rider' : 'Submit Rider Application'}
        </button>
      </form>

      <div className="mt-4 pt-4 border-t border-gray-100 text-center text-xs text-gray-500">
        {isLogin ? (
          <p>
            Want to join the fleet?{' '}
            <button
              onClick={() => setIsLogin(false)}
              className="text-emerald-700 font-semibold hover:underline"
            >
              Apply as Delivery Rider
            </button>
          </p>
        ) : (
          <p>
            Already an approved rider?{' '}
            <button
              onClick={() => setIsLogin(true)}
              className="text-emerald-700 font-semibold hover:underline"
            >
              Sign In
            </button>
          </p>
        )}
      </div>
    </div>
  );
};
