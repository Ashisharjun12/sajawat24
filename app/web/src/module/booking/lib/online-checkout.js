const RAZORPAY_SCRIPT = "https://checkout.razorpay.com/v1/checkout.js";
const CASHFREE_SCRIPT = "https://sdk.cashfree.com/js/v3/cashfree.js";

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`failed to load ${src}`));
    document.body.appendChild(script);
  });
}

export async function openRazorpayCheckout(checkout, customer) {
  await loadScript(RAZORPAY_SCRIPT);
  if (!window.Razorpay) {
    throw new Error("razorpay checkout failed to load");
  }

  return new Promise((resolve, reject) => {
    const rzp = new window.Razorpay({
      key: checkout.keyId,
      amount: checkout.amountPaise,
      currency: checkout.currency || "INR",
      name: checkout.name || "Decoryy",
      description: checkout.description,
      order_id: checkout.orderId,
      prefill: checkout.prefill || {
        name: customer?.name,
        email: customer?.email,
        contact: customer?.phone,
      },
      handler(response) {
        resolve({
          provider: "razorpay",
          orderId: checkout.decoryOrderId,
          razorpayOrderId: response.razorpay_order_id,
          razorpayPaymentId: response.razorpay_payment_id,
          razorpaySignature: response.razorpay_signature,
        });
      },
      modal: {
        ondismiss() {
          reject(new Error("payment cancelled"));
        },
      },
    });
    rzp.open();
  });
}

export async function openCashfreeCheckout(checkout) {
  await loadScript(CASHFREE_SCRIPT);
  if (!window.Cashfree) {
    throw new Error("cashfree checkout failed to load");
  }

  const mode = checkout.environment === "production" ? "production" : "sandbox";
  const cashfree = window.Cashfree({ mode });
  const result = await cashfree.checkout({
    paymentSessionId: checkout.paymentSessionId,
    redirectTarget: "_modal",
  });

  if (result?.error) {
    throw new Error(result.error.message || "payment failed");
  }

  return {
    provider: "cashfree",
    orderId: checkout.orderId,
  };
}
