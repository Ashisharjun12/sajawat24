import { bookingChatService } from "@/modules/chat/index.js";
import { logger } from "@/utils/logger.js";

export async function closeBookingChatAfterOrderCancelled(orderId: string): Promise<void> {
    try {
        await bookingChatService.closeBookingConversation(orderId, "cancelled");
    } catch (err) {
        logger.error({ err, orderId }, "close booking chat on cancel failed");
    }
}
