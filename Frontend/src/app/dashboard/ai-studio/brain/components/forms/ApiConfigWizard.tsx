"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ChevronLeft, ChevronRight, Key, Lock, User } from "lucide-react";
import { toast } from "sonner";

interface ApiConfigWizardProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialData?: any;
    onComplete: (config: any) => void;
}

export function ApiConfigWizard({ open, onOpenChange, initialData, onComplete }: ApiConfigWizardProps) {
    const [step, setStep] = useState(1);

    // Config state
    const [method, setMethod] = useState<'GET' | 'POST'>(initialData?.method || 'GET');
    const [authType, setAuthType] = useState<'none' | 'api-key' | 'bearer' | 'basic'>(initialData?.authType || 'none');
    const [authCredentials, setAuthCredentials] = useState({
        apiKey: '',
        token: '',
        username: '',
        password: '',
        headerName: 'X-API-Key'
    });
    const [searchParam, setSearchParam] = useState(initialData?.requestConfig?.searchParam || 'q');
    const [bodyTemplate, setBodyTemplate] = useState(initialData?.requestConfig?.bodyTemplate || '');
    const [fieldMappings, setFieldMappings] = useState<any[]>([]);

    const steps = [
        { id: 1, name: 'Method & Endpoint' },
        { id: 2, name: 'Authentication' },
        { id: 3, name: 'Field Mapping' },
        { id: 4, name: 'Review' }
    ];

    const handleNext = () => {
        if (step < steps.length) setStep(step + 1);
    };

    const handleBack = () => {
        if (step > 1) setStep(step - 1);
    };

    const handleComplete = () => {
        const config = {
            method,
            authType,
            authCredentials: authType !== 'none' ? authCredentials : {},
            requestConfig: {
                searchParam,
                bodyTemplate: method === 'POST' ? bodyTemplate : undefined
            },
            fieldMapping: fieldMappings
        };
        onComplete(config);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Configure API Source - Step {step} of {steps.length}</DialogTitle>
                </DialogHeader>

                {/* Progress bar */}
                <div className="flex gap-2 mb-6">
                    {steps.map((s) => (
                        <div
                            key={s.id}
                            className={`flex-1 h-2 rounded-full ${s.id <= step ? 'bg-primary' : 'bg-muted'}`}
                        />
                    ))}
                </div>

                <div className="min-h-[400px]">
                    {/* Step 1: Method & Endpoint */}
                    {step === 1 && (
                        <div className="space-y-6">
                            <div className="space-y-3">
                                <Label>HTTP Method *</Label>
                                <RadioGroup value={method} onValueChange={(v: any) => setMethod(v)}>
                                    <div className="flex items-center space-x-2 border p-3 rounded-lg cursor-pointer hover:bg-muted">
                                        <RadioGroupItem value="GET" id="get" />
                                        <Label htmlFor="get" className="cursor-pointer flex-1">
                                            <div className="font-medium">GET</div>
                                            <div className="text-xs text-muted-foreground">For simple queries with URL parameters</div>
                                        </Label>
                                    </div>
                                    <div className="flex items-center space-x-2 border p-3 rounded-lg cursor-pointer hover:bg-muted">
                                        <RadioGroupItem value="POST" id="post" />
                                        <Label htmlFor="post" className="cursor-pointer flex-1">
                                            <div className="font-medium">POST</div>
                                            <div className="text-xs text-muted-foreground">For complex queries with JSON body (e.g., PHP APIs)</div>
                                        </Label>
                                    </div>
                                </RadioGroup>
                            </div>

                            {method === 'GET' && (
                                <div className="space-y-2">
                                    <Label>Search Parameter Name</Label>
                                    <Input
                                        placeholder="e.g., q, search, query"
                                        value={searchParam}
                                        onChange={(e) => setSearchParam(e.target.value)}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        The URL parameter used for search. Example: <code>?{searchParam}=laptop</code>
                                    </p>
                                </div>
                            )}

                            {method === 'POST' && (
                                <div className="space-y-2">
                                    <Label>Request Body Template</Label>
                                    <Textarea
                                        placeholder={'{\n  "action": "search",\n  "keyword": "{{query}}",\n  "limit": 50\n}'}
                                        value={bodyTemplate}
                                        onChange={(e) => setBodyTemplate(e.target.value)}
                                        className="font-mono text-sm"
                                        rows={8}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Use <code>{`{{query}}`}</code> as placeholder for user's search term
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 2: Authentication */}
                    {step === 2 && (
                        <div className="space-y-6">
                            <div className="space-y-3">
                                <Label>Authentication Type *</Label>
                                <Select value={authType} onValueChange={(v: any) => setAuthType(v)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">None (Public API)</SelectItem>
                                        <SelectItem value="api-key">API Key</SelectItem>
                                        <SelectItem value="bearer">Bearer Token</SelectItem>
                                        <SelectItem value="basic">Basic Auth (Username/Password)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {authType === 'api-key' && (
                                <>
                                    <div className="space-y-2">
                                        <Label className="flex items-center gap-2">
                                            <Key className="w-4 h-4" /> API Key *
                                        </Label>
                                        <Input
                                            type="password"
                                            placeholder="Enter your API key"
                                            value={authCredentials.apiKey}
                                            onChange={(e) => setAuthCredentials({ ...authCredentials, apiKey: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Header Name</Label>
                                        <Input
                                            placeholder="X-API-Key"
                                            value={authCredentials.headerName}
                                            onChange={(e) => setAuthCredentials({ ...authCredentials, headerName: e.target.value })}
                                        />
                                    </div>
                                </>
                            )}

                            {authType === 'bearer' && (
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2">
                                        <Lock className="w-4 h-4" /> Bearer Token *
                                    </Label>
                                    <Input
                                        type="password"
                                        placeholder="Enter your bearer token"
                                        value={authCredentials.token}
                                        onChange={(e) => setAuthCredentials({ ...authCredentials, token: e.target.value })}
                                    />
                                </div>
                            )}

                            {authType === 'basic' && (
                                <>
                                    <div className="space-y-2">
                                        <Label className="flex items-center gap-2">
                                            <User className="w-4 h-4" /> Username *
                                        </Label>
                                        <Input
                                            placeholder="e.g., admin or your@email.com"
                                            value={authCredentials.username}
                                            onChange={(e) => setAuthCredentials({ ...authCredentials, username: e.target.value })}
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Your API username or email address
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="flex items-center gap-2">
                                            <Lock className="w-4 h-4" /> Password *
                                        </Label>
                                        <Input
                                            type="password"
                                            placeholder="Enter your API password"
                                            value={authCredentials.password}
                                            onChange={(e) => setAuthCredentials({ ...authCredentials, password: e.target.value })}
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Your account password (will be encrypted)
                                        </p>
                                    </div>
                                </>
                            )}

                            {authType !== 'none' && (
                                <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                                    <p className="text-xs text-yellow-800 dark:text-yellow-200">
                                        🔒 <strong>Security:</strong> Credentials are encrypted before storage using AES-256 encryption.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 3: Field Mapping - Todo */}
                    {step === 3 && (
                        <div className="space-y-4">
                            <p className="text-sm text-muted-foreground">
                                Field mapping will be auto-detected from API response when you test the connection.
                                You can customize mappings after creating the API source.
                            </p>
                            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                                <p className="text-sm text-blue-700 dark:text-blue-300">
                                    ℹ️ This step will be enhanced in the next update to allow manual field mapping configuration.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Review */}
                    {step === 4 && (
                        <div className="space-y-4">
                            <h3 className="font-semibold">Configuration Summary</h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between py-2 border-b">
                                    <span className="text-muted-foreground">Method:</span>
                                    <span className="font-medium">{method}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b">
                                    <span className="text-muted-foreground">Authentication:</span>
                                    <span className="font-medium capitalize">{authType.replace('-', ' ')}</span>
                                </div>
                                {method === 'GET' && (
                                    <div className="flex justify-between py-2 border-b">
                                        <span className="text-muted-foreground">Search Parameter:</span>
                                        <span className="font-medium">{searchParam}</span>
                                    </div>
                                )}
                                {method === 'POST' && bodyTemplate && (
                                    <div className="py-2 border-b">
                                        <span className="text-muted-foreground block mb-2">Body Template:</span>
                                        <pre className="bg-muted p-2 rounded text-xs overflow-auto">{bodyTemplate}</pre>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer buttons */}
                <div className="flex justify-between mt-6">
                    <Button
                        variant="outline"
                        onClick={handleBack}
                        disabled={step === 1}
                    >
                        <ChevronLeft className="w-4 h-4 mr-2" />
                        Back
                    </Button>

                    {step < steps.length ? (
                        <Button onClick={handleNext}>
                            Next
                            <ChevronRight className="w-4 h-4 ml-2" />
                        </Button>
                    ) : (
                        <Button onClick={handleComplete}>
                            Complete Setup
                        </Button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
