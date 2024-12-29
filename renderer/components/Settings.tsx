"use client"

import { useState, useEffect } from 'react';
import { Edit2, Save, Eye, EyeOff } from 'lucide-react';

export default function Settings() {
    const [apiKey, setApiKey] = useState<string>('');
    const [isEditing, setIsEditing] = useState(false);
    const [showKey, setShowKey] = useState(false);
    const [savedKey, setSavedKey] = useState<string | null>(null);
    const [isElectron, setIsElectron] = useState(true);

    useEffect(() => {
        // Debug logging
        console.log('Component mounted');
        console.log('Window object:', typeof window);
        console.log('Window keys:', Object.keys(window));
        console.log('Window electron:', window.electron);
        console.log('Window electron type:', typeof window.electron);
        console.log('Window electron keys:', window.electron ? Object.keys(window.electron) : 'No electron object');
        console.log('Is running in electron:', typeof window !== 'undefined' && window.electron);

        // Check if we're running in Electron
        if (typeof window !== 'undefined' && window.electron) {
            console.log('Setting isElectron to true');
            setIsElectron(true);
            // Load the API key on component mount
            console.log('Attempting to load API key...');
            window.electron.getApiKey().then((key) => {
                console.log('Loaded API key:', key);
                if (key) {
                    setSavedKey(key);
                    setApiKey(key);
                }
            }).catch(error => {
                console.error('Error loading API key:', error);
            });
        } else {
            console.log('Not running in electron environment');
            console.log('Window electron check failed:', {
                windowDefined: typeof window !== 'undefined',
                electronExists: !!window.electron
            });
            setIsElectron(false);

        }
    }, []);

    const handleSave = async () => {
        console.log('Save button clicked');
        console.log('isElectron state:', isElectron);
        if (!isElectron) {
            console.log('Not in electron environment, returning early');
            return;
        }
        console.log('Saving API key:', apiKey);
        try {
            const result = await window.electron.setApiKey(apiKey);
            console.log('Save result:', result);
            setSavedKey(apiKey);
            setIsEditing(false);
            setShowKey(false);
        } catch (error) {
            console.error('Error saving API key:', error);
        }
    };

    const handleEdit = () => {
        console.log('Edit button clicked');
        setIsEditing(true);
        setShowKey(true);
    };

    const handleCancel = () => {
        setApiKey(savedKey || '');
        setIsEditing(false);
        setShowKey(false);
    };

    const displayKey = (key: string) => {
        if (!key) return '';
        if (!showKey) {
            return `${key.slice(0, 5)}${'*'.repeat(20)}${key.slice(-5)}`;
        }
        return key;
    };
    if (!isElectron) {
        return (
            <div className="p-8">
                <div className="max-w-2xl">
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <p className="text-red-500">
                            This feature is only available in the desktop app.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-8">Settings</h1>

            <div className="max-w-2xl">
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-lg font-semibold mb-4">OpenAI API Key</h2>

                    <div className="space-y-4">
                        <div className="flex items-center space-x-4">
                            <input
                                type={showKey ? 'text' : 'password'}
                                value={isEditing ? apiKey : displayKey(savedKey || '')}
                                onChange={(e) => setApiKey(e.target.value)}
                                disabled={!isEditing}
                                className="flex-1 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                                placeholder="Enter your OpenAI API key"
                            />

                            {isEditing ? (
                                <>
                                    <button
                                        onClick={handleSave}
                                        className="p-2 text-white bg-primary-500 rounded-md hover:bg-primary-600 transition-colors"
                                        title="Save"
                                    >
                                        <Save className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={handleCancel}
                                        className="p-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                                        title="Cancel"
                                    >
                                        ✕
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={handleEdit}
                                    className="p-2 text-white bg-primary-500 rounded-md hover:bg-primary-600 transition-colors"
                                    title="Edit"
                                >
                                    <Edit2 className="w-5 h-5" />
                                </button>
                            )}

                            <button
                                onClick={() => setShowKey(!showKey)}
                                className="p-2 text-primary-500 border border-primary-500 rounded-md hover:bg-primary-50 transition-colors"
                                title={showKey ? "Hide API Key" : "Show API Key"}
                            >
                                {showKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>

                        <p className="text-sm text-gray-500">
                            Your API key is stored securely on your device and is never sent to our servers.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}