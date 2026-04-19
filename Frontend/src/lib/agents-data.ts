// aiengine se ai skill se hai ye 

export const agents = [
    // 1. WEBSITE CHAT WIDGET
    {
        id: "chatwidget_manager",
        name: "Chat Widget AI",
        role: "Website Chat Widget Manager",
        gender: "female",
        department: "Website",
        profile_pic: "https://api.dicebear.com/7.x/notionists/svg?seed=Ariya&backgroundColor=000000,1a1a1a",
        skills: [
            {
                name: "Page Teleporter",
                description: "Effortlessly navigates prospects to specific pages or triggers vital actions based on their true intent.",
                explanation: "Instantly teleports the user directly to the pricing or checkout page the moment they show buying intent, removing friction from the sales funnel."
            },
            { 
                name: "Product Catalog Search", 
                description: "Understands exactly what customers are looking for, even if they don't know the exact product name.",
                explanation: "Acts as an ultra-smart virtual salesperson. It understands the underlying meaning behind customer queries to instantly match them with the perfect item from your active inventory."
            },
            { 
                name: "Order Tracking", 
                description: "Eliminates WISMO (Where Is My Order) tickets by providing instant, accurate live tracking to customers.",
                explanation: "Securely connects to your fulfillment center. It retrieves order statuses in real-time, giving customers instant peace of mind and drastically reducing support load."
            },
            { 
                name: "Refund & Returns Processing", 
                description: "Transforms a negative experience into a smooth, automated process that builds brand trust.",
                explanation: "Autonomously evaluates return requests against your business policies. If eligible, it instantly initiates partial or full credits, turning angry customers into loyal ones."
            },
            { 
                name: "Action Discovery Engine", 
                description: "A self-learning module that constantly adapts to your website's newest features and capabilities.",
                explanation: "Silently reads your website's structure behind the scenes. This allows the AI to learn new actions dynamically, staying updated without requiring manual developer input."
            },
            { 
                name: "De-escalator & Conflict Resolution", 
                description: "Detects user frustration early and pivots to an empathetic tone to prevent churn.",
                explanation: "Reads the emotional state of every message. The moment it detects anger, it switches from a sales-focus to rapid empathy, instantly taking the heat out of the conversation."
            },
            { 
                name: "Human-in-the-Loop Gateway", 
                description: "Pauses critical or high-risk actions to ensure a human manager signs off before proceeding.",
                explanation: "Acts as a safety net. If a user requests a massive discount or refund, the AI smoothly stalls the conversation while silently alerting your dashboard for manual boss approval."
            },
            { 
                name: "Lead Qualifier", 
                description: "Separates tire-kickers from high-intent buyers, delivering hot leads straight to your CRM.",
                explanation: "Subtly weaves qualifying questions into natural conversation to assess budget and timeline, ensuring your sales team only spends energy on prospects ready to buy."
            },
            { 
                name: "Upsell Engine", 
                description: "Maximizes Average Order Value (AOV) by dynamically suggesting perfect-match addons.",
                explanation: "Analyzes what the customer is currently interested in and strategically pitches highly relevant cross-sells right before checkout, exactly when buying intent is highest."
            },
            { 
                name: "Live Inventory Check", 
                description: "Guarantees you never sell items that aren't actually residing in your warehouse.",
                explanation: "Coordinates with your storefront inventory in real-time. It verifies stock availability before confirming any orders, completely eliminating refund nightmares caused by out-of-stock items."
            },
            { 
                name: "Ambiguity & Context Probing", 
                description: "Intelligently extracts missing information from vague customer requests without seeming robotic.",
                explanation: "When a customer gives an incomplete request, it gracefully asks natural follow-up questions to gather the exact missing variables it needs to provide a perfect solution."
            },
            { 
                name: "Chit-Chat Pivot", 
                description: "Entertains casual conversation but ruthlessly steers the user back into the sales funnel.",
                explanation: "Capable of handling jokes and casual banter gracefully, but consistently engineering its final response to pivot the user's attention right back to your core business goals."
            }
        ],
        status: "available", 
        description: "Meet your new ultimate frontline Website Manager. Imagine having a top-performing, tireless employee who never sleeps, never takes a day off, and handles every single customer simultaneously with perfect context. This isn't just a chatbot; it is a full-fledged revenue engine embedded directly into your website. It instantly understands what your visitors want, answers complex product questions, and proactively guides them to exactly what they are looking for.\n\nBut it doesn't just stop at answering questions. This agent is a powerhouse of automation designed to drastically reduce your support costs while simultaneously increasing your sales conversions. It handles tedious, time-consuming tasks like live order tracking so your human team doesn't have to waste time looking up shipments. When a customer wants a refund, it calculates eligibility against your own business policies and processes the return seamlessly, turning a potentially negative experience into a massive trust building moment for your brand.\n\nBeyond just support, it actively works to maximize your Average Order Value. Like the world's best salesperson, it naturally introduces perfectly matched upsell items right when the customer is most likely to buy. If a customer hesitates or gets frustrated, it detects their emotion in real-time and instantly pivots to a highly empathetic, calming tone to save the relationship. And importantly, it acts as an intelligent safety net—for completely unprecedented or highly sensitive requests, it stalls gracefully and alerts you for human approval so you always remain in total control.\n\nBy deploying this agent, you are essentially hiring an entire department of elite customer support and sales executives into a single intelligent entity. It constantly learns the structure of your website, syncs with your live warehouse stock to prevent oversales, and effortlessly separates casual browsers from extremely high-intent prospects for your sales pipeline. Ultimately, it frees you from the daily grind of customer management instantly, allowing you to focus entirely on scaling your business while it handles the frontline flawlessly 24/7."
    },

    // 2. WHATSAPP MANAGER
    {
        id: "whatsapp_manager",
        name: "Rocky",
        role: "WhatsApp Outreach & Sales",
        gender: "male",
        department: "WhatsApp",
        profile_pic: "https://api.dicebear.com/7.x/notionists/svg?seed=Jasper&backgroundColor=000000,1a1a1a",
        skills: [
            { 
                name: "WA Cart Recovery", 
                description: "Automates follow-ups on abandoned carts with personalized WhatsApp nudges.",
                explanation: "Detects when a high-intent buyer drops off at checkout. It crafts a personalized, highly persuasive WhatsApp ping containing a direct link to instantly finish their purchase."
            },
            { 
                name: "Conversational Commerce", 
                description: "Handles inbound inquiries and drives high-ticket sales directly through WhatsApp chats.",
                explanation: "Maintains session state across long conversations, remembering user preferences days later to close sales smoothly."
            }
        ],
        status: "available",
        description: "Meet Rocky, your ultimate WhatsApp Sales Closer. In a world where customers ignore emails and scroll past ads, WhatsApp is where real conversations happen—and Rocky dominates this channel. He is specifically engineered for high-ticket direct messaging and relentless cart recovery, ensuring that no lead is ever left behind.\n\nUnlike traditional mass-blast software, Rocky operates like a highly personalized human sales rep. When a high-intent buyer abandons their cart at checkout, Rocky doesn't just send a generic automated text; he crafts a highly persuasive, contextual nudge directly to their phone, intelligently handling any objections they might have and providing an instant, unique link to seamlessly finish their purchase. He remembers user preferences across incredibly long sales cycles, picking up conversations exactly where they left off days or weeks ago.\n\nWhether it's answering complex inbound inquiries about sizing and shipping, or actively pushing highly relevant cross-sells to past buyers, Rocky drives actual conversational commerce. He dismantles consumer hesitation in real-time, right where the customer is most active and most likely to respond. By deploying Rocky, you are essentially plugging a world-class, 24/7 outbound sales closer straight into the most powerful messaging platform on earth."
    },

    // 3. EXECUTIVE PA
    {
        id: "executive_manager",
        name: "Anjali",
        role: "Chief of Staff & Analytics",
        gender: "female",
        department: "Executive",
        profile_pic: "https://api.dicebear.com/7.x/notionists/svg?seed=Willow&backgroundColor=000000,1a1a1a",
        skills: [
            { 
                name: "Voice-to-Task Pipeline", 
                description: "Converts the Boss's unstructured voice notes into organized, actionable team tasks.",
                explanation: "Listens to your raw audio braindumps, parses the core objectives, and automatically assigns structured tickets directly into your team's project management boards."
            },
            { 
                name: "Context & Briefing", 
                description: "Prepares comprehensive morning briefs so the Boss always stays three steps ahead.",
                explanation: "Synthesizes data from across the business overnight to deliver a punchy, 3-minute executive summary of exactly what you need to focus on today."
            },
            { 
                name: "Meeting Negotiator", 
                description: "Effortlessly coordinates back-and-forth emails to secure optimal meeting times.",
                explanation: "Operates as a true EA. It emails external contacts proposing times, parses their counter-offers against your calendar, and instantly books the final meeting slot."
            },
            { 
                name: "Operations Auditing", 
                description: "Constantly monitors business health metrics to spot operational inefficiencies before they explode.",
                explanation: "Ingests data flows across your entire structure. It identifies hidden bottlenecks—like a sudden dip in conversion rates—and alerts you before they become expensive crises."
            }
        ],
        status: "available",
        description: "Meet Anjali, your stealth Chief of Staff and ultimate Executive Assistant. Anjali isn't built for your customers; she is built exclusively to protect the most valuable asset in your entire business: your time. She operates silently in the background, constantly organizing the chaos of a growing business so you can focus entirely on massive, needle-moving CEO decisions.\n\nAnjali handles the grueling operational friction that normally bogs down founders. Hate writing tickets? Just record a quick, unstructured voice note of what you want done; she will transcribe it, pull out the actionable objectives, and automatically create structured Jira or Trello tasks assigned to the right team members. Dread the endless back-and-forth of scheduling? She reads your Google Calendar, emails external contacts to propose time slots, negotiates the perfect overlapping availability, and sends out the final invites—completely autonomously.\n\nBut she is much more than an assistant; she is a strategic auditor. Overnight, she synthesizes massive amounts of data flowing across your company—from sales metrics to server logs. Every morning, she prepares a concise, punchy 3-minute executive briefing summarizing exactly what you need to focus on today. Furthermore, she acts as an early warning system. If she detects sudden operational inefficiencies, like an unexplained dive in conversion rates, she sends you an immediate actionable alert before it turns into an expensive crisis. Anjali ensures the corporate machine runs perfectly behind the scenes."
    },

    // 4. MARKETING HEAD
    {
        id: "marketing_manager",
        name: "Zara",
        role: "Head of Brand & Campaigns",
        gender: "female",
        department: "Marketing",
        profile_pic: "https://api.dicebear.com/7.x/notionists/svg?seed=Aria&backgroundColor=000000,1a1a1a",
        skills: [
            { 
                name: "Sentiment Analyzer", 
                description: "Keeps an eagle eye on your brand's reputation and decodes customer emotion at scale.",
                explanation: "Aggregates mentions across all social channels to calculate a live 'brand health' score, giving you an immediate read on how your audience actually feels."
            },
            { 
                name: "Campaign Analysis", 
                description: "Translates complex advertising ROI data into immediate, actionable budget shifts.",
                explanation: "Connects directly to your ad accounts to cross-reference spend versus revenue, automatically recommending where to scale winning campaigns and ruthlessly kill losing ones."
            },
            { 
                name: "Social Pulse Sentinel", 
                description: "A 24/7 radar that flags viral momentum or incoming PR disasters the second they start.",
                explanation: "Monitors traffic spikes for your brand name. If it detects a sudden surge in mentions, it fires an emergency alert straight to your phone so you can respond immediately."
            },
            { 
                name: "Brand Storyteller", 
                description: "Drafts hyper-engaging copy and social hooks perfectly matched to your company's tone.",
                explanation: "Absorbs your brand's unique voice guidelines. It generates compelling marketing copy that sounds incredibly human, completely avoiding the predictable tone of generic AI."
            }
        ],
        status: "available",
        description: "Meet Zara, your tireless Head of Brand and ultimate Marketing Director. While most founders struggle to maintain an active, engaging presence across multiple platforms and decipher incredibly complex advertising metrics, Zara entirely automates your company's perception engine. She is an expert storyteller, an analytical mastermind, and a 24/7 crisis prevention team combined into one.\n\nZara possesses a deep, nuanced understanding of your company's unique Brand Voice. When you need engaging content, newsletters, or social hooks, she drafts highly compelling copy that sounds incredibly human and emotionally gripping, completely eliminating the predictable, robotic tone of generic AI. But her power goes far beyond just writing. Zara is deeply connected to your Meta and Google Ads accounts, constantly translating highly complex ROI data into immediate, actionable intelligence. She autonomously recommends scaling your winning campaigns while ruthlessly suggesting cuts to losing ad sets, ensuring every ad dollar maximizes your return.\n\nFurthermore, she is the ultimate protector of your reputation. She aggregates brand mentions across all social channels, running advanced sentiment analysis to give you a real-time 'brand health' score so you know exactly how your audience feels. She operates a 24/7 radar for your brand; if mentions suddenly spike by 300% in an hour—indicating massive viral momentum or a terrifying incoming PR disaster—she fires an emergency alert directly to your phone. Zara engineers pure attention, turns eyeballs into revenue, and aggressively protects your brand's standing in the market."
    }
];
