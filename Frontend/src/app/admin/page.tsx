"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, DollarSign, ShoppingCart, Activity } from "lucide-react";

export default function AdminDashboard() {
    const stats = [
        {
            title: "Total Users",
            value: "1,234",
            change: "+12%",
            icon: Users,
            color: "text-blue-600"
        },
        {
            title: "Revenue (Monthly)",
            value: "₹45,678",
            change: "+8%",
            icon: DollarSign,
            color: "text-green-600"
        },
        {
            title: "Active Plans",
            value: "892",
            change: "+23%",
            icon: ShoppingCart,
            color: "text-purple-600"
        },
        {
            title: "Total Chats",
            value: "12,450",
            change: "+15%",
            icon: Activity,
            color: "text-orange-600"
        }
    ];

    return (
        <div className="p-8 space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
                <p className="text-muted-foreground mt-2">Manage your Cluaiz platform</p>
            </div>

            {/* Stats Grid - Same design as dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <Card key={stat.title}>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                    {stat.title}
                                </CardTitle>
                                <Icon className={`w-5 h-5 ${stat.color}`} />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stat.value}</div>
                                <p className="text-xs text-green-600 mt-1">
                                    {stat.change} from last month
                                </p>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Recent Activity */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between py-3 border-b">
                            <div>
                                <p className="font-medium">New user registration</p>
                                <p className="text-sm text-muted-foreground">user@example.com - Free Plan</p>
                            </div>
                            <span className="text-sm text-muted-foreground">2 min ago</span>
                        </div>
                        <div className="flex items-center justify-between py-3 border-b">
                            <div>
                                <p className="font-medium">Plan upgrade</p>
                                <p className="text-sm text-muted-foreground">user2@example.com - Premium Plan</p>
                            </div>
                            <span className="text-sm text-muted-foreground">1 hour ago</span>
                        </div>
                        <div className="flex items-center justify-between py-3">
                            <div>
                                <p className="font-medium">New blog post published</p>
                                <p className="text-sm text-muted-foreground">"Getting Started with AI"</p>
                            </div>
                            <span className="text-sm text-muted-foreground">3 hours ago</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
