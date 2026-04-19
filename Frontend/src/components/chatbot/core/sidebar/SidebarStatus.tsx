
import React from 'react';
import { StatusCircle } from '@/components/status';

interface SidebarStatusProps {
    showStatus: boolean;
    statuses?: any[];
    setIsCreatorOpen: (open: boolean) => void;
    handleStatusClick: (status: any, allStatuses: any[]) => void;
    handleStatusContextMenu: (e: React.MouseEvent, status: any) => void;
}

export const SidebarStatus: React.FC<SidebarStatusProps> = ({
    showStatus,
    statuses,
    setIsCreatorOpen,
    handleStatusClick,
    handleStatusContextMenu
}) => {
    return (
        <div
            className={`w-full mb-1 overflow-hidden transition-all duration-300 ease-in-out ${showStatus
                    ? 'max-h-[150px] opacity-100 mt-1'  // Dikh raha hai
                    : 'max-h-0 opacity-0 mt-0'          // Chhup gaya
                } `}
        >
            <div className="flex  items-center overflow-x-auto no-scrollbar p-1 gap-1 w-full pl-3">
                {/* + MY STATUS Circle */}
                <StatusCircle
                    type="add"
                    label="MY STATUS"
                    onClick={() => setIsCreatorOpen(true)}
                />

                {/* Real Statuses from API */}
                {statuses && statuses.map((status, idx) => (
                    <StatusCircle
                        key={status._id || idx}
                        type="status"
                        label={status.caption || status.userName || "Update"}
                        content={status.content}
                        statusType={status.type}
                        styling={status.styling}
                        hasUnviewed={true}
                        onClick={() => handleStatusClick(status, statuses)}
                        onContextMenu={(e) => handleStatusContextMenu(e, status)}
                    />
                ))}

                {/* Initial Onboarding Statuses if empty */}
                {(!statuses || statuses.length === 0) && (
                    <>
                        <StatusCircle
                            type="status"
                            label="ARYAN"
                            hasUnviewed={true}
                            onClick={() => { }}
                        />
                        <StatusCircle
                            type="status"
                            label="DIWALI"
                            content="https://images.unsplash.com/photo-1540331547168-8b63109225b7?w=100&h=100&fit=crop"
                            statusType="image"
                            hasUnviewed={false}
                            onClick={() => { }}
                        />
                    </>
                )}
            </div>
        </div>
    );
};
