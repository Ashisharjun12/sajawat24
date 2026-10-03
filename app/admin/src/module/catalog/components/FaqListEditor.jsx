import { CircleHelpIcon, PlusIcon, XIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Input } from "@/components/ui/input"
import { InputGroup, InputGroupTextarea } from "@/components/ui/input-group"

const MAX = 20

export function toFaqRows(faqs) {
  return (faqs ?? []).map((faq) => ({
    key: crypto.randomUUID(),
    question: faq.question ?? "",
    answer: faq.answer ?? "",
  }))
}

export function fromFaqRows(rows) {
  return rows.map(({ question, answer }) => ({ question, answer }))
}

export function FaqListEditor({ items, onChange, disabled }) {
  function add() {
    if (disabled || items.length >= MAX) return
    onChange([...items, { key: crypto.randomUUID(), question: "", answer: "" }])
  }

  function update(key, patch) {
    onChange(items.map((item) => (item.key === key ? { ...item, ...patch } : item)))
  }

  function remove(key) {
    onChange(items.filter((item) => item.key !== key))
  }

  if (!items.length) {
    return (
      <Empty className="border py-8">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <CircleHelpIcon />
          </EmptyMedia>
          <EmptyTitle>No FAQs yet</EmptyTitle>
          <EmptyDescription>Add questions customers ask before they book.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button type="button" disabled={disabled} onClick={add}>
            <PlusIcon />
            Add question
          </Button>
        </EmptyContent>
      </Empty>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <Accordion multiple>
        {items.map((item) => (
          <AccordionItem key={item.key} value={item.key}>
            <div className="flex items-start">
              <AccordionTrigger className="min-w-0 flex-1 hover:no-underline">
                <span className="truncate pr-2 font-medium">
                  {item.question.trim() || "New question"}
                </span>
              </AccordionTrigger>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="mt-3 mr-2"
                disabled={disabled}
                onClick={() => remove(item.key)}
                aria-label="Remove question"
              >
                <XIcon />
              </Button>
            </div>
            <AccordionContent>
              <div className="flex flex-col gap-2">
                <Input
                  value={item.question}
                  placeholder="Question"
                  disabled={disabled}
                  maxLength={200}
                  onChange={(event) => update(item.key, { question: event.target.value })}
                />
                <InputGroup>
                  <InputGroupTextarea
                    value={item.answer}
                    placeholder="Answer"
                    disabled={disabled}
                    rows={3}
                    onChange={(event) => update(item.key, { answer: event.target.value })}
                  />
                </InputGroup>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      {items.length < MAX ? (
        <Button type="button" variant="outline" className="self-start" disabled={disabled} onClick={add}>
          <PlusIcon />
          Add question
        </Button>
      ) : null}
    </div>
  )
}
