import React from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { useEventContext } from '@/contexts/EventContext';
import Header from './Header';
import Hero from './Hero';
import FeaturedSuppliers from './FeaturedSuppliers';
import CategoryShowcase from './CategoryShowcase';
import HowItWorks from './HowItWorks';
import Testimonials from './Testimonials';
import Newsletter from './Newsletter';
import Footer from './Footer';
import AuthModal from './AuthModal';
import QuoteModal from './QuoteModal';
import BrowseSuppliers from './BrowseSuppliers';
import SupplierProfile from './SupplierProfile';
import Dashboard from './Dashboard';
import GuestList from './GuestList';
import SeatingChart from './SeatingChart';
import PlanningChecklist from './PlanningChecklist';
import BudgetTracker from './BudgetTracker';
import MessagesCenter from './MessagesCenter';
import WeatherForecast from './WeatherForecast';
import Accommodation from './Accommodation';
import VoiceAssistant from './VoiceAssistant';
import ChatAssistant from './ChatAssistant';
import SupplierMediaUpload from './SupplierMediaUpload';
import EventPlanningWizard from './EventPlanningWizard';
import SupplierWorkbook from './SupplierWorkbook';
import RoleBanner from './RoleBanner';
import SupplierDetailsPanel from './SupplierDetailsPanel';
import MoodBoardBuilder from './MoodBoardBuilder';
import ServiceProviderWizard from './ServiceProviderWizard';
import ServiceProviderDashboard from './ServiceProviderDashboard';
import SearchProviders from './SearchProviders';
import PlannerDashboard from './PlannerDashboard';
import EventDetail from './EventDetail';
import ProposalView from './ProposalView';
import UserProfile from './UserProfile';
import ResetPasswordForm from './ResetPasswordForm';
import { toast } from '@/components/ui/use-toast';


const AppLayout: React.FC = () => {
  const { currentView, isLoading, user, selectedSupplierId, setCurrentView, isAuthenticated, isPasswordRecovery } = useAppContext();
  const { selectedEventId, selectedEvent, selectEvent } = useEventContext();

  // Auto-routing is now handled centrally in AppContext on session restore.
  // No need for sessionStorage hacks or useEffect auto-routing here.

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#FAFAF7' }}>
        <div className="text-center">
          <svg viewBox="0 0 100 100" className="w-16 h-16 mx-auto mb-4 animate-cinematic-orbit">
            <defs>
              <linearGradient id="loadingGold" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#D4AF5A" />
                <stop offset="50%" stopColor="#C9A24A" />
                <stop offset="100%" stopColor="#A8863A" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="42" fill="none" stroke="url(#loadingGold)" strokeWidth="2" />
            <circle cx="50" cy="50" r="26" fill="none" stroke="url(#loadingGold)" strokeWidth="1.5" />
          </svg>
          <p className="font-body text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // ─── PASSWORD RESET VIEW (full-screen, no header/footer) ───
  if (currentView === 'reset-password' || isPasswordRecovery) {
    return <ResetPasswordForm />;
  }

  const handleServiceProviderComplete = (data: any) => {
    console.log('Service Provider Registration Data:', data);
    toast({
      title: 'Registration Complete',
      description: 'Your service provider profile has been created successfully!',
    });
    setCurrentView('provider-dashboard');
  };

  const handleOpenEvent = (eventId: string) => {
    selectEvent(eventId);
    setCurrentView('coordinator-event');
  };

  // ─── COORDINATOR VIEWS (cream background, no old header/footer) ───

  if (currentView === 'coordinator-dashboard') {
    return (
      <>
        <PlannerDashboard onOpenEvent={handleOpenEvent} />
        <AuthModal />
      </>
    );
  }

  if (currentView === 'coordinator-event') {
    if (!selectedEventId) {
      setCurrentView('coordinator-dashboard');
      return null;
    }
    return (
      <>
        <EventDetail
          eventId={selectedEventId}
          onBack={() => setCurrentView('coordinator-dashboard')}
          onGenerateProposal={() => setCurrentView('coordinator-proposal')}
        />
        <AuthModal />
      </>
    );
  }

  if (currentView === 'coordinator-proposal') {
    if (!selectedEvent) {
      setCurrentView('coordinator-dashboard');
      return null;
    }
    return (
      <>
        <ProposalView
          event={selectedEvent}
          onBack={() => setCurrentView('coordinator-event')}
        />
        <AuthModal />
      </>
    );
  }

  // ─── CONTENT VIEWS ───

  const renderContent = () => {
    switch (currentView) {
      case 'profile':
        return <UserProfile />;
      case 'browse':
        return <BrowseSuppliers />;
      case 'search-providers':
        return <SearchProviders />;
      case 'supplier':
        return <SupplierProfile />;
      case 'dashboard':
        return <Dashboard />;
      case 'planner-dashboard':
        return <PlannerDashboard onOpenEvent={handleOpenEvent} />;
      case 'event-detail':
        if (!selectedEventId) {
          setCurrentView('planner-dashboard');
          return null;
        }
        return (
          <EventDetail
            eventId={selectedEventId}
            onBack={() => setCurrentView('planner-dashboard')}
            onGenerateProposal={() => setCurrentView('event-proposal')}
          />
        );
      case 'event-proposal':
        if (!selectedEvent) {
          setCurrentView('planner-dashboard');
          return null;
        }
        return (
          <ProposalView
            event={selectedEvent}
            onBack={() => setCurrentView('event-detail')}
          />
        );
      case 'guests':
        return <GuestList />;
      case 'seating':
        return <SeatingChart />;
      case 'checklist':
        return <PlanningChecklist />;
      case 'budget':
        return <BudgetTracker />;
      case 'messages':
        return <MessagesCenter />;
      case 'weather':
        return <WeatherForecast />;
      case 'accommodation':
        return <Accommodation />;
      case 'wizard':
        return <EventPlanningWizard />;
      case 'moodboard':
        return (
          <MoodBoardBuilder
            eventName="My Event"
            onClose={() => setCurrentView('home')}
          />
        );
      case 'workbook':
        return (
          <SupplierWorkbook
            eventId="EVT-2026-001"
            eventName="Sample Event"
            eventDate="2026-06-15"
            clientName="John Doe"
            clientEmail="john@example.com"
            supplierId="sup-001"
            supplierName="Sample Supplier"
            supplierCategory="Florals"
            country="South Africa"
            city="Cape Town"
            guestCount={150}
            onClose={() => setCurrentView('home')}
          />
        );
      case 'supplier-upload':
        return (
          <SupplierMediaUpload 
            supplierId={user?.id || 'demo-supplier'} 
            onClose={() => setCurrentView('home')}
          />
        );
      case 'provider-dashboard':
        return <ServiceProviderDashboard />;
      case 'supplier-details' as any:
        return (
          <div className="min-h-screen pt-24 pb-16" style={{ backgroundColor: '#0B1426' }}>
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              <SupplierDetailsPanel
                supplierId={selectedSupplierId || 'demo-supplier'}
                supplierName="Sample Supplier"
              />
            </div>
          </div>
        );

      case 'home':
      default:
        return (
          <>
            <Hero />
            <FeaturedSuppliers />
            <CategoryShowcase />
            <HowItWorks />
            <Testimonials />
            <Newsletter />
          </>
        );
    }
  };

  // Full-screen Service Provider Registration Wizard
  if (currentView === 'service-provider-registration') {
    return (
      <>
        <ServiceProviderWizard
          onClose={() => setCurrentView('home')}
          onComplete={handleServiceProviderComplete}
        />
        <AuthModal />
      </>
    );
  }

  // Full page questionnaire
  if (currentView === 'wizard') {
    return (
      <div className="min-h-screen bg-white">
        <div className="bg-gradient-to-r from-rose-500 to-purple-600 text-white py-4 px-6">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <h1 className="text-xl font-bold">Event Planning Questionnaire</h1>
            <button 
              onClick={() => setCurrentView('home')}
              className="text-white/80 hover:text-white transition-colors"
            >
              Back to Home
            </button>
          </div>
        </div>
        <EventPlanningWizard />
        <AuthModal />
      </div>
    );
  }

  // Full-screen mood board builder
  if (currentView === 'moodboard') {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#0B1426' }}>
        <Header />
        <MoodBoardBuilder
          eventName="My Event"
          onClose={() => setCurrentView('home')}
        />
        <AuthModal />
      </div>
    );
  }

  // Proposal view - minimal chrome for printing
  if (currentView === 'event-proposal') {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#0B1426' }}>
        {renderContent()}
        <AuthModal />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0B1426' }}>
      <Header />
      {/* Role Banner - shows when authenticated and not on home or profile */}
      {isAuthenticated && currentView !== 'home' && currentView !== 'profile' && <RoleBanner />}
      {renderContent()}
      {currentView !== 'profile' && <Footer />}
      {/* Single AuthModal instance for the entire app */}
      <AuthModal />
      <QuoteModal />
      <VoiceAssistant />
      <ChatAssistant />
    </div>
  );
};

export default AppLayout;
