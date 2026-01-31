import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  X, 
  Check, 
  AlertCircle, 
  Loader,
  Shield,
  Lock,
  Smartphone,
  Wallet
} from 'lucide-react';
import axios from 'axios';

const PaymentModal = ({ 
  isOpen, 
  onClose, 
  plan, 
  isYearly, 
  onPaymentSuccess,
  planDetails 
}) => {
  const [paymentMethod, setPaymentMethod] = useState('stripe');
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState('method'); // method, processing, success
  const [paymentData, setPaymentData] = useState(null);

  const amount = isYearly ? planDetails?.yearlyPrice : planDetails?.monthlyPrice;
  const currency = 'USD';

  useEffect(() => {
    if (isOpen) {
      fetchPaymentMethods();
      setStep('method');
      setError('');
    }
  }, [isOpen]);

  const fetchPaymentMethods = async () => {
    try {
      const response = await axios.get('/api/payment/methods');
      setPaymentMethods(response.data);
    } catch (error) {
      console.error('Error fetching payment methods:', error);
    }
  };

  const handlePayment = async () => {
    setLoading(true);
    setError('');

    try {
      let paymentResponse;

      switch (paymentMethod) {
        case 'stripe':
          paymentResponse = await handleStripePayment();
          break;
        case 'paypal':
          paymentResponse = await handlePayPalPayment();
          break;
        case 'razorpay':
          paymentResponse = await handleRazorpayPayment();
          break;
        default:
          throw new Error('Invalid payment method');
      }

      setPaymentData(paymentResponse);
      setStep('processing');

      // In a real app, you would handle the payment completion here
      // For now, we'll simulate successful payment
      setTimeout(async () => {
        await confirmPayment();
      }, 2000);

    } catch (error) {
      console.error('Payment error:', error);
      setError(error.message || 'Payment failed. Please try again.');
      setLoading(false);
    }
  };

  const handleStripePayment = async () => {
    const response = await axios.post('/api/payment/stripe/intent', {
      plan,
      isYearly
    });
    return response.data;
  };

  const handlePayPalPayment = async () => {
    const response = await axios.post('/api/payment/paypal/order', {
      plan,
      isYearly
    });
    
    // Redirect to PayPal in a real implementation
    if (response.data.approvalUrl) {
      window.open(response.data.approvalUrl, '_blank');
    }
    
    return response.data;
  };

  const handleRazorpayPayment = async () => {
    const response = await axios.post('/api/payment/razorpay/order', {
      plan,
      isYearly
    });
    return response.data;
  };

  const confirmPayment = async () => {
    try {
      const response = await axios.post('/api/payment/confirm', {
        paymentIntentId: paymentData?.paymentIntentId || paymentData?.orderId,
        paymentMethod,
        plan,
        isYearly
      });

      setStep('success');
      setLoading(false);
      
      if (onPaymentSuccess) {
        onPaymentSuccess(response.data);
      }

      // Auto-close after success
      setTimeout(() => {
        onClose();
      }, 3000);

    } catch (error) {
      console.error('Error confirming payment:', error);
      setError('Payment confirmation failed. Please contact support.');
      setStep('method');
      setLoading(false);
    }
  };

  const getPaymentIcon = (method) => {
    const icons = {
      stripe: <CreditCard className="w-5 h-5" />,
      paypal: <Wallet className="w-5 h-5" />,
      razorpay: <Smartphone className="w-5 h-5" />
    };
    return icons[method] || <CreditCard className="w-5 h-5" />;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Complete Payment</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          {/* Plan Summary */}
          <div className="mt-4 p-4 bg-purple-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-purple-900">{planDetails?.name} Plan</p>
                <p className="text-sm text-purple-700">
                  {isYearly ? 'Annual' : 'Monthly'} billing
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-purple-900">${amount}</p>
                <p className="text-sm text-purple-700">{currency}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 'method' && (
            <div className="space-y-6">
              {/* Payment Methods */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Choose Payment Method</h3>
                <div className="space-y-3">
                  {paymentMethods.map((method) => (
                    <button
                      key={method.id}
                      onClick={() => setPaymentMethod(method.id)}
                      disabled={!method.enabled}
                      className={`w-full p-4 rounded-lg border-2 transition-all ${
                        paymentMethod === method.id
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300'
                      } ${!method.enabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className={`p-2 rounded-lg mr-3 ${
                            paymentMethod === method.id ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {getPaymentIcon(method.id)}
                          </div>
                          <div className="text-left">
                            <p className="font-medium text-gray-900">{method.name}</p>
                            <p className="text-sm text-gray-500 capitalize">{method.type}</p>
                          </div>
                        </div>
                        {paymentMethod === method.id && (
                          <Check className="w-5 h-5 text-purple-600" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Security Badge */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start">
                  <Shield className="w-5 h-5 text-green-600 mr-3 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-green-900">Secure Payment</h4>
                    <p className="text-sm text-green-700 mt-1">
                      Your payment information is encrypted and secure. We never store your card details.
                    </p>
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <AlertCircle className="w-5 h-5 text-red-600 mr-3 mt-0.5" />
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={handlePayment}
                  disabled={loading}
                  className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <Loader className="w-4 h-4 animate-spin mr-2" />
                      Processing...
                    </span>
                  ) : (
                    `Pay $${amount} ${currency}`
                  )}
                </button>
                
                <button
                  onClick={onClose}
                  disabled={loading}
                  className="w-full bg-gray-200 text-gray-800 py-3 px-4 rounded-lg font-semibold hover:bg-gray-300 transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {step === 'processing' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Loader className="w-8 h-8 text-purple-600 animate-spin" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Processing Payment</h3>
              <p className="text-gray-600">
                Please wait while we process your payment...
              </p>
            </div>
          )}

          {step === 'success' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Payment Successful!</h3>
              <p className="text-gray-600 mb-4">
                Your {planDetails?.name} subscription is now active.
              </p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-700">
                  You now have access to all premium features. This window will close automatically.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-center text-sm text-gray-500">
            <Lock className="w-4 h-4 mr-1" />
            <span>Secured by 256-bit SSL encryption</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
