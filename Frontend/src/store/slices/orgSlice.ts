import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Site {
    _id: string;
    domain: string;
    status: string;
    crawl_schedule: string;
}

interface Organization {
    _id: string;
    name: string;
    plan: string;
    brain: {
        knowledge_base: {
            websites: Site[];
        };
    };
}

interface OrgState {
    currentOrg: Organization | null;
    sites: Site[];
    loading: boolean;
    error: string | null;
}

const initialState: OrgState = {
    currentOrg: null,
    sites: [],
    loading: false,
    error: null,
};

const orgSlice = createSlice({
    name: 'org',
    initialState,
    reducers: {
        setOrg: (state, action: PayloadAction<Organization>) => {
            state.currentOrg = action.payload;
            state.sites = action.payload.brain?.knowledge_base?.websites || [];
        },
        setLoading: (state, action: PayloadAction<boolean>) => {
            state.loading = action.payload;
        },
        setError: (state, action: PayloadAction<string | null>) => {
            state.error = action.payload;
        },
        updateSiteStatus: (state, action: PayloadAction<{ id: string; status: string }>) => {
            const site = state.sites.find(s => s._id === action.payload.id);
            if (site) site.status = action.payload.status;
        }
    },
});

export const { setOrg, setLoading, setError, updateSiteStatus } = orgSlice.actions;
export default orgSlice.reducer;
