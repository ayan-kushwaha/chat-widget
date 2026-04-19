import { ACCOUNT_TYPES, INDUSTRIES, BUSINESS_MODELS, AUDIENCES, PRIMARY_GOALS, INDUSTRY_TAXONOMY } from "./constants";

export { ACCOUNT_TYPES, INDUSTRIES, BUSINESS_MODELS, AUDIENCES, PRIMARY_GOALS, INDUSTRY_TAXONOMY };

// ── JSON PROFILE SCHEMA RULES ── //
// This acts as the brain for the BusinessProfileView fields
// so it is easily dynamic and conditionally rendered.

export const PROFILE_FORM_SCHEMA = {
    classification: [
        {
            id: "accountType",
            label: "Account Type",
            type: "tile",
            options: ACCOUNT_TYPES,
            showIf: () => true // Always visible step 1
        },
        {
            id: "industry",
            label: "Industry",
            type: "tile",
            options: INDUSTRIES,
            showIf: (org: any) => !!org.accountType // Step 2
        },
        {
            id: "subCategory",
            label: "Sub-Category",
            type: "tile",
            options: [], // Options resolved dynamically in component
            showIf: (org: any) => !!org.industry // Step 3
        },
        {
            id: "businessModel",
            label: "Business Model",
            type: "tile",
            options: BUSINESS_MODELS,
            showIf: (org: any) => (!org.accountType || org.accountType === "business") && !!org.subCategory // Step 4
        },
        {
            id: "primaryGoal",
            label: "Primary Goal",
            type: "tile",
            options: PRIMARY_GOALS,
            showIf: (org: any) => !!org.businessModel || (org.accountType === "individual" && !!org.subCategory) // Step 5
        },
        {
            id: "targetAudience",
            label: "Target Audience",
            type: "tile",
            options: AUDIENCES,
            showIf: (org: any) => !!org.primaryGoal // Step 6
        },
        {
            id: "heroOffering",
            label: "Core Product/Service ⭐",
            type: "textarea",
            placeholder: 'Briefly describe your main offering and why it is special (e.g., "Premium organic coffee beans sourced directly from Colombian farmers, roasted daily for maximum freshness").',
            showIf: (org: any) => !!org.targetAudience // Step 7
        },
        {
            id: "companySize",
            label: "Company Size (Employees)",
            type: "slider",
            min: 1,
            max: 1000,
            showIf: (org: any) => (!org.accountType || org.accountType === "business") && !!org.heroOffering // Step 8
        },
        {
            id: "foundedYear",
            label: "Founded Date",
            type: "date",
            showIf: (org: any) => (!org.accountType || org.accountType === "business") && !!org.heroOffering // Step 9
        }
    ],
    strategy: [] // Deprecated visually, but keeping array so TS interface doesn't yell
};
