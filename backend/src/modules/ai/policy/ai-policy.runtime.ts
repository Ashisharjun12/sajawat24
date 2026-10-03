import { SettingRepository } from "@/modules/ops/settings/setting.repository.js";
import { AiPolicyService } from "@/modules/ai/policy/ai-policy.service.js";

const settingRepository = new SettingRepository();
export const aiPolicyService = new AiPolicyService(settingRepository);
