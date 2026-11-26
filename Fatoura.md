# Fatoura in plain words

## What it is

Fatoura is a website where a freelancer or small shop in Algeria can create invoices (bills), send them to clients, get paid, and stop chasing late payers by hand. Think of it as a digital invoice book with a polite assistant that reminds people to pay.

You'll build it over about 8 weeks, mostly as a **portfolio project**: something real you can show employers to prove you can build more than a basic website.

## What the app does

- **Accounts and businesses.** Someone signs up, creates their business, and can give others access with roles (owner, accountant, viewer). One business must never see another business's data.
- **Clients and products.** A simple list of who you bill and what you sell.
- **Invoices.** Pick a client, add items, and the app calculates tax (VAT) and the total in dinars. Money is stored in centimes as whole numbers, because computers make tiny rounding mistakes with decimals, and in accounting those mistakes matter.
- **PDF and email.** When an invoice is sent, the app makes a PDF and emails the client a private link to view it.
- **Payment.** The client clicks "Pay" and lands on a fake payment page that you build yourself. You'll practice how real payments work without handling real money.
- **Reminders.** Every morning the app checks for late invoices and sends reminder emails, never the same one twice.
- **Extras later.** Monthly recurring invoices, exporting data to a spreadsheet, a dashboard with totals, a history of who changed what, and possibly an Arabic version.

## The core idea: a waiter and a kitchen

Slow tasks like making PDFs and sending emails shouldn't make the user wait. So the project has two parts:

- **The website** is the waiter. It takes the request, says "got it," and moves on.
- **The worker** is the kitchen, a separate program that does the slow work in the background. If an email fails, it tries again later.

The big lesson is making sure that if the kitchen accidentally does something twice, nothing bad happens, like a client getting the same invoice email twice or a payment being recorded twice. Much of the handbook is about this.

## The "professional" part

Besides the app itself, you'll learn how real teams work:

- **Packaging the app** (Docker) so it runs the same on any computer.
- **Automatic checks** (GitHub Actions) that test your code every time you change something.
- **Putting it online** on a rented server, automatically, with a way to undo a bad release.
- **Good habits:** every change goes through a pull request, you write short notes on why you made big decisions, and you keep a log of bugs you fixed. That history becomes your case study when you apply for jobs.

## What you do today

Today is only about setting up your workshop:

1. Install the tools (Node, Git, VS Code, Docker).
2. Create the empty app and push it to a private GitHub repo.
3. Start a local database, a local queue for the background jobs, and a fake inbox for test emails.
4. Add the automatic checks and make sure they turn green on your first pull request.
5. Write a ten-line note explaining why background jobs run separately.

You won't build any features yet. By tonight, you should have a running app and a green check mark.

## What's not included

No real card payments, no real bank integration, no full accounting system, no mobile app. Saying what you left out is part of looking professional.

The handbook mentions a week-by-week plan, but the text you shared only has today's checklist and the overall scope. If you have that plan, send it and I'll explain it the same way.

Want me to go deeper on any part, like the background jobs or the money handling?



For an invoicing and payments product built by one person or a small team, the best architecture is a **modular monolith with a separate background worker**: one codebase, one database, and two running processes. It's boring on purpose. Money software rewards simplicity and correctness over cleverness.

Here's the shape, then the reasoning behind it.

## Why this shape

**One codebase, not microservices.** Microservices solve problems of big teams and huge scale. An invoicing app has the opposite needs: a few well-defined features, one team, and data that must always be correct. Splitting it into many services adds network failures and deployment pain without adding value. Keep the code organized into clear modules (invoices, clients, payments, reminders) so it can be split later if it ever needs to be.

**One relational database as the source of truth.** Money data needs transactions (several changes succeed or fail together) and constraints (the database itself refuses duplicates). PostgreSQL is the standard choice. A NoSQL database is the wrong tool here.

**A separate background worker.** Making PDFs, sending emails, running daily reminders, and processing payment notifications are slow or unreliable. The web app should hand them off and respond instantly, and the worker does them with automatic retries. This split matters more than any other decision.

## The principles that make it trustworthy

These matter more than which tools you pick:

1. **Assume every job can run twice.** Networks fail and retries happen. Let the database block duplicates, for example with a unique rule like "one reminder per invoice per rule," so a repeat does nothing.
2. **Store money as whole numbers** (centimes), never decimals.
3. **Put the business rules in plain functions** (totals, VAT, status changes) with no database or web code mixed in. They're the easiest part to test and the costliest to get wrong.
4. **Isolate each customer's data.** Every row belongs to a business, and every query filters by it. Test that business A can never read business B's invoices.
5. **Don't store what you can calculate.** "Overdue" is just "sent and past the due date," so compute it and it can never be out of date.
6. **Keep an append-only history** of who changed what.
7. **Hide external services behind an interface.** Payments, email, and file storage should each sit behind a small adapter, so you can swap the fake payment page for a real provider, or local disk for cloud storage, without touching the rest.

## What to avoid early

Microservices, Kubernetes, event sourcing, a separate database per customer, and heavy caching all add complexity you won't need until you have real scale.

## Choices that depend on you

The architecture is language-neutral. It works the same in Next.js, Django, Laravel, Rails, or NestJS, so pick what you know best. For the queue, a Postgres-based one means one fewer service to run, while Redis is more common in industry. Either works at this size.

For Algeria specifically, keep payments behind that adapter, because the local payment landscape (card networks, aggregators) will likely differ from what tutorials assume. Also confirm VAT and invoice-format rules with an accountant instead of hardcoding assumptions.

This is also close to what your handbook describes, which is no accident: it's the standard answer for this kind of product.

If you tell me your preferred language, I can suggest a concrete folder structure for it.