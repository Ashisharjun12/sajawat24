import type { IPaymentProvider } from "@/infrastructure/payment/payment.interface.js";
import { CashfreeProvider } from "@/infrastructure/payment/provider/cashfree.provider.js";
import { RazorpayProvider } from "@/infrastructure/payment/provider/razorpay.provider.js";
import type { OnlinePaymentProvider } from "@/modules/ops/settings/payment-methods.js";

const providers: Record<OnlinePaymentProvider, IPaymentProvider> = {
    razorpay: new RazorpayProvider(),
    cashfree: new CashfreeProvider(),
};

export class PaymentFactory {
    static getProvider(name: OnlinePaymentProvider): IPaymentProvider {
        const provider = providers[name];
        if (!provider) {
            throw new Error(`Unknown payment provider "${name}". Add a provider file; do not change IPaymentProvider.`);
        }
        return provider;
    }
}
