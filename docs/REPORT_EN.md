# INTERNSHIP GRADUATION REPORT — MONEY MANAGER PROJECT

> **Program:** First Cloud Journey (FCAJ)
> **Project:** Money Manager — Personal Finance Management
> **Language:** English (English)

---

## 1. STUDENT INFORMATION

* **Full Name:** Nguyen Van A
* **Phone Number:** 0901 234 567
* **Email:** sv.nguyenvana@gmail.com
* **University:** HCMC University of Technology (HCMUT)
* **Major:** Computer Science
* **Internship Company:** FCAJ Partner Company
* **Internship Position:** Cloud Developer Intern (Backend/DevOps Focus)
* **Internship Period:** 15/04/2026 – 10/07/2026 (12 weeks)

---

## 2. WORKLOG (WEEKLY LOG)

| Week | Work Done | Key Results achieved |
|---|---|---|
| **Week 1** | - Researched overall architecture of Money Manager project.<br>- Set up local environment (Java 21, Spring Boot 4.0.3, Node.js, MySQL, Redis, DynamoDB). | - Successfully ran the application locally.<br>- Gained a deep understanding of connection flows between services. |
| **Week 2** | - Designed main relational Database Schema on MySQL.<br>- Built the category management feature (`/category`) using Spring Boot. | - Completed CRUD API for categories.<br>- Integrated Emoji Picker on Web Frontend interface. |
| **Week 3** | - Developed the financial Jars management system following the 6 Jars methodology.<br>- Wrote API to automatically distribute incoming transactions to Jars. | - Allocation logic verified and working correctly.<br>- Enforced Jar spending limit validation in Backend Service layer. |
| **Week 4** | - Integrated **PayOS** payment gateway and implemented webhook to activate Premium plans.<br>- Built dynamic Excel report exporting functionality using Apache POI. | - Enabled Basic/Premium subscription activation via QR code webhook in real-time.<br>- Excel export successfully outputs correct data sheets. |
| **Week 5** | - Researched Google Gemini and OpenRouter API documentations.<br>- Designed core AI Chat assistant (**Nova Money**) supporting free-form Q&A. | - Integrated AI chat feature with conversation history saved on DynamoDB.<br>- Implemented the Gemini API Key Rotator mechanism. |
| **Week 6** | - Developed AI Agent Mode (Intent Parser) allowing users to execute financial commands via natural language.<br>- Implemented Undo action pipeline. | - AI model correctly classifies 15 transactions intents.<br>- Undo endpoint successfully rolls back database operations. |
| **Week 7** | - Implemented receipt intelligent scanner (OCR) using Gemini Vision API (Premium package only). | - Successfully parsed text from image/PDF receipts and populated transactions creation forms. |
| **Week 8** | - Implemented historical transaction filtering based on Subscription plans (Free/Basic/Premium).<br>- Developed basic AI forecast functionality. | - Enforced plan limits (3 months/12 months/Unlimited filter history) in Backend.<br>- Visualized forecasts using Recharts. |
| **Week 9** | - Developed AI security features: `AIContentGuard` for prompt injection protection and moderation scoring with account lockout. | - Blocked harmful inputs and prompt injection attempts.<br>- Admin user management screen displays violations history. |
| **Week 10**| - Wrote comprehensive regression test suites for AI Safety features and Dashboard totals calculation. | - Reached >85% code coverage for key business logic services.<br>- Fixed 12 outstanding bugs. |
| **Week 11**| - Performed performance tuning: added Redis caching for API keys pool and decoupled Backend into API and Worker components. | - Reduced API response latency from 450ms to 80ms.<br>- Separated API and Worker docker containers. |
| **Week 12**| - Set up deployment plan on AWS: VPC, EC2 Auto Scaling, ALB, Aurora MySQL, RDS Proxy, S3, CloudWatch, and SNS alertings. | - Completed full deployment design specifications (`deploy-plan.html`).<br>- Wrote final internship graduation reports. |

---

## 3. PROJECT PROPOSAL

### 3.1. Overview & Problem Statement
In the digital era, managing personal finance has become increasingly complicated. Users often struggle to maintain manual tracking, misallocate budgets, and lack clear long-term financial guidance.
The **Money Manager** project provides a smart, visual personal finance management application on Web & Mobile, integrating artificial intelligence (AI) to automate financial tracking and planning.

### 3.2. Project Objectives
* Implement the 6 Jars financial allocation methodology automatically.
* Integrate **Nova Money** AI assistant to log transactions through chat (voice/text) and receipt scanning (OCR).
* Provide automatic data analysis and financial forecasting (AI Insights & Forecast).
* Ensure high availability, security, and scalability on AWS cloud infrastructure.

### 3.3. AWS Solution Architecture
The system adopts a Hybrid Cloud model and multi-layered security structure:
```
                                ┌───────────────────────────┐
                                │    Web / Mobile Users     │
                                └─────────────┬─────────────┘
                                              │ HTTPS (Port 443)
                                              v
                                ┌───────────────────────────┐
                                │      Cloudflare WAF       │
                                └─────────────┬─────────────┘
                                              │ Proxy traffic
                                              v
                              ┌───────────────────────────────┐
                              │  Application Load Balancer    │
                              └──────────────┬────────────────┘
                                             │ Private Routing
                                             v
                           ┌───────────────────────────────────┐
                           │      EC2 Auto Scaling Group       │
                           │   - Web-API (Spring Boot api)     │
                           └─────────────────┬─────────────────┘
                                             │
                       ┌─────────────────────┼─────────────────────┐
                       ▼                     ▼                     ▼
              ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
              │  Aurora MySQL   │   │  Redis Cache    │   │    Amazon S3    │
              │  + RDS Proxy    │   │  (ElastiCache)  │   │  (Static/Docs)  │
              └─────────────────┘   └─────────────────┘   └─────────────────┘
```

* **VPC Layer:** Backend, Database, and Cache components are deployed inside Private Subnets.
* **Storage & Processing:** **Amazon S3** is used to store receipt images, report documents, and application static files. The Spring Boot backend processes and exports Excel reports and HTML invoices directly on the EC2 instances, then uploads them to S3 to guarantee high security and efficiency.

---

## 4. BLOGS POSTS

1. **Blog 1:** *Optimizing AI Cost in Spring Boot using Gemini Key Rotator.*
   * **Content:** Guide on configuring a free Gemini API keys pool, distributing requests using Round-Robin, and cooling down keys experiencing Rate Limits (429).
   * **Link:** [AWS Study Group Facebook Group](https://www.facebook.com/groups/awsstudygroupfcj)

2. **Blog 2:** *Securing Hybrid Cloud Traffic to Amazon S3 via VPC Endpoint.*
   * **Content:** Comparison of cost and performance between Gateway Endpoint and Interface Endpoint when accessing Amazon S3 privately from EC2 and On-Premises.
   * **Link:** [AWS Study Group Facebook Group](https://www.facebook.com/groups/awsstudygroupfcj)

3. **Blog 3:** *Deploying Spring Boot & React on Secure Multi-tier Architecture on AWS.*
   * **Content:** Step-by-step guide on VPC layout, Target Group, ALB configuration, and Cloudflare WAF integration to protect sensitive APIs like Login/OTP from spam.
   * **Link:** [AWS Study Group Facebook Group](https://www.facebook.com/groups/awsstudygroupfcj)

---

## 5. EVENTS PARTICIPATED

### 5.1. Event 1: AWS Community Day Vietnam 2026
* **Time:** 15/05/2026
* **Location:** New World Hotel, District 1, HCMC
* **Main Topics:** Generative AI on AWS (Amazon Bedrock), Cloud Cost Optimization, and building Serverless architectures at scale.
* **Lessons Learned:** Gained insights into separating static storage and optimizing network data transfer costs, which inspired the proposed VPC Endpoint solution to protect the connection between backend EC2 and S3 for Money Manager.

### 5.2. Event 2: FCAJ Webinar - Modern DevOps Practices on AWS
* **Time:** 05/06/2026
* **Location:** Online (Zoom webinar)
* **Main Topics:** Automated deployment pipelines using GitHub Actions and AWS CodeDeploy to EC2 ASG, real-time monitoring with Amazon CloudWatch and SNS.
* **Lessons Learned:** Mastered AWS alert configurations, enabling automatic email notifications via SNS when EC2 instance CPU usage exceeds 80% or when Dead Letter Queues (DLQ) catch failed jobs.

---

## 6. WORKSHOP (MAIN TECHNICAL PROJECT)

### TITLE: IMPLEMENTING SECURE STORAGE AND REPORTING PROCESSES VIA AMAZON S3 AND VPC ENDPOINTS IN THE MONEY MANAGER PLATFORM (CODE-FREE VERSION)

*(For full step-by-step lab guide, please refer to the dedicated file: [WORKSHOP_LAB_EN.md](file:///C:/D/Project/J2EE/docs/WORKSHOP_LAB_EN.md))*

#### 6.1. Workshop Overview
In the Money Manager platform, users upload receipt images to S3 to trigger the Gemini Vision OCR parser. To keep this process highly secure, scalable, and cost-effective, this workshop guides you to:
1. Create a secure private Amazon S3 bucket for storing documents and images.
2. Configure a **Gateway VPC Endpoint** for S3 so that Spring Boot backends running on EC2 in private subnets can access S3 without passing through the public internet.
3. Establish an **Interface VPC Endpoint (PrivateLink)** to allow the backend or local developers to securely access S3 in the private network via VPN connections.

#### 6.2. Prerequisites
1. An active AWS Account. Default region: `ap-southeast-1` (Singapore).
2. AdministratorAccess IAM permissions.
3. AWS CLI tool configured on local machine.

#### 6.3. S3 Deployment and Gateway Endpoint Configuration
* **Create Amazon S3 Bucket:** Run CLI commands to create the bucket, enable default SSE-S3 encryption, and configure Block Public Access constraints.
* **Create Gateway VPC Endpoint for S3:** Initialize a Gateway VPC Endpoint for S3 in the console. Assign it to route tables associated with Private Subnets running backend servers.
* **Verify connection:** Log in to private EC2 via SSM Session Manager. Perform routing inspection and run `aws s3 cp` CLI copy commands to verify bucket operations.

#### 6.4. Hybrid Connections via S3 Interface Endpoint
* **Create S3 Interface VPC Endpoint:** Configure an Interface VPC Endpoint (PrivateLink) with a security group allowing port 443 inbound requests from On-Premises CIDRs.
* **Verify connection:** Connect to simulated On-Premises developer machine via VPN. Execute S3 file copies specifying the private endpoint DNS address.
* **DNS Resolution:** Deploy a **Route 53 Inbound Resolver** and route simulated local DNS queries of `*.s3.ap-southeast-1.amazonaws.com` through the resolver IP addresses for auto-resolution.

#### 5.5. IAM Policies & VPC Endpoint Policy Hardening
* **VPC Endpoint Policy:** Restrict endpoint access to allow reads/writes only for the Money Manager target bucket.
* **S3 Bucket Policy:** Enforce denial conditions on the S3 bucket for requests not coming through authorized endpoints.

#### 6.6. Resource Clean up
* Empty and delete S3 Bucket.
* Delete VPC Endpoints (Gateway and Interface).
* Remove Route 53 Resolver and terminate mock EC2 testing instances.

---

## 7. SELF-EVALUATION

| Metric | Rating | Detailed Review |
|---|---|---|
| **Technical Expertise** | Excellent | Strong understanding of multi-tier Spring Boot/React applications and secure AWS networking architectures. |
| **Self-Learning Capability**| Excellent | Independently researched and implemented PayOS payment flows and Gemini Vision OCR integration. |
| **Proactiveness** | Excellent | Proposed splitting Backend into separate API and Worker containers, improving async job processing. |
| **Discipline & Adaptability**| Excellent | Prompt attendance at workspace, regular progress reports, and always meeting goals within deadlines. |
| **Teamwork & Communication**| Good | Coordinated effectively with peers to ensure smooth REST API synchronization with Mobile App (React Native). |
| **Problem Solving** | Excellent | Solved duplicate scheduled execution problems when scaling Backend using Redis-based rate limits. |
| **Contribution to Project** | Excellent | Delivered reliable AI pipelines and robust AWS infrastructure setups. Provided clean code with clear documentation. |

---

## 8. SHARING AND FEEDBACK

* **Feedback on First Cloud Journey (FCAJ):** 
  The program is highly organized, bridging the gap between theoretical cloud concepts and practical software development. Mentors are incredibly supportive and professional.
* **Overall Satisfaction:** 10/10.
* **Areas for Improvement:** The program could include more content on Cloud Cost Optimization during initial architecture designs.
* **Would you recommend this program?** Yes, it is the best environment for computer science students to acquire hands-on cloud skills.
