import React, { useState } from 'react';
import { X, MapPin, CheckCircle2, ShoppingBag, ShieldCheck, Truck, QrCode, Banknote, Smartphone } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useStore } from '../../context/StoreContext';
import { useAuth } from '../../context/AuthContext';
import { orderService } from '../../services/orderService';
import { pricingService } from '../../services/pricingService';
import { PaymentStatus } from '../../types';

export const GroceryShippingCheckout: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const { cart, clearCart, selectedLocalArea, activeLocalAreas, masterSettings } = useStore();
  const { userProfile } = useAuth();

  const [customerName, setCustomerName] = useState(userProfile?.displayName || '');
  const [customerPhone, setCustomerPhone] = useState(userProfile?.phone || '');
  const [streetAddress, setStreetAddress] = useState('');
  const [pinCode, setPinCode] = useState(selectedLocalArea?.pinCodes[0] || '');
  const [chosenAreaId, setChosenAreaId] = useState(selectedLocalArea?.id || '');
  const [deliveryDistanceKm, setDeliveryDistanceKm] = useState<number>(3.5);
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'upi'>('cod');
  const [placing, setPlacing] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  if (!isOpen) return null;

  const itemsSubtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const freeThreshold = masterSettings.freeDeliveryThreshold ?? 0;
  const isFreeDelivery = freeThreshold > 0 && itemsSubtotal >= freeThreshold;

  const pricing = pricingService.computeOrderPricing(
    itemsSubtotal,
    deliveryDistanceKm,
    isFreeDelivery,
    masterSettings.packagingFee ?? 10
  );

  const subtotal = pricing.subtotal;
  const deliveryFee = pricing.deliveryFee;
  const packagingFee = pricing.packagingFee;
  const total = pricing.totalAmount;

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setCheckoutError(null);
    if (!chosenAreaId) {
      setCheckoutError('Please select an active Local Area for grocery delivery.');
      return;
    }

    setPlacing(true);
    const chosenArea = activeLocalAreas.find((a) => a.id === chosenAreaId);

    try {
      const orderData = {
        orderNumber: `ORD-${Date.now().toString().slice(-6)}`,
        customerId: userProfile?.uid || `guest-${Date.now()}`,
        customerName,
        customerPhone,
        items: cart,
        subtotal,
        deliveryFee,
        packagingFee,
        totalAmount: total,
        paymentMethod,
        isCOD: paymentMethod === 'cod',
        paymentStatus: (paymentMethod === 'cod' ? 'pending' : 'completed') as PaymentStatus,
        status: 'pending' as const,
        shippingAddress: {
          fullName: customerName,
          phone: customerPhone,
          street: streetAddress,
          pinCode,
          localAreaId: chosenAreaId,
          localAreaName: chosenArea?.name || 'Local Area',
          district: chosenArea?.district || '',
          state: chosenArea?.state || 'West Bengal',
        },
        localAreaId: chosenAreaId,
        localAreaName: chosenArea ? chosenArea.name : 'Local Area',
        createdAt: new Date().toISOString(),
      };

      const orderId = await orderService.createOrder(orderData);
      setOrderSuccess(orderId);
      clearCart();
    } catch (err: any) {
      setCheckoutError(err.message || 'Failed to place order. Please try again.');
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute right-4 top-4 text-gray-400 hover:text-gray-600">
          <X className="w-5 h-5" />
        </button>

        {orderSuccess ? (
          <div className="text-center py-6 space-y-3">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Order Confirmed!</h3>
            <p className="text-xs text-gray-500">
              Your grocery basket has been dispatched to our partner in{' '}
              <strong>{activeLocalAreas.find((a) => a.id === chosenAreaId)?.name}</strong>.
            </p>
            <button
              onClick={onClose}
              className="mt-4 px-5 py-2 bg-emerald-700 text-white rounded-lg text-sm font-semibold"
            >
              Continue Shopping
            </button>
          </div>
        ) : (
          <form onSubmit={handlePlaceOrder} className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
              <ShoppingBag className="w-5 h-5 text-emerald-700" />
              <h3 className="text-lg font-bold text-gray-900">Checkout Daily Basket</h3>
            </div>

            {checkoutError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl font-medium">
                {checkoutError}
              </div>
            )}

            {/* Cart overview */}
            <div className="bg-gray-50 rounded-xl p-3 text-xs space-y-1.5">
              {cart.map((i) => (
                <div key={i.productId} className="flex justify-between text-gray-700">
                  <span>
                    {i.quantity}x {i.productName}
                  </span>
                  <span className="font-semibold">₹{i.price * i.quantity}</span>
                </div>
              ))}
              <div className="border-t border-gray-200 pt-2 space-y-1 text-gray-600">
                <div className="flex justify-between">
                  <span>Items Subtotal:</span>
                  <span className="font-semibold text-gray-800">₹{subtotal}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1.5">
                    <span>Local Delivery Fee:</span>
                    <span className="text-[10px] text-gray-500 font-mono">({pricing.rateFormula})</span>
                  </span>
                  <span className="font-semibold text-gray-800">
                    {deliveryFee === 0 ? (
                      <span className="text-emerald-700 font-bold">FREE</span>
                    ) : (
                      `₹${deliveryFee}`
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1.5">
                    <span>Eco-friendly Packaging:</span>
                    <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1 rounded">100% Bio</span>
                  </span>
                  <span className="font-semibold text-gray-800">₹{packagingFee}</span>
                </div>
              </div>
              <div className="border-t border-gray-200 pt-1.5 flex justify-between font-bold text-gray-900 text-sm">
                <span>Grand Total:</span>
                <span className="text-emerald-800 font-extrabold text-base">₹{total}</span>
              </div>
            </div>

            {/* Delivery address details */}
            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>

              {/* DYNAMIC ACTIVE LOCAL AREA SELECTION */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Delivery Operational Area (Managed in Firebase) <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={chosenAreaId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setChosenAreaId(id);
                    const chosen = activeLocalAreas.find((a) => a.id === id);
                    if (chosen && chosen.pinCodes.length > 0) {
                      setPinCode(chosen.pinCodes[0]);
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white font-medium text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="">-- Select Active Area ({activeLocalAreas.length} available) --</option>
                  {activeLocalAreas.map((area) => (
                    <option key={area.id} value={area.id}>
                      🟢 {area.name} ({area.district}) — PINs: {area.pinCodes.join(', ')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Street Address / House / Landmark <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  value={streetAddress}
                  onChange={(e) => setStreetAddress(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Delivery PIN Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm font-mono"
                />
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="pt-2 border-t border-gray-100 space-y-2">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                Select Payment Mode (भुगतान का प्रकार)
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cod')}
                  className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition ${
                    paymentMethod === 'cod'
                      ? 'border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-500/20'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <Banknote className={`w-5 h-5 mt-0.5 ${paymentMethod === 'cod' ? 'text-emerald-700' : 'text-gray-400'}`} />
                  <div>
                    <div className="text-xs font-bold text-gray-900">Pay on Delivery</div>
                    <div className="text-[11px] text-gray-500 leading-tight mt-0.5">
                      Cash or Scan Delivery Partner's UPI QR Code when order arrives.
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('upi')}
                  className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition ${
                    paymentMethod === 'upi'
                      ? 'border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-500/20'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <QrCode className={`w-5 h-5 mt-0.5 ${paymentMethod === 'upi' ? 'text-emerald-700' : 'text-gray-400'}`} />
                  <div>
                    <div className="text-xs font-bold text-gray-900">Instant UPI QR Code</div>
                    <div className="text-[11px] text-gray-500 leading-tight mt-0.5">
                      Pay now using GPay, PhonePe, Paytm or BHIM via QR.
                    </div>
                  </div>
                </button>
              </div>

              {/* Instant QR Code Box if user selected upi */}
              {paymentMethod === 'upi' && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center space-y-2 animate-in fade-in duration-150">
                  <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-900">
                    <Smartphone className="w-4 h-4 text-emerald-700" />
                    <span>
                      {masterSettings.upiQrMode === 'dynamic_order_amount'
                        ? `Scan to Pay ₹${total}`
                        : `Scan QR & Enter ₹${total} in UPI App`}
                    </span>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg inline-block shadow-xs border border-gray-100">
                    <QRCodeSVG
                      value={
                        masterSettings.upiQrMode === 'dynamic_order_amount'
                          ? `upi://pay?pa=${encodeURIComponent(
                              masterSettings.upiId || 'dooarsbasket@upi'
                            )}&pn=${encodeURIComponent(
                              masterSettings.upiPayeeName || 'Dooars Basket'
                            )}&am=${total}&cu=INR&tn=${encodeURIComponent('Online Grocery Order')}`
                          : `upi://pay?pa=${encodeURIComponent(
                              masterSettings.upiId || 'dooarsbasket@upi'
                            )}&pn=${encodeURIComponent(
                              masterSettings.upiPayeeName || 'Dooars Basket'
                            )}&cu=INR`
                      }
                      size={140}
                      level="M"
                      includeMargin={true}
                    />
                  </div>
                  <div className="text-[11px] text-emerald-800">
                    UPI ID: <strong className="font-mono">{masterSettings.upiId || 'dooarsbasket@upi'}</strong>
                  </div>
                  <div className="text-[11px] font-semibold text-emerald-900 bg-white/70 py-1 px-2 rounded border border-emerald-200">
                    {masterSettings.upiQrMode === 'dynamic_order_amount' ? (
                      `₹${total} pre-filled in your UPI app`
                    ) : (
                      <>
                        📌 Fix QR Code: अपने UPI App (PhonePe, GPay, Paytm) में आर्डर अमाउंट{' '}
                        <strong className="text-emerald-950 font-black">₹{total}</strong> भरकर भुगतान करें।
                      </>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-500">
                    भुगतान करने के बाद नीचे "Confirm Order" बटन दबाएं।
                  </p>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={placing || cart.length === 0}
              className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-sm font-semibold transition disabled:opacity-50 mt-2"
            >
              {placing ? 'Placing Order...' : `Confirm Order • ₹${total}`}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
