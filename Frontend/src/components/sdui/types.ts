export interface SDUIAction {
    type: 'api_call' | 'navigate' | 'submit_form' | 'link' | 'send_message';
    label?: string;
    endpoint?: string;
    payload?: any;
}

export interface UIBlock {

    type: string;
    variant?: string;
    style?: Record<string, string>;
    content?: string;
    url?: string;
    data?: any;
    children?: UIBlock[];
    items?: UIBlock[]; // For carousel
    actions?: SDUIAction[];
}

