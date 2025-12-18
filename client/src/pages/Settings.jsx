import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings, MapPin, Moon, Sun, Shield, Save, RotateCcw, Monitor } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const SettingsPage = () => {
    const { theme, toggleTheme } = useTheme();
    const [preferences, setPreferences] = useState({
        defaultLocation: 'New York, NY',
        riskTolerance: 'medium', // low, medium, high
        showExperimentalFeatures: false,
        autoExpandDetails: true
    });

    const [saved, setSaved] = useState(false);

    useEffect(() => {
        const savedPrefs = localStorage.getItem('terra-truce-prefs');
        if (savedPrefs) {
            setPreferences(JSON.parse(savedPrefs));
        }
    }, []);

    const handleChange = (key, value) => {
        setPreferences(prev => ({ ...prev, [key]: value }));
        setSaved(false);
    };

    const handleSave = () => {
        localStorage.setItem('terra-truce-prefs', JSON.stringify(preferences));
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const handleReset = () => {
        const defaults = {
            defaultLocation: 'New York, NY',
            riskTolerance: 'medium',
            showExperimentalFeatures: false,
            autoExpandDetails: true
        };
        setPreferences(defaults);
        localStorage.setItem('terra-truce-prefs', JSON.stringify(defaults));
    };

    return (
        <div className="max-w-4xl mx-auto p-6 pb-20">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-surface border border-border rounded-3xl p-8 shadow-xl"
            >
                <div className="flex items-center gap-4 mb-8 pb-6 border-b border-border">
                    <div className="p-3 bg-brand-primary/10 rounded-xl">
                        <Settings className="h-8 w-8 text-brand-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-text-primary">System Configuration</h1>
                        <p className="text-text-secondary">Customize your analysis experience and defaults.</p>
                    </div>
                </div>

                <div className="grid gap-8">
                    {/* Appearance Section */}
                    <section>
                        <h2 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
                            <Monitor className="h-5 w-5 text-brand-secondary" />
                            Appearance
                        </h2>
                        <div className="bg-surface-elevated/50 p-6 rounded-2xl border border-border">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-semibold text-text-primary">Interface Theme</h3>
                                    <p className="text-sm text-text-secondary">Switch between Light and Dark mode.</p>
                                </div>
                                <button
                                    onClick={toggleTheme}
                                    className="px-4 py-2 bg-surface border border-border rounded-lg flex items-center gap-2 hover:bg-surface-elevated transition-colors"
                                >
                                    {theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                                    <span className="text-sm font-medium capitalize">{theme} Mode</span>
                                </button>
                            </div>
                        </div>
                    </section>

                    {/* Analysis Defaults */}
                    <section>
                        <h2 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
                            <MapPin className="h-5 w-5 text-brand-secondary" />
                            Analysis Defaults
                        </h2>
                        <div className="bg-surface-elevated/50 p-6 rounded-2xl border border-border grid gap-6">
                            <div className="grid gap-2">
                                <label className="font-semibold text-text-primary">Default City / Region</label>
                                <p className="text-sm text-text-secondary mb-2">The starting location for the map validation.</p>
                                <input
                                    type="text"
                                    value={preferences.defaultLocation}
                                    onChange={(e) => handleChange('defaultLocation', e.target.value)}
                                    className="w-full p-3 bg-surface border border-border rounded-xl focus:ring-2 focus:ring-brand-primary/50 text-text-primary outline-none"
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <label className="font-semibold text-text-primary">Auto-Expand Details</label>
                                    <p className="text-sm text-text-secondary">Automatically open detailed risk dropdowns upon analysis.</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={preferences.autoExpandDetails}
                                        onChange={(e) => handleChange('autoExpandDetails', e.target.checked)}
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-primary/30 dark:peer-focus:ring-brand-primary/80 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-brand-primary"></div>
                                </label>
                            </div>
                        </div>
                    </section>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-4 pt-6 mt-6 border-t border-border">
                        <button
                            onClick={handleReset}
                            className="px-6 py-3 text-text-secondary hover:text-red-500 font-medium flex items-center gap-2 transition-colors"
                        >
                            <RotateCcw className="h-4 w-4" />
                            Reset Defaults
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-8 py-3 bg-gradient-to-r from-brand-primary to-brand-secondary text-white rounded-xl font-bold hover:shadow-lg hover:scale-105 transition-all flex items-center gap-2"
                        >
                            <Save className="h-4 w-4" />
                            {saved ? 'Settings Saved!' : 'Save Configuration'}
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default SettingsPage;
