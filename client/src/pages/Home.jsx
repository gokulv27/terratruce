import React from 'react';
import Navbar from '../components/Navbar';
import { Link } from 'react-router-dom';
import { Shield, TrendingUp, MapPin, Sparkles, ArrowRight } from 'lucide-react';

const Home = () => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
            <Navbar />

            {/* Hero Section */}
            <div className="relative isolate px-6 pt-14 lg:px-8">
                <div className="mx-auto max-w-4xl py-20 sm:py-32 lg:py-40">
                    {/* Badge */}
                    <div className="flex justify-center mb-8 animate-fade-in">
                        <div className="relative rounded-full px-4 py-1.5 text-sm leading-6 text-gray-600 ring-1 ring-gray-900/10 hover:ring-gray-900/20 bg-white/80 backdrop-blur-sm shadow-sm">
                            <span className="flex items-center gap-2">
                                <Sparkles className="h-4 w-4 text-primary" />
                                AI-Powered Property Intelligence
                            </span>
                        </div>
                    </div>

                    {/* Main Heading */}
                    <div className="text-center animate-slide-up">
                        <h1 className="text-5xl font-bold tracking-tight text-slate-900 sm:text-7xl mb-6 bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900">
                            Know the Risk Before You Buy or Rent
                        </h1>
                        <p className="mt-6 text-xl leading-8 text-gray-600 max-w-2xl mx-auto">
                            Get instant AI-powered insights on flood risk, crime rates, air quality, neighborhood trends, and future growth potential.
                        </p>
                    </div>

                    {/* CTA Buttons */}
                    <div className="mt-12 flex items-center justify-center gap-x-6 animate-fade-in-delay">
                        <Link
                            to="/analyze"
                            className="group relative rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-4 text-base font-semibold text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 flex items-center gap-2"
                        >
                            Analyze Property
                            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <a
                            href="#features"
                            className="text-base font-semibold leading-6 text-gray-900 hover:text-primary transition-colors"
                        >
                            Learn more <span aria-hidden="true">→</span>
                        </a>
                    </div>

                    {/* Feature Cards */}
                    <div id="features" className="mt-24 grid grid-cols-1 gap-6 sm:grid-cols-3 animate-fade-in-delay-2">
                        <FeatureCard
                            icon={Shield}
                            title="Risk Assessment"
                            description="Comprehensive analysis of flood, crime, and environmental risks"
                            color="blue"
                        />
                        <FeatureCard
                            icon={TrendingUp}
                            title="Market Trends"
                            description="AI predictions on property value growth and market direction"
                            color="green"
                        />
                        <FeatureCard
                            icon={MapPin}
                            title="Location Intel"
                            description="Real-time data on amenities, transport, and neighborhood quality"
                            color="purple"
                        />
                    </div>
                </div>

                {/* Animated Background Blobs */}
                <div className="absolute inset-x-0 top-0 -z-10 transform-gpu overflow-hidden blur-3xl" aria-hidden="true">
                    <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-blue-400 to-indigo-400 opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem] animate-blob"
                        style={{ clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)' }}>
                    </div>
                </div>
                <div className="absolute inset-x-0 top-[10rem] -z-10 transform-gpu overflow-hidden blur-3xl" aria-hidden="true">
                    <div className="relative left-[calc(50%+11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[60deg] bg-gradient-to-tr from-purple-400 to-pink-400 opacity-20 sm:left-[calc(50%+30rem)] sm:w-[72.1875rem] animate-blob animation-delay-2000"
                        style={{ clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)' }}>
                    </div>
                </div>
            </div>
        </div>
    );
};

const FeatureCard = ({ icon: Icon, title, description, color }) => {
    const colorClasses = {
        blue: 'from-blue-500 to-blue-600',
        green: 'from-green-500 to-emerald-600',
        purple: 'from-purple-500 to-indigo-600'
    };

    return (
        <div className="group relative bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100">
            <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${colorClasses[color]} mb-4 group-hover:scale-110 transition-transform`}>
                <Icon className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
            <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
        </div>
    );
};

export default Home;
