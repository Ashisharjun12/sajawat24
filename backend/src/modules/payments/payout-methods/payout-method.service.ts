import { VendorRepository } from "@/modules/identity/vendors/vendor.repository.js";
import { VendorPayoutMethodRepository } from "@/modules/payments/payout-methods/vendor-payout-method.repository.js";
import { decryptField, encryptField, maskAccountNumber } from "@/shared/crypto/field-encryption.js";
import { ApiError } from "@/shared/errors/apiError.js";

export type PayoutMethodView = {
    id: string;
    type: "bank" | "upi";
    isDefault: boolean;
    accountHolderName: string;
    bankName: string | null;
    accountNumberLast4: string | null;
    ifsc: string | null;
    upiId: string | null;
    createdAt: string;
};

export type PayoutMethodAdminView = PayoutMethodView & {
    accountNumber?: string | null;
};

export class PayoutMethodService {
    private readonly methods = new VendorPayoutMethodRepository();
    private readonly vendors = new VendorRepository();

    private async vendorIdForUser(userId: string): Promise<string> {
        const vendor = await this.vendors.findByUserId(userId);
        if (!vendor) throw ApiError.forbidden("vendor profile not found");
        return vendor.id;
    }

    async listForUser(userId: string): Promise<PayoutMethodView[]> {
        const vendorId = await this.vendorIdForUser(userId);
        return this.listForUserByVendorId(vendorId);
    }

    async listForUserByVendorId(vendorId: string): Promise<PayoutMethodView[]> {
        const rows = await this.methods.listForVendor(vendorId);
        return rows.map((row) => this.toView(row));
    }

    async addBankForUser(
        userId: string,
        input: {
            accountHolderName: string;
            bankName: string;
            accountNumber: string;
            ifsc: string;
            isDefault?: boolean;
        },
    ): Promise<PayoutMethodView> {
        const vendorId = await this.vendorIdForUser(userId);
        const existing = await this.methods.listForVendor(vendorId);
        const makeDefault = input.isDefault ?? existing.length === 0;
        if (makeDefault) await this.methods.clearDefault(vendorId);

        const created = await this.methods.create({
            vendorId,
            type: "bank",
            isDefault: makeDefault,
            accountHolderName: input.accountHolderName,
            bankName: input.bankName,
            accountNumberLast4: maskAccountNumber(input.accountNumber),
            accountNumberEncrypted: encryptField(input.accountNumber),
            ifsc: input.ifsc,
            upiId: null,
        });
        return this.toView(created);
    }

    async addUpiForUser(
        userId: string,
        input: { accountHolderName: string; upiId: string; isDefault?: boolean },
    ): Promise<PayoutMethodView> {
        const vendorId = await this.vendorIdForUser(userId);
        const existing = await this.methods.listForVendor(vendorId);
        const makeDefault = input.isDefault ?? existing.length === 0;
        if (makeDefault) await this.methods.clearDefault(vendorId);

        const created = await this.methods.create({
            vendorId,
            type: "upi",
            isDefault: makeDefault,
            accountHolderName: input.accountHolderName,
            bankName: null,
            accountNumberLast4: null,
            accountNumberEncrypted: null,
            ifsc: null,
            upiId: input.upiId,
        });
        return this.toView(created);
    }

    async setDefaultForUser(userId: string, methodId: string): Promise<PayoutMethodView> {
        const vendorId = await this.vendorIdForUser(userId);
        const updated = await this.methods.setDefault(methodId, vendorId);
        if (!updated) throw ApiError.notFound("payout method not found");
        return this.toView(updated);
    }

    async removeForUser(userId: string, methodId: string): Promise<void> {
        const vendorId = await this.vendorIdForUser(userId);
        const removed = await this.methods.softDelete(methodId, vendorId);
        if (!removed) throw ApiError.notFound("payout method not found");
    }

    async getForVendorWithdraw(vendorId: string, methodId: string) {
        const method = await this.methods.findByIdForVendor(methodId, vendorId);
        if (!method) throw ApiError.badRequest("payout method not found");
        return method;
    }

    async getAdminView(methodId: string | null): Promise<PayoutMethodAdminView | null> {
        if (!methodId) return null;
        const row = await this.methods.findById(methodId);
        if (!row) return null;
        return this.toAdminView(row);
    }

    private toView(row: {
        id: string;
        type: "bank" | "upi";
        isDefault: boolean;
        accountHolderName: string;
        bankName: string | null;
        accountNumberLast4: string | null;
        ifsc: string | null;
        upiId: string | null;
        createdAt: Date;
    }): PayoutMethodView {
        return {
            id: row.id,
            type: row.type,
            isDefault: row.isDefault,
            accountHolderName: row.accountHolderName,
            bankName: row.bankName,
            accountNumberLast4: row.accountNumberLast4,
            ifsc: row.ifsc,
            upiId: row.upiId,
            createdAt: row.createdAt.toISOString(),
        };
    }

    private toAdminView(row: {
        id: string;
        type: "bank" | "upi";
        isDefault: boolean;
        accountHolderName: string;
        bankName: string | null;
        accountNumberLast4: string | null;
        accountNumberEncrypted: string | null;
        ifsc: string | null;
        upiId: string | null;
        createdAt: Date;
    }): PayoutMethodAdminView {
        const base = this.toView(row);
        if (row.type !== "bank" || !row.accountNumberEncrypted) {
            return base;
        }
        try {
            return { ...base, accountNumber: decryptField(row.accountNumberEncrypted) };
        } catch {
            return base;
        }
    }
}

export const payoutMethodService = new PayoutMethodService();
