"use client";

import { useState } from "react";

type FaqItem = {
  question: string;
  answer: string;
};

export function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [openQuestions, setOpenQuestions] = useState(
    () => new Set(items.map((_, index) => index)),
  );

  return (
    <div className="dark:divide-border dark:border-border divide-y divide-slate-200 border-y border-slate-200">
      {items.map(({ question, answer }, index) => {
        const isOpen = openQuestions.has(index);
        const triggerId = `about-faq-trigger-${index + 1}`;
        const answerId = `about-faq-answer-${index + 1}`;

        return (
          <article key={question} className="py-1">
            <h3>
              <button
                id={triggerId}
                type="button"
                aria-expanded={isOpen}
                aria-controls={answerId}
                onClick={() =>
                  setOpenQuestions((current) => {
                    const next = new Set(current);
                    if (next.has(index)) {
                      next.delete(index);
                    } else {
                      next.add(index);
                    }
                    return next;
                  })
                }
                className="dark:text-foreground flex min-h-14 w-full items-center justify-between gap-4 py-4 text-left font-semibold text-[#17263b] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 dark:focus-visible:outline-sky-300"
              >
                {question}
                <span
                  aria-hidden="true"
                  className="size-5 shrink-0 text-center text-xl leading-5 text-blue-700 dark:text-sky-300"
                >
                  {isOpen ? "-" : "+"}
                </span>
              </button>
            </h3>
            <div
              id={answerId}
              role="region"
              aria-labelledby={triggerId}
              aria-hidden={!isOpen}
              className={`grid transition-[grid-template-rows] duration-300 ease-in-out motion-reduce:transition-none ${
                isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              }`}
            >
              <div className="min-h-0 overflow-hidden">
                <p className="dark:text-muted-foreground pb-4 leading-7 text-slate-700">
                  {answer}
                </p>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
