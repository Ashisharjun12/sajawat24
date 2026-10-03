import { ClipboardListIcon, ShieldCheckIcon, TruckIcon } from "lucide-react"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { FaqListEditor } from "@/module/catalog/components/FaqListEditor"
import { PointListEditor } from "@/module/catalog/components/PointListEditor"

export function ProductAdditionalInfo({
  includes,
  onIncludesChange,
  deliverySetup,
  onDeliverySetupChange,
  careInstructions,
  onCareInstructionsChange,
  faqs,
  onFaqsChange,
  disabled,
}) {
  return (
    <Accordion defaultValue={["includes"]}>
      <AccordionItem value="includes">
        <AccordionTrigger>What’s included</AccordionTrigger>
        <AccordionContent>
          <PointListEditor
            items={includes}
            onChange={onIncludesChange}
            disabled={disabled}
            addLabel="Add point"
            emptyTitle="No includes yet"
            emptyDescription="List what the customer gets with this decoration."
            icon={<ClipboardListIcon />}
          />
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="delivery">
        <AccordionTrigger>Delivery and setup</AccordionTrigger>
        <AccordionContent>
          <PointListEditor
            items={deliverySetup}
            onChange={onDeliverySetupChange}
            disabled={disabled}
            addLabel="Add point"
            emptyTitle="No delivery notes yet"
            emptyDescription="Arrival window, setup, and teardown."
            icon={<TruckIcon />}
          />
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="care">
        <AccordionTrigger>Care instructions</AccordionTrigger>
        <AccordionContent>
          <PointListEditor
            items={careInstructions}
            onChange={onCareInstructionsChange}
            disabled={disabled}
            addLabel="Add point"
            emptyTitle="No care notes yet"
            emptyDescription="How to keep the setup looking good."
            icon={<ShieldCheckIcon />}
          />
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="faqs">
        <AccordionTrigger>FAQs</AccordionTrigger>
        <AccordionContent>
          <FaqListEditor items={faqs} onChange={onFaqsChange} disabled={disabled} />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}
