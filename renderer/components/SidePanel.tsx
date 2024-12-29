"use client"

import { useState } from 'react';
import { Home, Settings, ChevronLeft, ChevronRight } from 'lucide-react';

export default function SidePanel() {
    const [isOpen, setIsOpen] = useState(true);

    return (
        <div className={`h-screen relative transition-all duration-300 ${isOpen ? 'w-64' : 'w-16'}`}>
            <div className="absolute inset-y-0 left-0 w-full bg-white shadow-lg border-r border-primary-200">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="absolute -right-3 top-4 z-50 bg-primary-500 text-white rounded-full p-2 shadow-md hover:bg-primary-600 transition-colors"
                >
                    {isOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>

                <div className="flex flex-col h-full">
                    <div className="p-6 bg-primary-500 text-white">
                        <h2 className={`text-xl font-bold transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
                            Cereal
                        </h2>
                    </div>
                    <div className="flex-1 p-4">
                        <nav className="space-y-2">
                            <a
                                href="/"
                                className="flex items-center space-x-3 p-3 rounded-lg hover:bg-primary-50 text-primary-900 transition-colors"
                            >
                                <Home className="w-5 h-5 min-w-5" />
                                {isOpen && <span className="font-medium">Home</span>}
                            </a>
                        </nav>
                    </div>

                    <div className="p-4 border-t border-primary-100">
                        <a
                            href="/settings"
                            className="flex items-center space-x-3 p-3 rounded-lg hover:bg-primary-50 text-primary-900 transition-colors"
                        >
                            <Settings className="w-5 h-5 min-w-5" />
                            {isOpen && <span className="font-medium">Settings</span>}
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
} 