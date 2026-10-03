import { Router } from "express";
import { validate } from "@/shared/middlewares/validate.middleware.js";
import type { WalletController } from "@/modules/payments/wallets/wallet.controller.js";
import { walletActivityQueryDto, walletWithdrawDto } from "@/modules/payments/wallets/wallet.dto.js";

export function createWalletRouter(controller: WalletController): Router {
    const router = Router();
    router.get("/summary", controller.summary);
    router.get("/activity", validate(walletActivityQueryDto, "query"), controller.activity);
    router.get("/transactions", controller.transactions);
    router.get("/payout-requests", controller.payoutRequests);
    router.post("/withdraw", validate(walletWithdrawDto), controller.withdraw);
    return router;
}
