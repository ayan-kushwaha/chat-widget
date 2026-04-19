/**
 * Training Page - Full-width multi-step training wizard
 * No left sidebar, only main training flow
 */

'use client';

import { TrainingWizard } from '@/components/workforce/TrainingWizard';

export default function TrainingPage({ params }: { params: { agentId: string } }) {
    // Extract agent details from ID (e.g., "rocky_sales" -> name: Rocky, role: Sales)
    const agentName = params.agentId.split('_')[0].charAt(0).toUpperCase() + params.agentId.split('_')[0].slice(1);
    const agentRole = params.agentId.split('_')[1]?.toUpperCase() || 'EMPLOYEE';

    return (
        <TrainingWizard
            agentId={params.agentId}
            agentName={agentName}
            agentRole={agentRole}
        />
    );
}
