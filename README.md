# Ai Writter - Automate document writting publish to platforms

## Description

Ai Writter is such a platform that generates content using LLM depending on users topic and detailed prompt and then export to different kind of documents like PDF, Word, Google docs, Google Sheets etc or upload directly to platforms like Google Drive, Woocommerce and so one.

It saves users time effort by generating high quality content using LLMs like Open Ai, Claude, Gemini, Lama etc and automate repetitive work.

It focuses on subscription based SASS model built with Node.js, Express.js, Typescript, Next.js, Langgraph.js.

## Project Links

### Live Demo

- **Frontend:** https://assignment-writer-app.vercel.app
- **Backend API:** https://assignment-writer-server.onrender.com

### GitHub

- **Frontend Repository:** https://github.com/nabilsiddik/Assignment-Writer-App
- **Backend Repository:** https://github.com/nabilsiddik/Assignment-Writer-Server


## Key Features

- **AI Content Generation:** High quality content generation using LLMs like Open Ai, Claude, Gemini, Lama etc and automate repetitive work.
- **Export Import Products:** Export product from AMAZON, ALIEXPRESS, DARAZ and import to google sheet or direct upload to woocommerce after ai writter.
- **Dynamic Tool Registry:** Very Scalable code to add new document types in langgraph in minutes without logic changes.
- **Multi-Format Export:** Binary streaming for `.docx`, HTML-to-PDF via Puppeteer, and Google Docs, google drive, google sheet, woocommerce API integration.
- **Subscription Lifecycle:** Full Stripe subscription implemented with different type plans.
- **Authentication & Authorization:** JWT access token and refresh token based authentication and role based authorization and redirect with email and reset password otp verification proccess.
- **Rate Limit:** Upstash Redis for global rate-limiting depending on subscription plans.
- **Middleware:** Different type of middlewares to make the platform fully secured like checkAuth, checkSubscriptionPlan, checkRateLimit etc.
- **Storage Integration:** Upload document to cloudinary, delete from cloudinary if necessary to save cost.
- **Advance Dashboard Analytics:** Unlike random dashbaord analytics, it includes deep details like how many tokens are using for each input and output and cost for each response. Platform revenue based on subscriptions and LLM cost etc.

## Tools & Technologies

- **Extension:** Plasmo
- **Runtime:** Node.js (v20+)
- **Language:** TypeScript
- **Framework:** Express.js, Next.js
- **Database:** PostgreSQL (Prisma ORM)
- **AI Stack:** LangChain, LangGraph JS, Claude 3.5 (Anthropic), Open Ai, Gemini, Lama etc.
- **Security:** JWT, OAuth 2.0 (Google)
- **Payments:** Stripe API
- **Rate Limit:** Upstash Redis
- **Storage:** Cloudinary, Google Drive
- **HTML to PDF:** Puppeteer
- **Animation & Icon:** Framer motion, Lucid React, React Icon Library
