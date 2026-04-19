import {
    MessageSquare, Mail, Database, Globe, PlayCircle, MousePointer, Clock, Layout, Zap, FileText, Brain
} from 'lucide-react';
import { FaWhatsapp, FaShopify, FaStripe, FaGoogleDrive, FaTelegram, FaFacebookMessenger, FaInstagram, FaYoutube, FaTwitter, FaLinkedin, FaPinterest, FaSlack, FaTrello, FaSalesforce, FaHubspot } from 'react-icons/fa';
import { SiRazorpay, SiWoocommerce, SiGooglesheets, SiGmail, SiAirtable, SiNotion, SiAsana, SiZoho, SiGoogleanalytics, SiGooglecalendar, SiCalendly, SiTwilio, SiOpenai, SiGoogleads } from 'react-icons/si';

// --- TYPE DEFINITIONS ---
export type AppCategory = 'core' | 'communication' | 'ecommerce' | 'payment' | 'crm' | 'productivity' | 'social' | 'marketing' | 'utility' | 'data' | 'ai';

export interface AppActionInput {
    name: string;
    label: string;
    type: 'text' | 'number' | 'boolean' | 'select' | 'textarea' | 'json';
    options?: { label: string; value: string }[]; // For select type
    required?: boolean;
    placeholder?: string;
}

export interface AppTrigger {
    id: string;
    label: string;
    description: string;
    icon?: any;
    outputs?: { name: string; label: string }[]; // Available variables (e.g. {{trigger.email}})
}

export interface AppAction {
    id: string;
    label: string;
    description: string;
    icon?: any;
    inputs: AppActionInput[];
}

export interface IntegrationApp {
    id: string;
    name: string;
    category: AppCategory;
    description: string;
    icon: any; // React Component
    color: string;
    isComingSoon?: boolean;
    triggers: AppTrigger[];
    actions: AppAction[];
}

// --- MASTER REGISTRY (27 APPS - 100% DEPTH) ---
export const INTEGRATION_APPS: IntegrationApp[] = [
    // -------------------------
    // 0. CORE (WEBSITE)
    // -------------------------
    {
        id: 'website',
        name: 'Website Chatbot',
        category: 'core',
        description: 'Native website triggers and interactions.',
        icon: Globe,
        color: '#2563EB',
        triggers: [
            {
                id: 'visitor_lands',
                label: 'Visitor Lands',
                description: 'First visit triggers (IP/Device data detected).',
                icon: PlayCircle,
                outputs: [
                    { name: 'ip', label: 'IP Address' },
                    { name: 'country', label: 'Country' },
                    { name: 'device', label: 'Device Type' },
                    { name: 'browser', label: 'Browser' },
                    { name: 'source', label: 'Traffic Source' }
                ]
            },
            { id: 'element_click', label: 'Element Click', description: 'Triggers when a specific CSS element/Button is clicked.', icon: MousePointer },
            {
                id: 'form_submit',
                label: 'Form Submitted',
                description: 'Triggers on native or external form submission (Lead Capture).',
                icon: FileText,
                outputs: [
                    { name: 'form_id', label: 'Form ID' },
                    { name: 'form_data', label: 'Form Data (JSON)' }
                ]
            },
            { id: 'keyword_match', label: 'Keyword Match', description: 'Triggers if user types specific words (e.g., "Price").', icon: MessageSquare },
            { id: 'exit_intent', label: 'Exit Intent', description: 'Triggers when mouse moves towards browser close (Desktop).', icon: Zap },
            { id: 'time_delay', label: 'Time on Page', description: 'Triggers after user stays for X seconds or minutes.', icon: Clock },
            { id: 'scroll_depth', label: 'Scroll Depth', description: 'Triggers on 25%, 50%, 75%, or 100% scroll milestones.', icon: Layout },
            { id: 'user_inactivity', label: 'User Inactivity', description: 'Triggers when user is idle for a set duration.', icon: Clock },
            { id: 'custom_event', label: 'Custom Event (JS)', description: 'Triggers via `Cluaiz.track(\'event_name\')`.', icon: Zap },
            { id: 'referrer_detect', label: 'Referrer Detect', description: 'Triggers based on source (Google, Facebook, Direct).', icon: Globe },
        ],
        actions: [
            { id: 'send_message', label: 'Send Message', description: 'Send Text, Emoji, or Markdown response.', inputs: [{ name: 'text', label: 'Message', type: 'textarea', required: true }] },
            { id: 'send_image_video', label: 'Send Image/Video', description: 'Send rich media content.', inputs: [{ name: 'url', label: 'Media URL', type: 'text', required: true }] },
            { id: 'product_carousel', label: 'Product Carousel', description: 'Display e-commerce cards with "Buy" buttons.', inputs: [{ name: 'products', label: 'Products JSON', type: 'json', required: true }] },
            { id: 'list_menu', label: 'List Menu', description: 'Show options flow (Single/Multi-select).', inputs: [{ name: 'options', label: 'Options List', type: 'json', required: true }] },
            { id: 'file_attachment', label: 'File Attachment', description: 'Provide PDF/Doc for download.', inputs: [{ name: 'file_url', label: 'File URL', type: 'text', required: true }] },
            { id: 'smart_form', label: 'Smart Form', description: 'Inline step-by-step lead qualification form.', inputs: [{ name: 'fields', label: 'Form Fields (JSON)', type: 'json', required: true }] },
            { id: 'ai_agent', label: 'AI Agent Response', description: 'Generate LLM-based response (RAG connected).', inputs: [{ name: 'context', label: 'Context Prompt', type: 'textarea' }] },
            { id: 'open_chat', label: 'Force Open Chat', description: 'Maximize the widget window.', inputs: [] },
            { id: 'execute_js', label: 'Execute JS', description: 'Run custom script on user page.', inputs: [{ name: 'code', label: 'JS Code', type: 'textarea', required: true }] },
            { id: 'set_attribute', label: 'Set User Attribute', description: 'Save data to user session (e.g. name, email).', inputs: [{ name: 'key', label: 'Attribute Name', type: 'text', required: true }, { name: 'value', label: 'Value', type: 'text', required: true }] },
            { id: 'wait_delay', label: 'Wait / Delay', description: 'Pause execution for X seconds.', inputs: [{ name: 'seconds', label: 'Seconds', type: 'number', required: true }] }
        ]
    },

    // -------------------------
    // 1. COMMUNICATION
    // -------------------------
    {
        id: 'whatsapp',
        name: 'WhatsApp',
        category: 'communication',
        description: 'Send templates, handling replies, and catalogs.',
        icon: FaWhatsapp,
        color: '#25D366',
        triggers: [
            {
                id: 'msg_received',
                label: 'Message Received',
                description: 'Triggers when user sends a text/media message.',
                outputs: [
                    { name: 'sender_phone', label: 'Sender Phone' },
                    { name: 'message_text', label: 'Message Text' },
                    { name: 'message_type', label: 'Type (text/image)' },
                    { name: 'message_id', label: 'Message ID' }
                ]
            },
            { id: 'msg_status', label: 'Message Status', description: 'Triggers on Sent, Delivered, or Read receipt.' },
            {
                id: 'button_clicked',
                label: 'Button Clicked',
                description: 'Triggers when user clicks a Reply Button.',
                outputs: [
                    { name: 'button_id', label: 'Button ID' },
                    { name: 'button_text', label: 'Button Text' },
                    { name: 'sender_phone', label: 'Sender Phone' }
                ]
            }
        ],
        actions: [
            {
                id: 'send_template',
                label: 'Send Template',
                description: 'Send approved template (24h window opener).',
                inputs: [
                    { name: 'template_name', label: 'Template Name', type: 'text', required: true },
                    { name: 'phone', label: 'Phone Number', type: 'text', required: true },
                    { name: 'variables', label: 'Variables (JSON)', type: 'json', placeholder: '{"1": "Name"}' }
                ]
            },
            { id: 'send_text', label: 'Send Text Message', description: 'Free-form reply (within 24h window).', inputs: [{ name: 'text', label: 'Message', type: 'textarea', required: true }] },
            { id: 'send_media', label: 'Send Media', description: 'Send Image, Video, or PDF.', inputs: [{ name: 'url', label: 'Media URL', type: 'text', required: true }, { name: 'caption', label: 'Caption', type: 'text' }] },
            { id: 'send_list', label: 'Send List Menu', description: 'Interactive menu with up to 10 options.', inputs: [{ name: 'header', label: 'Title', type: 'text' }, { name: 'options', label: 'Rows (JSON)', type: 'json', required: true }] },
            { id: 'send_buttons', label: 'Send Reply Buttons', description: 'Quick action buttons (Max 3).', inputs: [{ name: 'text', label: 'Body Text', type: 'text', required: true }, { name: 'buttons', label: 'Button Labels (Comma)', type: 'text', required: true }] },
            { id: 'send_catalog', label: 'Send Product Catalog', description: 'Send full catalog or specific product.', inputs: [{ name: 'sku', label: 'Product SKU (Optional)', type: 'text' }] },
            { id: 'mark_read', label: 'Mark as Read', description: 'Update message status to read.', inputs: [{ name: 'msg_id', label: 'Message ID', type: 'text' }] },
            { id: 'send_location', label: 'Send Location', description: 'Send GPS coordinates.', inputs: [{ name: 'lat', label: 'Latitude', type: 'number' }, { name: 'long', label: 'Longitude', type: 'number' }, { name: 'name', label: 'Location Name', type: 'text' }] },
            { id: 'send_contact', label: 'Send Contact', description: 'Share a contact card.', inputs: [{ name: 'name', label: 'Name', type: 'text' }, { name: 'phone', label: 'Phone', type: 'text' }] }
        ]
    },
    {
        id: 'email',
        name: 'Email (SMTP/Gmail)',
        category: 'communication',
        description: 'Send HTML emails and track opens.',
        icon: SiGmail,
        color: '#EA4335',
        triggers: [
            { id: 'email_received', label: 'Email Received', description: 'Triggers on new inbound email.' },
            { id: 'email_opened', label: 'Email Opened', description: 'Triggers when tracking pixel is fired.' },
            { id: 'link_clicked', label: 'Link Clicked', description: 'Triggers when user clicks link in email.' },
            { id: 'bounced', label: 'Email Bounced', description: 'Delivery failure (Hard/Soft bounce).' },
            { id: 'unsubscribed', label: 'Unsubscribed', description: 'User opted out via unsubscribe link.' }
        ],
        actions: [
            { id: 'send_html_email', label: 'Send HTML Email', description: 'Rich template email.', inputs: [{ name: 'to', label: 'To', type: 'text', required: true }, { name: 'subject', label: 'Subject', type: 'text', required: true }, { name: 'html_body', label: 'HTML Body', type: 'textarea', required: true }] },
            { id: 'send_plain_text', label: 'Send Plain Text', description: 'Personal outreach style email.', inputs: [{ name: 'to', label: 'To', type: 'text', required: true }, { name: 'body', label: 'Text Body', type: 'textarea', required: true }] },
            { id: 'reply_to_thread', label: 'Reply to Thread', description: 'Maintain conversation context.', inputs: [{ name: 'thread_id', label: 'Thread ID', type: 'text', required: true }, { name: 'body', label: 'Reply Body', type: 'textarea' }] }
        ]
    },
    {
        id: 'sms',
        name: 'SMS (Twilio/MSG91)',
        category: 'communication',
        description: 'Global text messaging & OTPs.',
        icon: SiTwilio,
        color: '#F22F46',
        triggers: [
            { id: 'sms_received', label: 'SMS Received', description: 'Incoming text message.' },
            { id: 'delivery_report', label: 'Delivery Report', description: 'Sent/Failed status update.' }
        ],
        actions: [
            { id: 'send_sms', label: 'Send SMS', description: 'Global text message.', inputs: [{ name: 'phone', label: 'Phone', type: 'text', required: true }, { name: 'message', label: 'Message', type: 'textarea', required: true }] },
            { id: 'send_otp', label: 'Send OTP', description: 'Verification code with expiry.', inputs: [{ name: 'phone', label: 'Phone', type: 'text', required: true }] },
            { id: 'send_dlt_sms', label: 'Send DLT SMS (India)', description: 'Compliance template message.', inputs: [{ name: 'template_id', label: 'Template ID', type: 'text', required: true }, { name: 'variables', label: 'Variables', type: 'json' }] }
        ]
    },
    {
        id: 'telegram',
        name: 'Telegram Bot',
        category: 'communication',
        description: 'Bot automation for channels & groups.',
        icon: FaTelegram,
        color: '#26A5E4',
        triggers: [
            { id: 'new_msg', label: 'New Message', description: 'User sends payload/text to bot.' },
            { id: 'new_member', label: 'New Member', description: 'User joins a group/channel.' },
            { id: 'bot_command', label: 'Slash Command', description: 'Triggers on /start, /help etc.' }
        ],
        actions: [
            { id: 'send_msg', label: 'Send Message', description: 'Markdown/HTML text to chat.', inputs: [{ name: 'chat_id', label: 'Chat ID', type: 'text', required: true }, { name: 'text', label: 'Text', type: 'textarea', required: true }] },
            { id: 'send_media', label: 'Send Media', description: 'Photo, Video, or Document.', inputs: [{ name: 'chat_id', label: 'Chat ID', type: 'text' }, { name: 'url', label: 'File URL', type: 'text' }] },
            { id: 'create_poll', label: 'Create Poll', description: 'Send Survey/Quiz.', inputs: [{ name: 'question', label: 'Question', type: 'text' }, { name: 'options', label: 'Options', type: 'json' }] },
            { id: 'kick_user', label: 'Kick/Ban User', description: 'Moderation action.', inputs: [{ name: 'user_id', label: 'User ID', type: 'text' }] }
        ]
    },
    {
        id: 'messenger',
        name: 'Facebook Messenger',
        category: 'communication',
        description: 'FB Page automation.',
        icon: FaFacebookMessenger,
        color: '#00B2FF',
        triggers: [
            { id: 'msg_received', label: 'Message Received', description: 'User messages FB Page.' },
            { id: 'post_comment', label: 'Post Comment', description: 'New comment on Page Post.' }
        ],
        actions: [
            { id: 'send_reply', label: 'Send Reply', description: 'Reply to user (Standard Messaging).', inputs: [{ name: 'text', label: 'Message', type: 'textarea', required: true }] },
            { id: 'private_reply', label: 'Private Reply', description: 'Reply to a comment via DM.', inputs: [{ name: 'comment_id', label: 'Comment ID', type: 'text' }, { name: 'text', label: 'Message', type: 'text' }] }
        ]
    },

    // -------------------------
    // 2. SOCIAL MEDIA
    // -------------------------
    {
        id: 'instagram',
        name: 'Instagram DM',
        category: 'social',
        description: 'DM automation & Story mentions.',
        icon: FaInstagram,
        color: '#E4405F',
        triggers: [
            { id: 'dm_received', label: 'DM Received', description: 'Direct message from user.' },
            { id: 'story_mention', label: 'Story Mention', description: 'User tags brand in Story.' },
            { id: 'post_comment', label: 'Post Comment', description: 'New comment on Post/Reel.' },
            { id: 'story_reply', label: 'Story Reply', description: 'User replies to your story.' }
        ],
        actions: [
            { id: 'send_dm', label: 'Send DM', description: 'Text or Quick Replies.', inputs: [{ name: 'user_id', label: 'User ID', type: 'text' }, { name: 'text', label: 'Message', type: 'text' }] },
            { id: 'reply_to_comment', label: 'Reply to Comment', description: 'Public reply on post.', inputs: [{ name: 'comment_id', label: 'Comment ID', type: 'text' }, { name: 'text', label: 'Reply', type: 'text' }] },
            { id: 'private_reply', label: 'Private Reply', description: 'Send DM in response to comment.', inputs: [{ name: 'comment_id', label: 'Comment ID', type: 'text' }, { name: 'text', label: 'Message', type: 'text' }] },
            { id: 'send_product', label: 'Send Product', description: 'Share product card in DM.', inputs: [{ name: 'product_id', label: 'Product ID', type: 'text' }] },
            { id: 'story_mention_reply', label: 'Story Mention Reply', description: 'Auto-thank user for mention.', inputs: [{ name: 'media_url', label: 'Media URL', type: 'text' }] }
        ]
    },
    {
        id: 'linkedin',
        name: 'LinkedIn',
        category: 'social',
        description: 'B2B Lead Gen & Networking.',
        icon: FaLinkedin,
        color: '#0A66C2',
        triggers: [
            { id: 'profile_viewed', label: 'Profile Viewed', description: 'Decision maker visits your profile.' },
            { id: 'new_connection', label: 'New Connection', description: 'Request accepted by prospect.' },
            { id: 'sales_nav_lead', label: 'Sales Nav Match', description: 'Lead matches criteria (high score).' }
        ],
        actions: [
            { id: 'send_connect', label: 'Send Connection Req', description: 'Automated networking invite.', inputs: [{ name: 'profile_url', label: 'Profile URL', type: 'text' }, { name: 'note', label: 'Note', type: 'textarea' }] },
            { id: 'send_message', label: 'Send Message', description: 'Drip sequence to connection.', inputs: [{ name: 'text', label: 'Message body', type: 'textarea' }] },
            { id: 'view_profile', label: 'View Profile', description: 'Soft touch (Get on radar).', inputs: [{ name: 'profile_url', label: 'URL', type: 'text' }] },
            { id: 'inmail_campaign', label: 'Send InMail', description: 'Paid outreach to non-connections.', inputs: [{ name: 'subject', label: 'Subject', type: 'text' }, { name: 'body', label: 'Body', type: 'textarea' }] },
            { id: 'sales_nav_search', label: 'Sales Nav Search', description: 'Find prospects by criteria.', inputs: [{ name: 'query', label: 'Search Query', type: 'json' }] }
        ]
    },
    {
        id: 'twitter',
        name: 'Twitter (X)',
        category: 'social',
        description: 'X Automation & Monitoring.',
        icon: FaTwitter,
        color: '#000000',
        triggers: [
            { id: 'tweet_search', label: 'Search Mention', description: 'Find tweets containing keywords.' }
        ],
        actions: [
            { id: 'post_tweet', label: 'Post Tweet', description: 'Send new tweet.', inputs: [{ name: 'text', label: 'Content', type: 'textarea', required: true }] }
        ]
    },
    {
        id: 'youtube',
        name: 'YouTube',
        category: 'social',
        description: 'Video Growth Engine.',
        icon: FaYoutube,
        color: '#FF0000',
        triggers: [
            { id: 'new_video', label: 'New Video Uploaded', description: 'Triggers when channel uploads content.' },
            { id: 'new_comment', label: 'New Comment', description: 'Viewer comments on video.' },
            { id: 'sub_milestone', label: 'Subscriber Milestone', description: 'Growth alert (e.g., 10k subs).' }
        ],
        actions: [
            { id: 'upload_video', label: 'Upload Video', description: 'Publish video file.', inputs: [{ name: 'url', label: 'Video URL', type: 'text' }, { name: 'title', label: 'Title', type: 'text' }, { name: 'desc', label: 'Description', type: 'textarea' }] },
            { id: 'reply_comment', label: 'Reply to Comment', description: 'Engage with viewer.', inputs: [{ name: 'comment_id', label: 'Comment ID', type: 'text' }, { name: 'text', label: 'Reply', type: 'text' }] },
            { id: 'create_post', label: 'Create Community Post', description: 'Text/Image update.', inputs: [{ name: 'text', label: 'Post Content', type: 'textarea' }] }
        ]
    },
    {
        id: 'pinterest',
        name: 'Pinterest',
        category: 'social',
        description: 'Visual discovery automation.',
        icon: FaPinterest,
        color: '#BD081C',
        triggers: [
            { id: 'new_pin', label: 'New Pin', description: 'Pin added to board.' }
        ],
        actions: [
            { id: 'create_pin', label: 'Create Pin', description: 'Pin image to board.', inputs: [{ name: 'board', label: 'Board ID', type: 'text' }, { name: 'image_url', label: 'Image', type: 'text' }] }
        ]
    },

    // -------------------------
    // 3. VIDEO & MEETINGS
    // -------------------------
    {
        id: 'zoom_meet',
        name: 'Zoom / Google Meet',
        category: 'productivity',
        description: 'Meeting automation & Recording.',
        icon: PlayCircle, // Or a specific Video icon
        color: '#2D8CFF',
        triggers: [
            { id: 'meeting_ended', label: 'Meeting Ended', description: 'Triggers when a video call finishes.' }
        ],
        actions: [
            { id: 'get_recording', label: 'Get Recording', description: 'Download meeting video/transcript.', inputs: [{ name: 'meeting_id', label: 'Meeting ID', type: 'text', required: true }] },
            { id: 'create_meeting', label: 'Create Meeting', description: 'Auto-schedule a new call.', inputs: [{ name: 'topic', label: 'Topic', type: 'text' }, { name: 'start_time', label: 'Start Time', type: 'text' }] },
            { id: 'add_registrant', label: 'Add Registrant', description: 'Register user for webinar.', inputs: [{ name: 'email', label: 'Email', type: 'text', required: true }] }
        ]
    },

    // -------------------------
    // 4. E-COMMERCE
    // -------------------------
    {
        id: 'shopify',
        name: 'Shopify',
        category: 'ecommerce',
        description: 'Automate store orders, customers, and carts.',
        icon: FaShopify,
        color: '#96bf48',
        triggers: [
            {
                id: 'new_order',
                label: 'New Order',
                description: 'Triggers when a new purchase is made.',
                outputs: [
                    { name: 'order_id', label: 'Order ID' },
                    { name: 'total_price', label: 'Total Amount' },
                    { name: 'currency', label: 'Currency' },
                    { name: 'customer_email', label: 'Customer Email' },
                    { name: 'customer_phone', label: 'Customer Phone' },
                    { name: 'items', label: 'Line Items (JSON)' }
                ]
            },
            { id: 'new_cod_order', label: 'New COD Order', description: 'High risk order trigger (Needs Verification).' },
            {
                id: 'cart_abandoned',
                label: 'Cart Abandoned',
                description: 'High value event (Checkout left).',
                outputs: [
                    { name: 'checkout_url', label: 'Recovery URL' },
                    { name: 'cart_total', label: 'Cart Value' },
                    { name: 'customer_email', label: 'Customer Email' }
                ]
            },
            { id: 'order_cancelled', label: 'Order Cancelled', description: 'Triggers on cancellation.' }
        ],
        actions: [
            { id: 'create_discount', label: 'Create Discount', description: 'Generate a dynamic discount code.', inputs: [{ name: 'code', label: 'Code', type: 'text' }, { name: 'amount', label: 'Percentage', type: 'number' }] },
            { id: 'get_order', label: 'Get Order Details', description: 'Fetch full order info by ID.', inputs: [{ name: 'order_id', label: 'Order ID', type: 'text' }] },
            { id: 'update_inventory', label: 'Update Inventory', description: 'Adjust stock levels.', inputs: [{ name: 'sku', label: 'SKU', type: 'text' }, { name: 'qty', label: 'Quantity', type: 'number' }] },
            { id: 'fulfill_order', label: 'Fulfill Order', description: 'Mark order as shipped.', inputs: [{ name: 'order_id', label: 'Order ID', type: 'text' }, { name: 'tracking', label: 'Tracking #', type: 'text' }] },
            { id: 'verify_cod', label: 'Verify COD (Tag)', description: 'Mark order as "Confirmed".', inputs: [{ name: 'order_id', label: 'Order ID', type: 'text' }] },
            { id: 'create_customer', label: 'Create Customer', description: 'Add new customer to Shopify.', inputs: [{ name: 'email', label: 'Email', type: 'text', required: true }, { name: 'first_name', label: 'First Name', type: 'text' }, { name: 'last_name', label: 'Last Name', type: 'text' }] },
            { id: 'send_invoice', label: 'Send Invoice', description: 'Email invoice to customer.', inputs: [{ name: 'order_id', label: 'Order ID', type: 'text', required: true }] }
        ]
    },
    {
        id: 'woocommerce',
        name: 'WooCommerce',
        category: 'ecommerce',
        description: 'WordPress store automation.',
        icon: SiWoocommerce,
        color: '#7f54b3',
        triggers: [
            { id: 'new_order', label: 'New Order', description: 'Triggers when a new order is created.' },
            { id: 'new_cod_order', label: 'New COD Order', description: 'Cash on Delivery select (Verification needed).' },
            { id: 'stock_low', label: 'Low Stock Alert', description: 'Triggers when inventory hits threshold.' }
        ],
        actions: [
            { id: 'update_status', label: 'Update Order Status', description: 'Change to processing/completed.', inputs: [{ name: 'order_id', label: 'Order ID', type: 'text' }, { name: 'status', label: 'Status', type: 'select', options: [{ label: 'Processing', value: 'processing' }, { label: 'Completed', value: 'completed' }] }] },
            { id: 'add_note', label: 'Add Order Note', description: 'Log "COD Verified" or other info.', inputs: [{ name: 'note', label: 'Note Text', type: 'text' }] },
            { id: 'create_coupon', label: 'Create Coupon', description: 'Dynamic code generation.', inputs: [{ name: 'amount', label: 'Amount', type: 'number' }] }
        ]
    },

    // -------------------------
    // 4. PAYMENTS
    // -------------------------
    {
        id: 'razorpay',
        name: 'Razorpay',
        category: 'payment',
        description: 'Indian payments & subscriptions.',
        icon: SiRazorpay,
        color: '#3395FF',
        triggers: [
            { id: 'payment_success', label: 'Payment Succeeded', description: 'Transaction done (UPI/Card).' },
            { id: 'payment_failed', label: 'Payment Failed', description: 'User cancelled or bank fail.' },
            { id: 'subscription_charged', label: 'Subscription Charged', description: 'Recurring success (Autopay).' }
        ],
        actions: [
            { id: 'create_link', label: 'Create Payment Link', description: 'Universal link (GPay, PhonePe, Cards).', inputs: [{ name: 'amount', label: 'Amount', type: 'number' }, { name: 'desc', label: 'Purpose', type: 'text' }] },
            { id: 'create_qr', label: 'Create UPI QR', description: 'Dynamic QR code for chat.', inputs: [{ name: 'amount', label: 'Amount', type: 'number' }] },
            { id: 'check_status', label: 'Check Payment Status', description: 'Verify if money hit bank.', inputs: [{ name: 'payment_id', label: 'Payment ID', type: 'text' }] }
        ]
    },
    {
        id: 'stripe',
        name: 'Stripe',
        category: 'payment',
        description: 'Global payments infrastructure.',
        icon: FaStripe,
        color: '#635BFF',
        triggers: [
            { id: 'charge_succeeded', label: 'Charge Succeeded', description: 'Triggers on successful card charge.' },
            { id: 'charge_failed', label: 'Payment Failed', description: 'Card declined.' },
            { id: 'invoice_paid', label: 'Invoice Paid', description: 'Subscription success.' },
            { id: 'trial_ending', label: 'Trial Ending', description: 'Upgrade reminder.' }
        ],
        actions: [
            { id: 'create_checkout', label: 'Create Checkout Session', description: 'Hosted payment page.', inputs: [{ name: 'amount', label: 'Amount', type: 'number' }] },
            { id: 'create_customer', label: 'Create Customer', description: 'Add new customer to Stripe.', inputs: [{ name: 'email', label: 'Email', type: 'text' }] },
            { id: 'manage_sub', label: 'Manage Subscription', description: 'Upgrade/Downgrade/Cancel plan.', inputs: [{ name: 'sub_id', label: 'Sub ID', type: 'text' }, { name: 'action', label: 'Action', type: 'select', options: [{ label: 'Cancel', value: 'cancel' }] }] },
            { id: 'refund_charge', label: 'Refund Charge', description: 'Reverse transaction.', inputs: [{ name: 'charge_id', label: 'Charge ID', type: 'text' }] }
        ]
    },

    // -------------------------
    // 5. CRM & SALES
    // -------------------------
    {
        id: 'hubspot',
        name: 'HubSpot',
        category: 'crm',
        description: 'Marketing, sales, service CRM.',
        icon: FaHubspot,
        color: '#FF7A59',
        triggers: [
            {
                id: 'contact_created',
                label: 'New Contact',
                description: 'Lead captured.',
                outputs: [
                    { name: 'contact_id', label: 'Contact ID' },
                    { name: 'email', label: 'Email' },
                    { name: 'firstname', label: 'First Name' },
                    { name: 'lastname', label: 'Last Name' }
                ]
            },
            {
                id: 'deal_stage',
                label: 'Deal Stage Changed',
                description: 'Pipeline movement.',
                outputs: [
                    { name: 'deal_id', label: 'Deal ID' },
                    { name: 'deal_name', label: 'Deal Name' },
                    { name: 'amount', label: 'Amount' },
                    { name: 'new_stage', label: 'New Stage' },
                    { name: 'old_stage', label: 'Old Stage' }
                ]
            },
            { id: 'email_activity', label: 'Email Activity', description: 'Opened/Clicked/Bounced.' }
        ],
        actions: [
            { id: 'create_contact', label: 'Create/Update Contact', description: 'CRM entry.', inputs: [{ name: 'email', label: 'Email', type: 'text' }] },
            { id: 'create_deal', label: 'Create Deal', description: 'Sales opportunity.', inputs: [{ name: 'name', label: 'Deal Name', type: 'text' }, { name: 'stage', label: 'Stage', type: 'text' }] },
            { id: 'add_to_list', label: 'Add to List', description: 'Segmentation (e.g. Webinar Attendees).', inputs: [{ name: 'list_id', label: 'List ID', type: 'text' }] },
            { id: 'log_activity', label: 'Log Activity', description: 'Track Call/Meeting/Note.', inputs: [{ name: 'type', label: 'Type', type: 'select', options: [{ label: 'Call', value: 'call' }, { label: 'Note', value: 'note' }] }] },
            { id: 'enroll_workflow', label: 'Enroll in Workflow', description: 'Trigger HubSpot automation sequence.', inputs: [{ name: 'workflow_id', label: 'Workflow ID', type: 'text' }] },
            { id: 'update_company', label: 'Update Company', description: 'Enrich company data.', inputs: [{ name: 'domain', label: 'Company Domain', type: 'text', required: true }, { name: 'properties', label: 'Properties (JSON)', type: 'json' }] }
        ]
    },
    {
        id: 'salesforce',
        name: 'Salesforce',
        category: 'crm',
        description: 'Enterprise CRM.',
        icon: FaSalesforce,
        color: '#00A1E0',
        triggers: [
            { id: 'lead_created', label: 'New Lead', description: 'Lead added to Salesforce.' }
        ],
        actions: [
            { id: 'add_lead', label: 'Add Lead', description: 'Create lead record.', inputs: [{ name: 'last_name', label: 'Last Name', type: 'text', required: true }] }
        ]
    },
    {
        id: 'zohocrm',
        name: 'Zoho CRM',
        category: 'crm',
        description: 'Online business CRM.',
        icon: SiZoho,
        color: '#F44336',
        triggers: [
            { id: 'deal_won', label: 'Deal Won', description: 'Deal stage updated to Won.' }
        ],
        actions: [
            { id: 'create_module', label: 'Create Record', description: 'Entry in module.', inputs: [{ name: 'module', label: 'Module', type: 'text', required: true }] }
        ]
    },

    // -------------------------
    // 6. DATA & STORAGE
    // -------------------------
    {
        id: 'googlesheets',
        name: 'Google Sheets',
        category: 'data',
        description: 'Spreadsheet automation.',
        icon: SiGooglesheets,
        color: '#0F9D58',
        triggers: [
            { id: 'new_row', label: 'New Row Added', description: 'Triggers when a new row is appended.' },
            { id: 'row_updated', label: 'Row Updated', description: 'Change detected in existing row.' },
            { id: 'cell_changed', label: 'Cell Changed', description: 'Specific value update.' }
        ],
        actions: [
            { id: 'add_row', label: 'Add Row', description: 'Append data.', inputs: [{ name: 'sheet_id', label: 'Spreadsheet ID', type: 'text' }, { name: 'values', label: 'Row JSON', type: 'json' }] },
            { id: 'update_row', label: 'Update Row', description: 'Modify existing.', inputs: [{ name: 'row_num', label: 'Row #', type: 'number' }, { name: 'values', label: 'New Values', type: 'json' }] },
            { id: 'find_row', label: 'Find Row', description: 'Search data.', inputs: [{ name: 'column', label: 'Column', type: 'text' }, { name: 'value', label: 'Value', type: 'text' }] },
            { id: 'get_all_rows', label: 'Get All Rows', description: 'Bulk fetch sheet data.', inputs: [{ name: 'sheet_id', label: 'Sheet ID', type: 'text' }] },
            { id: 'batch_update', label: 'Batch Update', description: 'High-performance write.', inputs: [{ name: 'data', label: 'Data Array', type: 'json' }] }
        ]
    },
    {
        id: 'googledrive',
        name: 'Google Drive',
        category: 'data',
        description: 'File storage & OCR.',
        icon: FaGoogleDrive,
        color: '#4285F4',
        triggers: [
            { id: 'file_uploaded', label: 'New File', description: 'Triggers when file uploaded.' },
            { id: 'file_shared', label: 'File Shared', description: 'Permission change detected.' },
            { id: 'storage_alert', label: 'Storage Alert', description: 'Quota warning.' }
        ],
        actions: [
            { id: 'upload_file', label: 'Upload File', description: 'Store document.', inputs: [{ name: 'url', label: 'File URL', type: 'text' }, { name: 'folder', label: 'Folder ID', type: 'text' }] },
            { id: 'create_folder', label: 'Create Folder', description: 'Organize structure.', inputs: [{ name: 'name', label: 'Name', type: 'text' }] },
            { id: 'share_file', label: 'Share File', description: 'Update access control.', inputs: [{ name: 'file_id', label: 'File ID', type: 'text' }, { name: 'email', label: 'Email', type: 'text' }] },
            { id: 'ocr_extract', label: 'OCR Extract', description: 'Get text from PDF/Image.', inputs: [{ name: 'file_id', label: 'File ID', type: 'text' }] },
            { id: 'set_expiry', label: 'Set Expiry', description: 'Auto-delete file after time.', inputs: [{ name: 'file_id', label: 'File ID', type: 'text' }, { name: 'date', label: 'Expiry Date', type: 'text' }] }
        ]
    },
    {
        id: 'airtable',
        name: 'Airtable',
        category: 'data',
        description: 'Low-code database.',
        icon: SiAirtable,
        color: '#F82B60',
        triggers: [
            { id: 'record_created', label: 'New Record', description: 'Triggers on new record in view.' }
        ],
        actions: [
            { id: 'create_record', label: 'Create Record', description: 'Add new entry.', inputs: [{ name: 'base_id', label: 'Base ID', type: 'text', required: true }] }
        ]
    },
    {
        id: 'notion',
        name: 'Notion',
        category: 'productivity',
        description: 'Workplace knowledge.',
        icon: SiNotion,
        color: '#000000',
        triggers: [
            { id: 'page_created', label: 'Page Created', description: 'New doc created.' },
            { id: 'db_item', label: 'Database Entry', description: 'New item in database.' }
        ],
        actions: [
            { id: 'create_page', label: 'Create Page', description: 'From template.', inputs: [{ name: 'title', label: 'Title', type: 'text' }] },
            { id: 'add_to_db', label: 'Add to DB', description: 'Structured entry.', inputs: [{ name: 'db_id', label: 'Database ID', type: 'text' }] },
            { id: 'query_db', label: 'Query DB', description: 'Filtered search.', inputs: [{ name: 'query', label: 'Filter JSON', type: 'json' }] }
        ]
    },

    // -------------------------
    // 7. PRODUCTIVITY & UTILITY
    // -------------------------
    {
        id: 'googlecalendar',
        name: 'Google Calendar',
        category: 'productivity',
        description: 'Time management.',
        icon: SiGooglecalendar,
        color: '#4285F4',
        triggers: [
            { id: 'event_start', label: 'Event Starting', description: 'Meeting about to start.' },
            { id: 'event_created', label: 'Event Created', description: 'New meeting scheduled.' }
        ],
        actions: [
            { id: 'create_event', label: 'Create Event', description: 'Book a slot.', inputs: [{ name: 'summary', label: 'Title', type: 'text', required: true }, { name: 'time', label: 'Time', type: 'text', required: true }] },
            { id: 'check_free_busy', label: 'Check Availability', description: 'Find free slots.', inputs: [{ name: 'time_min', label: 'Start', type: 'text' }] }
        ]
    },
    {
        id: 'calendly',
        name: 'Calendly',
        category: 'productivity',
        description: 'Appointment scheduling.',
        icon: SiCalendly,
        color: '#006BFF',
        triggers: [
            { id: 'invitee_created', label: 'Meeting Booked', description: 'User scheduled a call.' },
            { id: 'invitee_canceled', label: 'Meeting Canceled', description: 'Cancellation event.' }
        ],
        actions: [
            { id: 'get_event', label: 'Get Event Details', description: 'Fetch info.', inputs: [{ name: 'event_uuid', label: 'UUID', type: 'text' }] },
            { id: 'cancel_event', label: 'Cancel Event', description: 'Admin cancel.', inputs: [{ name: 'event_uuid', label: 'Event UUID', type: 'text', required: true }] }
        ]
    },
    {
        id: 'slack',
        name: 'Slack',
        category: 'productivity',
        description: 'Team communication.',
        icon: FaSlack,
        color: '#4A154B',
        triggers: [
            { id: 'new_msg', label: 'New Message', description: 'Channel/DM activity.' },
            { id: 'inventory_alert', label: 'Inventory Alert', description: 'Low stock warning.' },
            { id: 'new_mention', label: 'New Mention', description: 'User mentioned bot.' }
        ],
        actions: [
            { id: 'send_msg', label: 'Send Message', description: 'Post to channel/DM.', inputs: [{ name: 'channel', label: 'Channel', type: 'text', required: true }, { name: 'text', label: 'Text', type: 'textarea' }] },
            { id: 'create_channel', label: 'Create Channel', description: 'Project workspace.', inputs: [{ name: 'name', label: 'Name', type: 'text' }] },
            { id: 'upload_file', label: 'Upload File', description: 'Share document.', inputs: [{ name: 'file', label: 'File', type: 'text' }] }
        ]
    },
    {
        id: 'trello',
        name: 'Trello',
        category: 'productivity',
        description: 'Project management.',
        icon: FaTrello,
        color: '#0079BF',
        triggers: [
            { id: 'card_moved', label: 'Card Moved', description: 'Card changes list.' }
        ],
        actions: [
            { id: 'create_card', label: 'Create Card', description: 'Add new task.', inputs: [{ name: 'list_id', label: 'List ID', type: 'text', required: true }] }
        ]
    },
    {
        id: 'asana',
        name: 'Asana',
        category: 'productivity',
        description: 'Task tracking.',
        icon: SiAsana,
        color: '#F06A6A',
        triggers: [
            { id: 'task_complete', label: 'Task Completed', description: 'Task marked done.' }
        ],
        actions: [
            { id: 'create_task', label: 'Create Task', description: 'New to-do.', inputs: [{ name: 'project', label: 'Project', type: 'text', required: true }] }
        ]
    },

    // -------------------------
    // 8. GROWTH & AI
    // -------------------------
    {
        id: 'cluaiz_ai',
        name: 'Cluaiz AI Engine',
        category: 'ai',
        description: 'Native Intelligence (No API Key).',
        icon: Brain, // Using Lucide Brain for Core AI
        color: '#10A37F',
        triggers: [],
        actions: [
            { id: 'ask_ai', label: 'Ask AI (LLM)', description: 'Generate Copy/Answers.', inputs: [{ name: 'prompt', label: 'Prompt', type: 'textarea', required: true }] },
            { id: 'analyze_sentiment', label: 'Analyze Sentiment', description: 'Detect emotion (Positive/Negative).', inputs: [{ name: 'text', label: 'Text', type: 'textarea' }] },
            { id: 'extract_data', label: 'Extract Data', description: 'Parse structured info to JSON.', inputs: [{ name: 'text', label: 'Input Text', type: 'textarea' }, { name: 'schema', label: 'Schema', type: 'json' }] },
            { id: 'vision_analyze', label: 'Vision Analysis', description: 'Analyze image (e.g. damaged product).', inputs: [{ name: 'image_url', label: 'Image URL', type: 'text' }] }
        ]
    },
    {
        id: 'openai',
        name: 'OpenAI (External)',
        category: 'ai',
        description: 'Custom GPT models.',
        icon: SiOpenai,
        color: '#000000',
        triggers: [],
        actions: [
            { id: 'generate_text', label: 'Generate Text', description: 'GPT-4 completion.', inputs: [{ name: 'prompt', label: 'Prompt', type: 'textarea', required: true }] }
        ]
    },
    {
        id: 'webhook',
        name: 'Webhook',
        category: 'utility',
        description: 'Universal connector.',
        icon: Zap,
        color: '#F59E0B',
        triggers: [
            { id: 'catch_hook', label: 'Catch Hook (JSON)', description: 'Receive JSON payload from specific URL.' }
        ],
        actions: [
            { id: 'post_request', label: 'Make Request', description: 'Call external API (GET/POST).', inputs: [{ name: 'url', label: 'URL', type: 'text', required: true }, { name: 'method', label: 'Method', type: 'select', options: [{ label: 'GET', value: 'GET' }, { label: 'POST', value: 'POST' }] }, { name: 'body', label: 'JSON Body', type: 'json' }] },
            { id: 'custom_response', label: 'Send Response', description: 'Return JSON to caller.', inputs: [{ name: 'status', label: 'Status Code', type: 'number' }, { name: 'body', label: 'Response Body', type: 'json' }] }
        ]
    },
    {
        id: 'utilities',
        name: 'Utility Helpers',
        category: 'utility',
        description: 'Data transformation tools.',
        icon: Zap,
        color: '#64748B',
        triggers: [],
        actions: [
            { id: 'json_parser', label: 'JSON Parser', description: 'Convert text to variables.', inputs: [{ name: 'json_string', label: 'JSON', type: 'textarea' }] },
            { id: 'date_formatter', label: 'Date Formatter', description: 'Fix timezones.', inputs: [{ name: 'date', label: 'Date', type: 'text' }, { name: 'format', label: 'Format (DD/MM)', type: 'text' }] },
            { id: 'math_calc', label: 'Math Calculator', description: 'Run formulas.', inputs: [{ name: 'expression', label: 'Formula', type: 'text' }] },
            { id: 'random_gen', label: 'Random Generator', description: 'Create UUID/OTP.', inputs: [] }
        ]
    },

    // -------------------------
    // 9. ADVERTISING & ANALYTICS
    // -------------------------
    {
        id: 'facebook_ads',
        name: 'Facebook Lead Ads',
        category: 'marketing',
        description: 'Capture leads from FB/Insta ads.',
        icon: FaFacebookMessenger, // Closest match, usually generic FB icon
        color: '#1877F2',
        triggers: [
            { id: 'new_lead', label: 'New Lead', description: 'Instant form capture from Lead Ad.' }
        ],
        actions: [
            { id: 'add_audience', label: 'Add to Audience', description: 'Retargeting (Custom Audience).', inputs: [{ name: 'audience_id', label: 'Audience ID', type: 'text' }, { name: 'email', label: 'Email', type: 'text' }] }
        ]
    },
    {
        id: 'google_ads',
        name: 'Google Ads',
        category: 'marketing',
        description: 'PPC Campaign Automation.',
        icon: SiGoogleads,
        color: '#FBBC04',
        triggers: [
            { id: 'new_lead', label: 'New Lead', description: 'Triggers when a lead form asset is submitted.' },
            { id: 'campaign_status', label: 'Campaign Status Change', description: 'Triggers when campaign is paused/enabled.' }
        ],
        actions: [
            { id: 'add_audience', label: 'Add to Audience', description: 'Customer Match (Retargeting).', inputs: [{ name: 'list_id', label: 'Audience ID', type: 'text', required: true }, { name: 'email', label: 'Email', type: 'text', required: true }] },
            { id: 'pause_campaign', label: 'Pause Campaign', description: 'Stop spending based on condition.', inputs: [{ name: 'campaign_id', label: 'Campaign ID', type: 'text', required: true }] },
            { id: 'update_ad_group', label: 'Update Ad Group', description: 'Adjust bids or status.', inputs: [{ name: 'ad_group_id', label: 'Ad Group ID', type: 'text' }, { name: 'status', label: 'Status', type: 'select', options: [{ label: 'Enabled', value: 'ENABLED' }, { label: 'Paused', value: 'PAUSED' }] }] }
        ]
    },
    {
        id: 'google_analytics',
        name: 'Google Analytics 4',
        category: 'marketing',
        description: 'Track events and conversions.',
        icon: SiGoogleanalytics,
        color: '#E37400',
        triggers: [],
        actions: [
            { id: 'track_event', label: 'Track Event', description: 'Log server-side event.', inputs: [{ name: 'event_name', label: 'Event Name', type: 'text', required: true }, { name: 'params', label: 'Parameters (JSON)', type: 'json' }] },
            { id: 'user_property', label: 'Set User Property', description: 'Enrich visitor profile.', inputs: [{ name: 'user_id', label: 'User ID', type: 'text' }, { name: 'properties', label: 'Properties', type: 'json' }] }
        ]
    },

    // -------------------------
    // 10. INTERNAL CLUAIZ TOOLS
    // -------------------------
    {
        id: 'cluaiz_memory',
        name: 'Cluaiz Memory',
        category: 'data',
        description: 'Long-term user context storage.',
        icon: Brain,
        color: '#8B5CF6',
        triggers: [],
        actions: [
            { id: 'store_key', label: 'Store Memory', description: 'Save key-value (e.g. fav_color).', inputs: [{ name: 'key', label: 'Key', type: 'text', required: true }, { name: 'value', label: 'Value', type: 'text', required: true }, { name: 'ttl', label: 'Expiry (Days)', type: 'number' }] },
            { id: 'get_context', label: 'Retrieve Context', description: 'Fetch stored user data.', inputs: [{ name: 'keys', label: 'Keys (Comma sep)', type: 'text' }] },
            { id: 'vector_search', label: 'Semantic Search', description: 'Search Knowledge Base.', inputs: [{ name: 'query', label: 'Query', type: 'text' }] }
        ]
    },
    {
        id: 'cluaiz_crm',
        name: 'Cluaiz CRM',
        category: 'crm',
        description: 'Native Lead Manager.',
        icon: Database,
        color: '#F59E0B',
        triggers: [
            { id: 'lead_added', label: 'New Lead Added', description: 'Triggers when lead enters CRM.' },
            { id: 'stage_updated', label: 'Stage Updated', description: 'Pipeline movement.' },
            { id: 'task_overdue', label: 'Task Overdue', description: 'Follow-up missed.' }
        ],
        actions: [
            { id: 'create_contact', label: 'Create Contact', description: 'Add person to CRM.', inputs: [{ name: 'name', label: 'Name', type: 'text' }, { name: 'phone', label: 'Phone', type: 'text' }, { name: 'email', label: 'Email', type: 'text' }] },
            { id: 'update_stage', label: 'Update Stage', description: 'Move in pipeline.', inputs: [{ name: 'contact_id', label: 'Contact ID', type: 'text' }, { name: 'stage', label: 'New Stage', type: 'text' }] },
            { id: 'add_note', label: 'Add Note', description: 'Internal comment.', inputs: [{ name: 'contact_id', label: 'Contact ID', type: 'text' }, { name: 'note', label: 'Note', type: 'textarea' }] },
            { id: 'assign_agent', label: 'Assign Agent', description: 'Route to team member.', inputs: [{ name: 'agent_id', label: 'Agent ID', type: 'text' }] }
        ]
    },
    {
        id: 'auto_learning',
        name: 'Auto Learning Log',
        category: 'ai',
        description: 'AI Training Loop System.',
        icon: Brain,
        color: '#EC4899',
        triggers: [
            { id: 'chat_ended', label: 'Chat Session Ended', description: 'Conversation closed.' },
            { id: 'low_confidence', label: 'Low Confidence', description: 'AI was unsure (<70%).' },
            { id: 'user_correction', label: 'User Correction', description: 'User corrected the bot.' }
        ],
        actions: [
            { id: 'log_interaction', label: 'Log Interaction', description: 'Store transcript for review.', inputs: [{ name: 'transcript', label: 'Full Text', type: 'textarea' }, { name: 'tags', label: 'Tags', type: 'text' }] },
            { id: 'flag_review', label: 'Flag for Review', description: 'Send to human admin.', inputs: [{ name: 'reason', label: 'Reason', type: 'text' }] },
            { id: 'extract_qa', label: 'Extract Q&A', description: 'Auto-create knowledge pair.', inputs: [{ name: 'question', label: 'Question', type: 'text' }, { name: 'answer', label: 'Answer', type: 'textarea' }] }
        ]
    }
];

// --- HELPER: Get Triggers for a Source ---
export const getAppTriggers = (appId: string) => {
    const app = INTEGRATION_APPS.find(a => a.id === appId);
    return app?.triggers || [];
};

// --- HELPER: Get All Actions (Universal) ---
export const getAllActions = () => {
    return INTEGRATION_APPS.flatMap(app =>
        app.actions.map(action => ({
            ...action,
            appId: app.id,
            appName: app.name,
            appColor: app.color,
            appIcon: app.icon
        }))
    );
};
