import { Request, Response } from "express";
import { Organization } from "./Organization.js";
import { calculatePermissions, MAX_TOKEN_LIMIT } from "../../../utils/permissionCalculator.js";
import { PaymentService } from "./payment.service.js";
import { SnapshotService } from "./snapshot.service.js";
import { Feature } from "../../../models/Feature.js";
import { SecurityLog } from "../../../models/SecurityLog.js";
import { Coupon } from '../../../models/Coupon.js';

export const getUserOrganizations = async (req: Request, res: Response) => {
    console.log("📥 Incoming Request: GET /organizations");
    try {
        let userEmail = (req as any).user?.email;
        const userId = (req as any).user?.id;

        console.log("getUserOrganizations - Token Data:", { userEmail, userId });

        if (!userEmail && !userId) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        // If email is missing (old token), try to find it from the DB using userId
        if (!userEmail && userId) {
            console.log("Email missing in token, looking up by userId:", userId);
            // Find ANY organization where this userId exists to get their email
            const userOrg = await Organization.findOne({ "users_access.userId": userId });
            if (userOrg) {
                const user = userOrg.users_access.find((u: any) => u.userId === userId);
                if (user) {
                    userEmail = user.email;
                    console.log("Found email from DB:", userEmail);
                }
            }
        }

        // Find all organizations where this user exists (by email OR userId)
        const query: any = { is_deleted: false, $or: [] };

        if (userEmail) query.$or.push({ "users_access.email": userEmail });
        if (userId) query.$or.push({ "users_access.userId": userId });

        if (query.$or.length === 0) {
            console.log("No valid query parameters found (email/userId missing)");
            return res.json({ success: true, organizations: [] });
        }

        const organizations = await Organization.find(query).select("name plan users_access industry subCategory industry_settings installed_templates subscription usage billing_info available_ribbons accountType logo bannerImage tagline businessDescription businessModel targetAudience primaryGoal heroOffering communicationTone contactPhone contactEmail website contactChannels socialLinks operatingHours businessAddress onboardingCompleted knowledge_strategy");
        console.log(`Found ${organizations.length} organizations for user: ${userEmail || userId}`);

        // 🛡️ Safe Import Wrapper
        let Site: any, KnowledgeDocument: any, BotConfig: any, Brain: any;
        let calculateMinIOSize: any, calculateMongoDBSize: any, calculateChromaDBSize: any;

        try {
            const siteModule = await import("../../dashboard/knowledge/models/Site.js");
            Site = siteModule.Site;
        } catch (e) { console.warn("Failed to load Site model"); }

        try {
            const knDocModule = await import("../../dashboard/knowledge/models/KnowledgeDocument.js");
            KnowledgeDocument = knDocModule.KnowledgeDocument;
        } catch (e) { console.warn("Failed to load KnowledgeDocument model"); }

        try {
            const storageHelper = await import("../../dashboard/knowledge/storage.helper.js");
            calculateMinIOSize = storageHelper.calculateMinIOSize;
            calculateMongoDBSize = storageHelper.calculateMongoDBSize;
            calculateChromaDBSize = storageHelper.calculateChromaDBSize;
        } catch (e) { console.warn("Failed to load Storage Helper"); }

        // Map to a cleaner format, including the user's role in that org
        const orgsList = await Promise.all(organizations.map(async (org) => {
            console.log(`Processing Org: ${org.name} (${org._id})`);
            // Try to find user by email first, then by userId
            let userAccess = org.users_access.find((u: any) => u.email === userEmail);
            if (!userAccess && userId) {
                userAccess = org.users_access.find((u: any) => u.userId === userId);
            }

            // Get actual counts from collections (most sites don't have status field, so don't filter by it)
            const sitesCount = Site ? await Site.countDocuments({ orgId: org._id.toString() }) : 0;
            const filesCount = KnowledgeDocument ? await KnowledgeDocument.countDocuments({ orgId: org._id.toString(), status: { $ne: 'deleted' } }) : 0;

            // Get total pages count across all sites
            let totalPages = 0;
            if (Site) {
                const sitesWithPages = await Site.find({ orgId: org._id.toString() }).select('pages');
                totalPages = sitesWithPages.reduce((total: number, site: any) => {
                    return total + (site.pages?.length || 0);
                }, 0);
            }

            // Calculate storage by system (MinIO, MongoDB & ChromaDB)
            let minioSizeMB = 0, mongoSizeMB = 0, chromaSizeMB = 0, minioScan = { totalMB: 0, breakdown: { storageObjects: 0, rawObjects: 0 } };

            if (calculateMinIOSize) {
                try {
                    minioScan = await calculateMinIOSize(org._id.toString());
                    minioSizeMB = minioScan.totalMB;
                    mongoSizeMB = await calculateMongoDBSize(org._id.toString());
                    chromaSizeMB = await calculateChromaDBSize(org._id.toString());
                } catch (e) { console.warn("Storage calc failed", e); }
            }

            console.log(`📊 Org ${org.name}: Sites=${sitesCount}, Pages=${totalPages}, Files=${filesCount}`);

            // Get forms count - safely handle if BotConfig doesn't exist yet
            let formsCount = 0;
            try {
                const { BotConfig } = await import("../../../models/BotConfig.js");
                formsCount = await BotConfig.countDocuments({
                    orgId: org._id.toString(),
                    'formConfig.isActive': true
                });
            } catch (e) {
                console.warn("BotConfig model not found, defaulting forms count to 0");
            }

            // Merge actual counts into usage object (handle null usage)
            const plainOrg = org.toObject();
            const usageObj = plainOrg.usage || {};

            const enhancedUsage: any = {
                ...usageObj,
                sites_count: sitesCount,
                total_pages: totalPages,
                files_count: filesCount,
                forms_count: formsCount,
                // Add calculated system storage
                storage_by_system_calculated: {
                    minio_mb: Math.round(minioSizeMB * 100) / 100,
                    minio_breakdown: {
                        file_bucket_count: minioScan.breakdown.storageObjects,
                        raw_bucket_count: minioScan.breakdown.rawObjects
                    },
                    mongodb_mb: Math.round(mongoSizeMB * 100) / 100,
                    chroma_mb: Math.round(chromaSizeMB * 100) / 100,
                    total_mb: Math.round((
                        minioSizeMB +
                        mongoSizeMB +
                        chromaSizeMB
                    ) * 100) / 100
                },
                manual_qa_count: 0 // Will be updated below
            };

            // 🧠 Fetch Brain for Manual Training (Q&A) Stats
            try {
                const { Brain } = await import("../../dashboard/brain/models/Brain.js");
                const brain = await Brain.findOne({ orgId: org._id }).select('knowledge_base');
                if (brain && brain.knowledge_base && brain.knowledge_base.custom_text) {
                    enhancedUsage.manual_qa_count = brain.knowledge_base.custom_text.length;

                    // Calculate precise size from text content
                    const totalChars = brain.knowledge_base.custom_text.reduce((acc: number, item: any) =>
                        acc + (item.content?.length || 0) + (item.title?.length || 0), 0);
                    const manualQAMB = totalChars / (1024 * 1024);

                    // Ensure storage_breakdown exists
                    if (!enhancedUsage.storage_breakdown) {
                        enhancedUsage.storage_breakdown = {
                            documents_mb: 0,
                            websites_mb: 0,
                            training_mb: 0,
                            chat_history_mb: 0,
                            forms_mb: 0,
                            auto_learning_mb: 0,
                            total_mb: 0
                        };
                    }

                    // Update training_mb if the calculated value is more accurate (or if it was 0)
                    // We treat the calculated value as the source of truth for display if the stored one is missing/zero
                    if (manualQAMB > 0) {
                        enhancedUsage.storage_breakdown.training_mb = Math.round(manualQAMB * 100) / 100;
                    }
                }
            } catch (e) {
                console.warn("Failed to fetch Brain usage stats:", e);
            }

            return {
                id: org._id,
                name: org.name,
                plan: org.plan,
                role: userAccess?.role || 'viewer',
                isActive: userAccess?.isActive,
                userName: userAccess?.name,
                userEmail: userAccess?.email,
                userImage: userAccess?.image,
                // 🏢 Business Identity
                industry: (org as any).industry,
                accountType: (org as any).accountType,
                logo: (org as any).logo,
                bannerImage: (org as any).bannerImage,
                tagline: (org as any).tagline,
                businessDescription: (org as any).businessDescription,
                businessModel: (org as any).businessModel,
                targetAudience: (org as any).targetAudience,
                primaryGoal: (org as any).primaryGoal,
                subCategory: (org as any).subCategory,
                heroOffering: (org as any).heroOffering,
                aiConstitution: (org as any).aiConstitution,
                aiRestrictions: (org as any).aiRestrictions,
                companySize: (org as any).companySize,
                foundedYear: (org as any).foundedYear,
                policies: (org as any).policies,
                communicationTone: (org as any).communicationTone || (org as any).industry_settings?.persona,
                // 📞 Contact
                contactPhone: (org as any).contactPhone,
                contactEmail: (org as any).contactEmail,
                website: (org as any).website,
                contactChannels: (org as any).contactChannels || [],
                socialLinks: (org as any).socialLinks || [],
                // 🕐 Operating Hours
                operatingHours: (org as any).operatingHours,
                // 📍 Address
                businessAddress: (org as any).businessAddress,
                // Misc
                onboardingCompleted: (org as any).onboardingCompleted,
                installed_templates: org.installed_templates || [],
                subscription: org.subscription,
                usage: enhancedUsage,
                available_ribbons: org.available_ribbons || [],
                billing_info: org.billing_info
            };
        }));

        res.json({ success: true, organizations: orgsList });
    } catch (err: any) {
        console.error("Error fetching user organizations:", err);
        res.status(500).json({ success: false, message: "Failed to fetch organizations" });
    }
};

/**
 * 🎀 Update Persistent Ribbon Pool
 */
export const updateAvailableRibbons = async (req: Request, res: Response) => {
    try {
        const { ribbons } = req.body;
        const orgId = req.headers['x-org-id'];

        if (!orgId) {
            return res.status(400).json({ success: false, message: "Organization ID required in headers" });
        }

        if (!Array.isArray(ribbons)) {
            return res.status(400).json({ success: false, message: "Ribbons must be an array" });
        }

        // Enforce 30 label limit
        if (ribbons.length > 30) {
            return res.status(400).json({
                success: false,
                message: "Maximum 30 ribbons allowed in the pool. Please delete some before adding more."
            });
        }

        const organization = await Organization.findByIdAndUpdate(
            orgId,
            { $set: { available_ribbons: ribbons } },
            { new: true, runValidators: true }
        );

        if (!organization) {
            return res.status(404).json({ success: false, message: "Organization not found" });
        }

        res.json({
            success: true,
            message: "Ribbon pool updated",
            ribbons: organization.available_ribbons
        });
    } catch (err: any) {
        console.error("Error updating ribbon pool:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};

export const updateOrganizationPlan = async (req: Request, res: Response) => {
    try {
        const { planId, tokenCapacity, paymentId, orderId, signature, billingCycle, currency, orderSummary } = req.body;

        // Get org ID from header or user
        const orgId = req.headers['x-org-id'] || (req as any).user?.orgId;
        const userId = (req as any).user?.id;

        console.log("updateOrganizationPlan:", { orgId, planId, tokenCapacity, userId });

        if (!orgId) {
            return res.status(400).json({ success: false, message: "Organization ID is required." });
        }

        const org = await Organization.findById(orgId);
        if (!org) {
            return res.status(404).json({ success: false, message: "Organization not found." });
        }

        // 🛡️ Phase 18: Double Safety Lock
        // Even if create-order was bypassed, block the update if status is already active
        if (org.subscription?.status === 'active') {
            console.warn(`🚨 BLOCKED: Duplicate Plan Update attempted for Org: ${orgId}`);
            return res.status(400).json({
                success: false,
                message: "You already have an active subscription. Process stopped to prevent double-billing."
            });
        }

        // --- 🔒 LOCK 1: Signature Check (Integrity) ---
        // Validate plan ID (Dynamic System: Just ensure it's not empty)
        if (!planId) {
            return res.status(400).json({ success: false, message: "Invalid plan ID" });
        }

        // Validate Token Capacity
        if (tokenCapacity === undefined || tokenCapacity < 0) {
            return res.status(400).json({ success: false, message: "Token Capacity is required" });
        }

        // Ensure tokens don't exceed global max (Server-Side Enforcement)
        const safeTokens = Math.min(tokenCapacity, MAX_TOKEN_LIMIT);

        // Find organization
        const organization = await Organization.findById(orgId);

        if (!organization) {
            return res.status(404).json({ success: false, message: "Organization not found" });
        }

        // Check if user is owner or admin
        const userAccess = organization.users_access.find((u: any) => u.userId === userId);
        if (!userAccess || (userAccess.role !== 'owner' && userAccess.role !== 'admin')) {
            return res.status(403).json({ success: false, message: "Only owners and admins can change plans" });
        }


        // --- 🔒 LOCK 1: Verify Razorpay Signature ---
        const isSignatureValid = PaymentService.verifySignature(orderId, paymentId, signature);
        if (!isSignatureValid) {
            console.error(`🚨 FRAUD ATTEMPT: Invalid signature for Org ${orgId}`);

            // 🛡️ Log Security Incident
            await SecurityLog.create({
                type: 'FRAUD_SIGNATURE',
                orgId,
                userId,
                severity: 'critical',
                details: { orderId, paymentId, signature }
            }).catch(e => console.error("Failed to log security incident:", e));

            return res.status(400).json({ success: false, message: "Invalid Payment Signature. Logging attempt." });
        }

        // --- 🔒 LOCK 2: Fetch Actual Payment from Razorpay (Source of Truth) ---
        const actualPayment = await PaymentService.getPaymentDetails(paymentId);
        if (actualPayment.status !== 'captured' && actualPayment.status !== 'authorized') {
            return res.status(400).json({ success: false, message: "Payment not successful." });
        }

        // --- 🔒 LOCK 3: Cross-Check Price vs Tokens (Recalculation) ---
        let expectedPrice = PaymentService.calculateExpectedPrice(safeTokens, billingCycle, currency || actualPayment.currency);

        // 🟢 Coupon Verification (Server-Side Authority)
        if (orderSummary?.coupon_code) {
            const coupon = await Coupon.findOne({ code: orderSummary.coupon_code, isActive: true });
            if (coupon) {
                let discountAmount = 0;
                if (coupon.discountType === 'PERCENTAGE') {
                    discountAmount = expectedPrice * (coupon.discountValue / 100);
                } else if (coupon.discountType === 'FLAT') {
                    discountAmount = coupon.discountValue;
                }

                console.log(`[Verification] Coupon '${coupon.code}' applied. Discount: ${discountAmount}`);
                expectedPrice = Math.max(0, expectedPrice - discountAmount);

                // 🟢 Increment Usage Count (Atomic)
                await Coupon.findOneAndUpdate(
                    { _id: coupon._id },
                    { $inc: { usedCount: 1 } }
                ).catch(e => console.error("Failed to increment coupon usage:", e));
            }
        }

        console.log(`[Verification] Paid: ${actualPayment.amount}, Expected: ${expectedPrice} (${currency || actualPayment.currency})`);

        // Handle Mock Payments (Auto-match expected price during development)
        if (actualPayment.amount === -1) {
            console.log("⚠️ MOCK MODE: Payment amount & currency match forced for DEV.");

            // 🟢 Fix: Trust Frontend Calculation in Mock Mode (to capture discounts/offers correctly)
            if (orderSummary?.final_total !== undefined) {
                actualPayment.amount = orderSummary.final_total;
                expectedPrice = orderSummary.final_total; // Bypass variance check for verified Mock
            } else {
                actualPayment.amount = expectedPrice;
            }

            // 🟢 Fix: Ensure we use the User's requested currency for Mock transactions
            if (currency) {
                actualPayment.currency = currency;
            }
        }

        // 5% variance allowed for rounding/currency fluctuations
        const variance = expectedPrice * 0.05;
        if (Math.abs(actualPayment.amount - expectedPrice) > variance) {
            console.error(`🚨 FRAUD ATTEMPT: Price Mismatch! Paid: ${actualPayment.amount}, Expected: ${expectedPrice} for ${safeTokens} tokens.`);

            // 🛡️ Log Security Incident
            await SecurityLog.create({
                type: 'FRAUD_PRICE_MISMATCH',
                orgId,
                userId,
                severity: 'high',
                details: {
                    paid: actualPayment.amount,
                    expected: expectedPrice,
                    tokens: safeTokens,
                    currency: actualPayment.currency
                }
            }).catch(e => console.error("Failed to log security incident:", e));

            return res.status(400).json({
                success: false,
                message: "Price mismatch detected. This incident will be reported.",
                details: "Payment does not match the chosen plan parameters."
            });
        }

        // Fetch fresh permissions based on plan
        const permissions = calculatePermissions(safeTokens);

        // 🟢 FIX: Calculate Market Price (List Price)
        // User Request: "jab price hai 6.16 to is ha 9.24" -> 1.5x Markup IS DESIRED.
        // Restoration of Value Anchor Logic
        const MARKUP_FACTOR = 1.5;

        // Get base price: either from orderSummary.subtotal OR recalculate without discounts
        const basePlanPrice = orderSummary?.subtotal ||
            PaymentService.calculateExpectedPrice(safeTokens, billingCycle, actualPayment.currency);

        // Calculate Market Price (Anchor)
        // Ensure it is calculated from the higher of base or paid to guarantee markup visuals
        const anchorPrice = Math.max(basePlanPrice, actualPayment.amount);
        const marketPrice = anchorPrice * MARKUP_FACTOR;

        const snapshotToSave = await SnapshotService.createPlanSnapshot({
            planName: planId, // or lookup from config
            priceOffer: actualPayment.amount,  // Final price after all discounts
            marketPrice: marketPrice,          // List Price (1.5x)
            currency: actualPayment.currency,
            billing_cycle: billingCycle,
            tokens: safeTokens,
            permissions: permissions.permissions,
            orderSummary: orderSummary // Storing breakdown for records
        });

        // 🔄 ROLLOVER LOGIC (Fresh Start + Rollover) - Phase 24
        // 1. Full Payment Received (Already Checked)
        // 2. Reset Dates (Start Today)
        // 3. Add Old Tokens to New Limit (The Gift)

        let rollover_tokens = 0;
        let rolloverExpiryDate: Date | null = null;
        let totalLimitWithRollover = safeTokens;

        // Calculate Rollover from OLD Plan
        if (organization.usage) {
            // 🛑 Fix: Don't rollover if coming from Free/Trial/Expired (orphaned logic)
            // Only rollover if previous subscription was ACTIVE and PAID.
            const isEligibleForRollover =
                organization.subscription?.status === 'active' &&
                organization.plan !== 'free' &&
                !organization.plan.includes('free'); // Extra check for legacy naming

            const currentLimit = organization.usage.words_limit || 0;
            const used = organization.usage.tokensUsed || 0;
            const oldRolloverRem = organization.usage.rollover_tokens || 0;

            // 🟢 TOP-UP CONSUMPTION LOGIC (Persistent Wallet)
            // Check if user consumed more than their Plan + Rollover
            // If so, deduct the excess from the Top-up Balance
            const totalPlanTokens = currentLimit + oldRolloverRem;
            const usedFromTopup = Math.max(0, used - totalPlanTokens);

            if (usedFromTopup > 0) {
                // Deduct from Balance, ensure it doesn't go below 0
                organization.usage.topup_balance = Math.max(0, (organization.usage.topup_balance || 0) - usedFromTopup);
                console.log(`📉 [Reset] User consumed ${usedFromTopup} tokens from Top-up Wallet. New Balance: ${organization.usage.topup_balance}`);
            }

            if (isEligibleForRollover) {
                const remaining = Math.max(0, currentLimit - used);

                // Add previously rolled over tokens if they are still valid?
                // Strategy: Fresh Start usually just adds EVERYTHING user has left to the new stack.
                // Simplest & Most Generous: Remaining Base + Remaining Rollover
                // const oldRolloverRem = organization.usage.rollover_tokens || 0; // Already defined above

                rollover_tokens = remaining + oldRolloverRem;
                totalLimitWithRollover = safeTokens + rollover_tokens; // New Base + Old Leftovers

                console.log(`♻️ [Upgrade Rollover] User had ${remaining} (Base) + ${oldRolloverRem} (Rollover) left.`);
                console.log(`🎁 Gift Added: ${rollover_tokens} tokens. New Total: ${totalLimitWithRollover}`);
            } else {
                console.log("🚫 [Upgrade] Limit Reset. No rollover from Trial/Free/Expired plan.");
                rollover_tokens = 0;
                totalLimitWithRollover = safeTokens;
            }
        }

        // Set Plan End Date (Fresh 30/90/365 Days from TODAY)
        const endDate = new Date();
        if (billingCycle === 'yearly') {
            endDate.setFullYear(endDate.getFullYear() + 1);
        } else if (billingCycle === '6_months') {
            endDate.setMonth(endDate.getMonth() + 6);
        } else if (billingCycle === '3_months') {
            endDate.setMonth(endDate.getMonth() + 3);
        } else {
            endDate.setMonth(endDate.getMonth() + 1);
        }

        // Update Organization Plan
        organization.plan = planId;
        organization.planStartDate = new Date();
        organization.planEndDate = endDate;

        // 🔒 Save Persistent Billing Log (LIFETIME RECORD)
        // Using new Transaction model to avoid conflicts
        const { Transaction } = await import('../transaction/Transaction');

        await Transaction.create({
            organizationId: orgId,
            amount: actualPayment.amount,
            currency: actualPayment.currency,
            type: organization.subscription?.status === 'active' ? 'subscription_renew' : 'purchase', // Mapped to valid ENUM
            status: 'success',
            planName: planId, // Storing Plan ID as Name for now, or fetch real name
            interval: billingCycle === 'yearly' ? 'year' : 'month',
            invoiceUrl: 'pending',
            razorpay_order_id: orderId,
            razorpay_payment_id: paymentId,
            paymentMethod: req.body.paymentMethod || 'Online', // 🟢 Save Payment Method

            // Professional Billing Fields
            invoiceNumber: `INV-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`, // Auto-generate basic ID
            billingPeriod: {
                start: new Date(),
                end: endDate
            },

            // 🟢 Fix: Save the FULL Snapshot (Critical for History)
            snapshot: snapshotToSave,

            // 🟢 FIX: Save COMPLETE Billing Details (Point-in-Time Snapshot)
            billingDetails: {
                customerName: req.body.billingInfo?.company_name || organization.name,
                companyName: req.body.billingInfo?.company_name || organization.name,
                email: req.body.billingInfo?.email || req.body.email || (organization.billing_info as any)?.email || '',
                phone: req.body.billingInfo?.phone || organization.billing_info?.phone || '',
                addressLine1: req.body.billingInfo?.address_line1 || organization.billing_info?.address_line1 || '',
                city: req.body.billingInfo?.city || organization.billing_info?.city || '',
                state: req.body.billingInfo?.state || organization.billing_info?.state || '',
                stateName: req.body.billingInfo?.state_name || organization.billing_info?.state_name || '',
                country: req.body.billingInfo?.country || organization.billing_info?.country || '',
                countryName: req.body.billingInfo?.country_name || organization.billing_info?.country_name || '',
                pincode: req.body.billingInfo?.pincode || organization.billing_info?.pincode || '',
                taxId: req.body.billingInfo?.tax_id || organization.billing_info?.tax_id || ''
            }
        });

        // Update persistent flag for Free Plan
        if (planId.toLowerCase().includes('free')) {
            organization.hasUsedFreePlan = true;
        }

        // Update Subscription Details (Fresh Start)
        organization.subscription = {
            ...(organization.subscription || {}),
            plan_id: planId,

            // 🟢 Token Breakdown
            token_capacity: safeTokens + rollover_tokens + (organization.usage?.topup_balance || 0), // Total
            tokens_plan: safeTokens,
            tokens_rollover: rollover_tokens,
            tokens_topup: organization.usage?.topup_balance || 0,

            subscribed_at: new Date(),
            expires_at: endDate,
            status: 'active',
            snapshot: snapshotToSave as any
        };

        // Reset and Update Usage with Rollover
        if (!organization.usage) {
            organization.usage = {
                tokensUsed: 0,
                words_used: 0,
                words_limit: safeTokens, // Base Limit
                topup_balance: 0,
                rollover_tokens: rollover_tokens, // Extra Gift
                rollover_expires_at: endDate, // Rollover Valid for Full Cycle
                last_rollover_count: rollover_tokens,
                chatbotsCreated: 0,
                websitePagesAdded: 0,
                filesUploaded: 0,
                leadFormsCreated: 0,
                automationFlowsCreated: 0,
                lastResetDate: new Date()
            } as any;
            // 🟢 Update Total Tokens (Plan + Rollover + Topup)
            (organization.usage as any).total_tokens = safeTokens + rollover_tokens + (organization.usage!.topup_balance || 0);
        } else {
            organization.usage!.tokensUsed = 0; // Reset Usage
            organization.usage!.words_used = 0;
            organization.usage!.words_limit = safeTokens; // New Base
            organization.usage!.rollover_tokens = rollover_tokens; // The Gift
            organization.usage!.rollover_expires_at = endDate; // Valid till next cycle
            organization.usage!.last_rollover_count = rollover_tokens;
            organization.usage!.lastResetDate = new Date();
            // 🟢 Update Total Tokens (Plan + Rollover + Topup)
            (organization.usage as any).total_tokens = safeTokens + rollover_tokens + (organization.usage!.topup_balance || 0);
        }

        await organization.save();

        console.log(`✅ Plan securely updated to ${planId} for org ${orgId}`);

        res.json({
            success: true,
            message: "Plan updated successfully (Fresh Start + Rollover Applied)",
            plan: planId,
            snapshot: organization.subscription?.snapshot,
            planEndDate: organization.planEndDate,
            rollover_added: rollover_tokens
        });
    } catch (err: any) {
        console.error("❌ Critical Error in Plan Update:", err.message);
        res.status(500).json({
            success: false,
            message: "Failed to securely verify and update plan",
            error: err.message
        });
    }
};

export const updateOrganizationSettings = async (req: Request, res: Response) => {
    try {
        const {
            // Legacy
            industry, settings, governance,
            // 🏢 Business Identity
            name, accountType, logo, bannerImage, tagline, businessDescription, businessModel,
            subCategory,
            targetAudience, primaryGoal, heroOffering, communicationTone, aiConstitution, aiRestrictions,
            companySize, foundedYear, policies,
            // 📞 Contact
            contactPhone, contactEmail, website,
            contactChannels, socialLinks,
            // 🕐 Operating Hours
            operatingHours,
            // 📍 Address
            businessAddress,
            // Meta
            onboardingCompleted
        } = req.body;

        const orgId = req.headers['x-org-id'] || (req as any).user?.orgId;
        const userId = (req as any).user?.id;

        if (!orgId) {
            return res.status(400).json({ success: false, message: "Organization ID required" });
        }

        const organization = await Organization.findById(orgId);
        if (!organization) {
            return res.status(404).json({ success: false, message: "Organization not found" });
        }

        // Check permissions (Owner/Admin)
        const userAccess = organization.users_access.find((u: any) => u.userId === userId);
        if (!userAccess || (userAccess.role !== 'owner' && userAccess.role !== 'admin')) {
            return res.status(403).json({ success: false, message: "Only owners/admins can update settings" });
        }

        // ── Business Identity ──
        if (name !== undefined && name !== '') organization.name = name;
        if (industry !== undefined) organization.industry = industry;
        if (subCategory !== undefined) (organization as any).subCategory = subCategory;
        if (accountType !== undefined) (organization as any).accountType = accountType;
        if (logo !== undefined) (organization as any).logo = logo;
        if (bannerImage !== undefined) (organization as any).bannerImage = bannerImage;
        if (tagline !== undefined) (organization as any).tagline = tagline;
        if (businessDescription !== undefined) (organization as any).businessDescription = businessDescription;
        if (businessModel !== undefined) (organization as any).businessModel = businessModel;
        if (targetAudience !== undefined) (organization as any).targetAudience = targetAudience;
        if (primaryGoal !== undefined) (organization as any).primaryGoal = primaryGoal;
        if (heroOffering !== undefined) (organization as any).heroOffering = heroOffering;
        if (aiConstitution !== undefined) (organization as any).aiConstitution = aiConstitution;
        if (aiRestrictions !== undefined) (organization as any).aiRestrictions = aiRestrictions;
        if (companySize !== undefined) (organization as any).companySize = companySize;
        if (foundedYear !== undefined) (organization as any).foundedYear = foundedYear;
        if (policies !== undefined) {
            (organization as any).policies = { ...((organization as any).policies || {}), ...policies };
        }
        if (communicationTone !== undefined) {
            (organization as any).communicationTone = communicationTone;
            // also sync legacy persona field
            organization.industry_settings = {
                ...organization.industry_settings,
                persona: communicationTone
            };
        }

        // ── Contact ──
        if (contactPhone !== undefined) (organization as any).contactPhone = contactPhone;
        if (contactEmail !== undefined) (organization as any).contactEmail = contactEmail;
        if (website !== undefined) (organization as any).website = website;
        if (contactChannels !== undefined) (organization as any).contactChannels = contactChannels;
        if (socialLinks !== undefined) (organization as any).socialLinks = socialLinks;

        // ── Operating Hours ──
        if (operatingHours !== undefined) (organization as any).operatingHours = operatingHours;

        // ── Physical Address ──
        if (businessAddress !== undefined) {
            (organization as any).businessAddress = {
                ...((organization as any).businessAddress || {}),
                ...businessAddress
            };
        }

        // ── Legacy settings block ──
        if (settings) {
            organization.industry_settings = {
                ...organization.industry_settings,
                ...settings
            };
        }

        // ── Data Governance ──
        if (governance) {
            organization.governance = {
                ...(organization.governance || {}),
                ...governance
            };
        }

        // ── Onboarding ──
        if (onboardingCompleted !== undefined) (organization as any).onboardingCompleted = onboardingCompleted;

        await organization.save();

        console.log(`✅ Updated Org ${orgId} business profile:`, { name, industry, contactPhone, businessAddress });

        res.json({ success: true, message: "Business profile updated successfully" });
    } catch (err) {
        console.error("Error updating org settings:", err);
        res.status(500).json({ success: false, message: "Failed to update settings" });
    }
};

export const addTokenTopup = async (req: Request, res: Response) => {
    try {
        const { tokens, amount, currency, paymentId, orderId, billing_info } = req.body;

        // Get org ID from header or user
        const orgId = req.headers['x-org-id'] || (req as any).user?.orgId;
        const userId = (req as any).user?.id;

        if (!orgId) return res.status(400).json({ success: false, message: "Organization ID required" });
        if (!tokens || tokens <= 0) return res.status(400).json({ success: false, message: "Valid token amount required" });

        const organization = await Organization.findById(orgId);
        if (!organization) return res.status(404).json({ success: false, message: "Organization not found" });

        // Check Permissions (Admins/Owners only)
        const userAccess = organization.users_access.find((u: any) => u.userId === userId);
        if (!userAccess || (userAccess.role !== 'owner' && userAccess.role !== 'admin')) {
            return res.status(403).json({ success: false, message: "Permission denied" });
        }

        // Update Top-up Balance
        // Ensure usage object exists
        if (!organization.usage) {
            organization.usage = {
                tokensUsed: 0,
                words_used: 0,
                words_limit: 200000,
                topup_balance: 0,
                topup_limit: 0,
                chatbotsCreated: 0,
                websitePagesAdded: 0,
                filesUploaded: 0,
                leadFormsCreated: 0,
                automationFlowsCreated: 0,
                lastResetDate: new Date()
            } as any;
        }

        organization.usage!.topup_balance = (organization.usage!.topup_balance || 0) + tokens;
        organization.usage!.topup_limit = (organization.usage!.topup_limit || 0) + tokens; // 🟢 Track Total Purchased

        // 🟢 SYNC: Update Total Tokens & Subscription Breakdown (Requested by User)
        const limit = organization.usage!.words_limit || 0;
        const rollover = organization.usage!.rollover_tokens || 0;
        const topup = organization.usage!.topup_balance;

        (organization.usage as any).total_tokens = limit + rollover + topup;

        // Sync with Subscription if it exists
        if (organization.subscription) {
            organization.subscription.tokens_topup = topup;
            organization.subscription.token_capacity = (organization.usage as any).total_tokens;
        }

        // 🔒 Save Persistent Billing Log (Transaction History)
        console.log("Attempting to create Billing Log. Data:", { amount, paymentId, orderId });

        if (paymentId) { // Check paymentId primarily
            try {
                const { Transaction } = await import('../transaction/Transaction');

                const safeAmount = amount ? Number(amount) : 0;

                await Transaction.create({
                    organizationId: orgId,
                    amount: safeAmount,
                    currency: currency || 'INR',
                    type: 'topup', // New Enum type for Top-up
                    status: 'success',
                    planName: 'Top-up Wallet',
                    interval: 'one_time',
                    invoiceUrl: 'pending',
                    razorpay_order_id: orderId,
                    razorpay_payment_id: paymentId,
                    paymentMethod: req.body.paymentMethod || 'Online',

                    // Professional Billing Fields
                    invoiceNumber: `INV-TOP-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`,
                    billingPeriod: {
                        start: new Date(),
                        end: new Date() // Immediate consumption validity
                    },

                    billingDetails: {
                        customerName: billing_info?.company_name || organization.name,
                        companyName: billing_info?.company_name || organization.name,
                        email: billing_info?.email || (organization.billing_info as any)?.email || '', // Fix access safely
                        addressLine1: billing_info?.address_line1 || organization.billing_info?.address_line1 || '',
                        country: billing_info?.country || organization.billing_info?.country || '',
                        state: billing_info?.state || organization.billing_info?.state || ''
                    },

                    // Snapshot of what was bought
                    snapshot: {
                        plan_name: "Token Top-up",
                        price_paid: safeAmount,
                        tokens: tokens,
                        timestamp: new Date().toISOString()
                    }
                });
                console.log(`✅ Billing Log Created for Top-up: ${safeAmount} ${currency}`);
            } catch (logErr) {
                console.error("⚠️ Failed to create billing log for top-up:", logErr);
            }
        } else {
            console.warn("⚠️ Skipping Billing Log: Missing paymentId or amount.", { paymentId, amount });
        }

        await organization.save();

        res.json({
            success: true,
            message: "Tokens added successfully",
            topup_balance: organization.usage!.topup_balance,
            total_available: organization.usage!.words_limit + organization.usage!.topup_balance
        });

    } catch (err: any) {
        console.error("Error adding top-up:", err);
        res.status(500).json({ success: false, message: "Failed to add tokens" });
    }
};

// ✅ Update Billing Address (KYC)
export const saveBillingAddress = async (req: Request, res: Response) => {
    try {
        const { orgId, billing_info } = req.body;
        const userId = (req as any).user?.id;

        if (!orgId || !billing_info) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }

        // Verify User Permission (Must be Owner or Admin)
        const org = await Organization.findOne({
            _id: orgId,
            "users_access": {
                $elemMatch: { userId: userId, role: { $in: ['owner', 'admin'] } }
            }
        });

        if (!org) {
            return res.status(403).json({ success: false, message: "Unauthorized or Organization not found" });
        }

        // Update Billing Info
        org.billing_info = {
            ...org.billing_info,
            ...billing_info
        };

        // 🛡️ Data Sanitization: Fix invalid subscription status if present (e.g. empty string)
        if (org.subscription && org.subscription.status === '' as any) {
            console.warn(`[Auto-Fix] Resetting invalid subscription.status for Org ${org._id}`);
            org.subscription.status = 'trial';
        }
        // 🔒 Save Billing Info
        org.billing_info = billing_info;

        // 🧠 DEEP SYNC: Calculate Authoritative Geo Config
        const { GeoService } = await import("../../../services/geo.service");
        const geoConfig = GeoService.getCurrencyConfig(billing_info.country); // Get Official Tier for this Country

        await org.save();

        console.log(`✅ Billing Address Updated for Org ${orgId}. Country: ${billing_info.country}, Tier: ${geoConfig.pricingTier}`);

        res.json({
            success: true,
            message: "Billing address updated successfully",
            geoConfig: geoConfig, // 🚀 Send Authority Config to Frontend
            billing_info: org.billing_info
        });
    } catch (error) {
        console.error("Save Billing Address Error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

/**
 * Update user name in organization's users_access array AND Organization Name
 */
export const updateUserNameInOrg = async (req: Request, res: Response) => {
    try {
        // Extract orgId from body (matching frontend call)
        const { orgId, userId, name } = req.body;

        if (!orgId || !userId || !name) {
            return res.status(400).json({ success: false, message: "orgId, userId and name are required" });
        }

        const org = await Organization.findById(orgId);
        if (!org) {
            return res.status(404).json({ success: false, message: "Organization not found" });
        }

        // 1. Update User Name in users_access
        const userIndex = org.users_access.findIndex((u: any) => u.userId === userId);
        if (userIndex !== -1) {
            org.users_access[userIndex].name = name;
        }

        // 2. Update Organization Name (Workspace Name) as requested
        // "dono jo cha kro" - Sync workspace name to the User/Company name
        org.name = name;
        // Optional: Maintain "Workspace" suffix if desired, but user asked to fix/change it. 
        // We'll set it directly to the name provided (Company Name or Full Name).

        await org.save();

        res.json({ success: true, message: "User & Workspace name updated successfully" });
    } catch (error) {
        console.error("Update User Name Error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

/**
 * 🖼️ Upload Org Asset (logo / banner) to MinIO and return permanent URL
 */
import multer from 'multer';
import { uploadFile as uploadToStorage } from '../../shared/services/storage.service.js';

export const orgAssetUploadMiddleware = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
}).single('file');

export const uploadOrgAsset = async (req: Request, res: Response) => {
    try {
        const file = req.file;
        if (!file) {
            return res.status(400).json({ success: false, message: "No file provided" });
        }

        // Give it a proper unique name: org-assets/{orgId}/{type}/{timestamp}.webp
        const orgId = req.headers['x-org-id'] || (req as any).user?.orgId || 'general';
        const assetType = req.body.assetType || 'asset'; // 'logo' | 'banner' | 'asset'
        const ext = file.originalname.split('.').pop() || 'webp';
        file.originalname = `org-assets/${orgId}/${assetType}-${Date.now()}.${ext}`;

        const permanentUrl = await uploadToStorage(file);

        console.log(`✅ Org asset uploaded: ${permanentUrl}`);
        res.json({ success: true, url: permanentUrl });
    } catch (err: any) {
        console.error("Org asset upload error:", err);
        res.status(500).json({ success: false, message: "Asset upload failed" });
    }
};

/**
 * 🧠 Generate AI Knowledge Strategy Guide
 * Calls the Python AI engine with the organization's business profile
 */
export const generateKnowledgeStrategy = async (req: Request, res: Response) => {
    try {
        const orgId = req.headers['x-org-id'] || (req as any).user?.orgId;
        const userId = (req as any).user?.id;

        if (!orgId) {
            return res.status(400).json({ success: false, message: "Organization ID required" });
        }

        const organization = await Organization.findById(orgId);
        if (!organization) {
            return res.status(404).json({ success: false, message: "Organization not found" });
        }

        // Check Permissions (Admins/Owners only)
        const userAccess = organization.users_access.find((u: any) => u.userId === userId);
        if (!userAccess || (userAccess.role !== 'owner' && userAccess.role !== 'admin')) {
            return res.status(403).json({ success: false, message: "Permission denied" });
        }

        // Prepare context for the AI Engine
        const businessProfile = {
            name: organization.name,
            industry: organization.industry,
            subCategory: organization.subCategory,
            businessModel: organization.businessModel,
            targetAudience: organization.targetAudience,
            primaryGoal: organization.primaryGoal,
            heroOffering: organization.heroOffering,
            businessDescription: organization.businessDescription
        };

        console.log(`🤖 Requesting Knowledge Strategy for Org: ${orgId}`, businessProfile);

        // Call the Python AI engine using native fetch
        const aiEngineUrl = process.env.AI_ENGINE_URL || 'http://localhost:5000';
        const response = await fetch(`${aiEngineUrl}/api/v1/knowledge/generate_strategy`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ businessProfile })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`AI Engine error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        const strategy = data.strategy; // Expecting the Python engine to return { strategy: { ... } }

        if (!strategy) {
            throw new Error("Invalid response from AI engine");
        }

        // Save to Database
        organization.knowledge_strategy = strategy;
        await organization.save();

        console.log(`✅ Knowledge Strategy saved for Org: ${orgId}`);

        res.json({
            success: true,
            strategy: strategy,
            message: "Strategy generated successfully"
        });

    } catch (err: any) {
        console.error("❌ Error generating knowledge strategy:", err);
        res.status(500).json({ success: false, message: "Failed to generate strategy", error: err.message });
    }
};
