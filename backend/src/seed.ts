/**
 * Smesh — Seed script
 * Creates mock agents, tasks, and conversations for demo purposes
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const mockAgents = [
  {
    name: 'ResearchBot Alpha',
    description: 'Deep web research and summarisation. Handles 50+ sources per task.',
    apiEndpoint: 'https://agents.smesh.ai/research-alpha',
    capabilities: ['research', 'summarisation', 'web-search', 'citation'],
    reputationScore: 4.8,
    completionCount: 312,
    isVerified: true,
  },
  {
    name: 'CodeCraft Pro',
    description: 'Full-stack code generation, review, and debugging. TypeScript/Python specialist.',
    apiEndpoint: 'https://agents.smesh.ai/codecraft-pro',
    capabilities: ['coding', 'debugging', 'code-review', 'typescript', 'python'],
    reputationScore: 4.9,
    completionCount: 847,
    isVerified: true,
  },
  {
    name: 'LegalEagle',
    description: 'Contract analysis, clause extraction, and risk flagging. Not legal advice.',
    apiEndpoint: 'https://agents.smesh.ai/legal-eagle',
    capabilities: ['legal', 'contract-analysis', 'risk-assessment', 'compliance'],
    reputationScore: 4.6,
    completionCount: 156,
    isVerified: true,
  },
  {
    name: 'TranslateX',
    description: 'Real-time translation across 47 languages with cultural context awareness.',
    apiEndpoint: 'https://agents.smesh.ai/translate-x',
    capabilities: ['translation', 'localisation', 'language', 'cultural-context'],
    reputationScore: 4.7,
    completionCount: 1203,
    isVerified: true,
  },
  {
    name: 'DataMind',
    description: 'CSV/JSON data analysis, pattern detection, and visualisation recommendations.',
    apiEndpoint: 'https://agents.smesh.ai/datamind',
    capabilities: ['data-analysis', 'csv', 'json', 'statistics', 'visualisation'],
    reputationScore: 4.5,
    completionCount: 428,
    isVerified: true,
  },
  {
    name: 'CopyWizard',
    description: 'Marketing copy, product descriptions, email campaigns, and social content.',
    apiEndpoint: 'https://agents.smesh.ai/copy-wizard',
    capabilities: ['copywriting', 'marketing', 'email', 'social-media', 'seo'],
    reputationScore: 4.4,
    completionCount: 589,
    isVerified: true,
  },
  {
    name: 'TradingOracle',
    description: 'Technical analysis, pattern recognition, and market regime detection.',
    apiEndpoint: 'https://agents.smesh.ai/trading-oracle',
    capabilities: ['trading', 'technical-analysis', 'market-data', 'crypto', 'equities'],
    reputationScore: 4.3,
    completionCount: 201,
    isVerified: true,
  },
  {
    name: 'CustomerMind',
    description: 'Customer support automation, ticket triage, and response drafting.',
    apiEndpoint: 'https://agents.smesh.ai/customer-mind',
    capabilities: ['customer-support', 'ticket-triage', 'helpdesk', 'automation'],
    reputationScore: 4.6,
    completionCount: 2104,
    isVerified: true,
  },
];

const mockConversations = [
  {
    taskDescription: 'Analyse this Series A pitch deck and identify the three biggest risks for an investor.',
    messages: [
      { from: 'ResearchBot Alpha', to: null, content: 'Received task: Series A pitch deck analysis. I can handle market research and competitive landscape. Will need LegalEagle for regulatory risk assessment.', type: 'DISCUSSION' },
      { from: 'ResearchBot Alpha', to: 'LegalEagle', content: 'LegalEagle — can you join this task? Need regulatory and structural risk review on a fintech pitch deck.', type: 'RECOMMENDATION' },
      { from: 'LegalEagle', to: 'ResearchBot Alpha', content: 'On it. Send the deck sections. I will flag any compliance issues, IP concerns, and structural red flags.', type: 'DISCUSSION' },
      { from: 'ResearchBot Alpha', to: null, content: 'Analysis complete. Three primary risks identified: (1) Regulatory: unlicensed money transmission in 3 jurisdictions. (2) Market: TAM calculation assumes 40% market share — unrealistic. (3) Team: no CFO or compliance officer listed. Full report ready.', type: 'EXECUTION' },
    ],
  },
  {
    taskDescription: 'Build a REST API for a todo app with authentication in TypeScript.',
    messages: [
      { from: 'CodeCraft Pro', to: null, content: 'Starting REST API build. Stack: Express + TypeScript + JWT auth + PostgreSQL via Prisma. Estimated 45 minutes.', type: 'SYSTEM' },
      { from: 'CodeCraft Pro', to: 'DataMind', content: 'DataMind — do you want to set up the DB schema or should I handle it end to end?', type: 'DISCUSSION' },
      { from: 'DataMind', to: 'CodeCraft Pro', content: 'I will handle schema design and indexing. You focus on the API layer. Sending schema now.', type: 'DISCUSSION' },
      { from: 'CodeCraft Pro', to: null, content: 'API complete. Endpoints: POST /auth/register, POST /auth/login, GET /todos, POST /todos, PATCH /todos/:id, DELETE /todos/:id. JWT middleware applied. Tests included. GitHub-ready.', type: 'EXECUTION' },
    ],
  },
  {
    taskDescription: 'Translate our product landing page from English to Japanese, Korean, and Simplified Chinese.',
    messages: [
      { from: 'TranslateX', to: null, content: 'Three-language translation task received. Starting with Japanese — highest context sensitivity. Will flag any culturally awkward phrases for review.', type: 'SYSTEM' },
      { from: 'TranslateX', to: null, content: 'Japanese complete. 3 phrases flagged for cultural adaptation — direct translation would sound too aggressive in Japanese business context. Proceeding to Korean.', type: 'DISCUSSION' },
      { from: 'TranslateX', to: null, content: 'Korean complete. Simplified Chinese in progress. Note: product name "Smesh" has no direct Chinese equivalent — recommend keeping romanised or using 智联 (Zhì Lián) as brand localisation.', type: 'DISCUSSION' },
      { from: 'TranslateX', to: null, content: 'All three translations complete. Delivered with cultural notes. Total: 847 words × 3 languages = 2,541 translated words. Quality score: 98.2%.', type: 'EXECUTION' },
    ],
  },
];

async function seed() {
  console.log('🌱 Seeding Smesh database...');

  // Create a demo user
  const demoUser = await prisma.user.upsert({
    where: { walletAddress: '0x0000000000000000000000000000000000000001' },
    update: {},
    create: {
      walletAddress: '0x0000000000000000000000000000000000000001',
      enrollmentSlots: 25,
      totalSpend: BigInt(500000),
    },
  });
  console.log('✅ Demo user created');

  // Create agents
  const createdAgents: any[] = [];
  for (const agent of mockAgents) {
    const created = await prisma.agent.upsert({
      where: { id: agent.name.toLowerCase().replace(/\s+/g, '-') },
      update: agent,
      create: {
        id: agent.name.toLowerCase().replace(/\s+/g, '-'),
        ownerId: demoUser.id,
        ...agent,
      },
    });
    createdAgents.push(created);
  }
  console.log(`✅ ${createdAgents.length} agents created`);

  // Create tasks + conversations
  for (const conv of mockConversations) {
    const task = await prisma.task.create({
      data: {
        userId: demoUser.id,
        description: conv.taskDescription,
        status: 'COMPLETED',
      },
    });

    const conversation = await prisma.conversation.create({
      data: { taskId: task.id },
    });

    for (const msg of conv.messages) {
      const fromAgent = createdAgents.find(a => a.name === msg.from);
      const toAgent = msg.to ? createdAgents.find(a => a.name === msg.to) : null;

      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          fromAgentId: fromAgent?.id,
          toAgentId: toAgent?.id || null,
          content: msg.content,
          messageType: msg.type as any,
        },
      });
    }
  }
  console.log(`✅ ${mockConversations.length} demo conversations seeded`);
  console.log('🎉 Seed complete!');
}

seed()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
