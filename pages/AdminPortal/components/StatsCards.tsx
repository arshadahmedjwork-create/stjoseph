
import React from 'react';
import { UserGroupIcon, ClockIcon, CheckBadgeIcon, ExclamationIcon } from '../../../components/Icons';

interface StatsCardsProps {
    stats: {
        total: number;
        pending: number;
        approved: number;
        flagged: number;
    };
}

const Card: React.FC<{ title: string; value: number; icon: React.ReactNode; color: string }> = ({ title, value, icon, color }) => {
    const colorClasses: Record<string, string> = {
        blue: 'bg-blue-50 text-blue-600',
        yellow: 'bg-yellow-50 text-yellow-600',
        green: 'bg-green-50 text-green-600',
        red: 'bg-red-50 text-red-600',
    };

    return (
        <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-100 p-5">
            <div className="flex items-center">
                <div className={`flex-shrink-0 rounded-md p-3 ${colorClasses[color] || colorClasses.blue}`}>
                    {React.cloneElement(icon as React.ReactElement, { className: "h-6 w-6" })}
                </div>
                <div className="ml-5 w-0 flex-1">
                    <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
                        <dd>
                            <div className="text-lg font-bold text-gray-900">{value}</div>
                        </dd>
                    </dl>
                </div>
            </div>
        </div>
    );
};

const StatsCards: React.FC<StatsCardsProps> = ({ stats }) => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card title="Total Submissions" value={stats.total} icon={<UserGroupIcon />} color="blue" />
            <Card title="Pending Review" value={stats.pending} icon={<ClockIcon />} color="yellow" />
            <Card title="Approved" value={stats.approved} icon={<CheckBadgeIcon />} color="green" />
            <Card title="Flagged" value={stats.flagged} icon={<ExclamationIcon />} color="red" />
        </div>
    );
};

export default StatsCards;
