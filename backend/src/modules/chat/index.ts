import { AssignmentRepository } from "@/modules/assignment/assignments/assignment.repository.js";
import { OrderRepository } from "@/modules/booking/orders/order.repository.js";
import { UserRepository } from "@/modules/identity/users/user.repository.js";
import { VendorRepository } from "@/modules/identity/vendors/vendor.repository.js";
import { VendorMemberRepository } from "@/modules/identity/vendor-members/vendor-member.repository.js";
import { deliveryRouter } from "@/modules/notifications/delivery/delivery-router.service.js";
import { notificationService } from "@/modules/notifications/index.js";
import { RealtimeFactory } from "@/infrastructure/realtime/realtime.factory.js";
import { ConversationRepository } from "@/modules/chat/conversations/conversation.repository.js";
import { MessageRepository } from "@/modules/chat/messages/message.repository.js";
import { ParticipantRepository } from "@/modules/chat/participants/participant.repository.js";
import { AdminChatController } from "@/modules/chat/controllers/admin-chat.controller.js";
import { UserChatController } from "@/modules/chat/controllers/user-chat.controller.js";
import { VendorChatController } from "@/modules/chat/controllers/vendor-chat.controller.js";
import { createAdminChatRouter } from "@/modules/chat/routes/admin-chat.route.js";
import { createUserChatRouter } from "@/modules/chat/routes/user-chat.route.js";
import { createVendorChatRouter } from "@/modules/chat/routes/vendor-chat.route.js";
import { ChatAclService } from "@/modules/chat/services/chat-acl.service.js";
import { OrderFieldAssignmentRepository } from "@/modules/assignment/field-assignments/order-field-assignment.repository.js";
import { BookingChatService } from "@/modules/chat/services/booking-chat.service.js";
import { ConversationService } from "@/modules/chat/services/conversation.service.js";
import { MessageService } from "@/modules/chat/services/message.service.js";
import { ChatAttachmentService } from "@/modules/chat/attachments/chat-attachment.service.js";
import { MediaRepository } from "@/modules/upload/media/media.repository.js";
import { mediaService } from "@/modules/upload/index.js";

const conversationRepository = new ConversationRepository();
const participantRepository = new ParticipantRepository();
const messageRepository = new MessageRepository();
const orderRepository = new OrderRepository();
const assignmentRepository = new AssignmentRepository();
const vendorRepository = new VendorRepository();
const userRepository = new UserRepository();
const realtime = RealtimeFactory.getProvider();
const orderFieldAssignmentRepository = new OrderFieldAssignmentRepository();
const vendorMemberRepository = new VendorMemberRepository();

const chatAclService = new ChatAclService(
    participantRepository,
    orderRepository,
    assignmentRepository,
    vendorRepository,
    orderFieldAssignmentRepository,
    vendorMemberRepository,
);

const conversationService = new ConversationService(
    conversationRepository,
    participantRepository,
    messageRepository,
    chatAclService,
    userRepository,
    vendorRepository,
    orderRepository,
    assignmentRepository,
    orderFieldAssignmentRepository,
);

const mediaRepository = new MediaRepository();

const chatAttachmentService = new ChatAttachmentService(
    conversationRepository,
    chatAclService,
    mediaService,
    mediaRepository,
);

const messageService = new MessageService(
    conversationRepository,
    messageRepository,
    participantRepository,
    chatAclService,
    conversationService,
    userRepository,
    orderRepository,
    assignmentRepository,
    vendorRepository,
    orderFieldAssignmentRepository,
    notificationService,
    realtime,
    deliveryRouter,
    mediaService,
);

export const bookingChatService = new BookingChatService(
    conversationRepository,
    participantRepository,
    messageRepository,
    orderRepository,
    assignmentRepository,
    vendorRepository,
    orderFieldAssignmentRepository,
);

export const vendorChatController = new VendorChatController(
    conversationService,
    messageService,
    chatAttachmentService,
);
export const userChatController = new UserChatController(
    conversationService,
    messageService,
    chatAttachmentService,
    bookingChatService,
);
export const adminChatController = new AdminChatController(
    conversationService,
    messageService,
    chatAttachmentService,
);

export const vendorChatRouter = createVendorChatRouter(vendorChatController);
export const userChatRouter = createUserChatRouter(userChatController);
export const adminChatRouter = createAdminChatRouter(adminChatController);
