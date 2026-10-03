import { Link } from "react-router-dom"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { HELP_TOPICS } from "@/module/chat/lib/help-topics"

export function HelpPage() {
  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-extrabold tracking-tight">Help & Support</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Choose a topic below to start a chat with our support team.
        </p>
      </div>

      <Accordion>
        {HELP_TOPICS.map((topic) => (
          <AccordionItem key={topic.topicKey} value={topic.topicKey}>
            <AccordionTrigger>{topic.title}</AccordionTrigger>
            <AccordionContent>
              <p className="mb-4 text-sm text-muted-foreground">{topic.description}</p>
              <Button asChild size="sm" className="rounded-lg">
                <Link to={`/account/help/${topic.topicKey}/chat`}>Chat about this</Link>
              </Button>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  )
}
