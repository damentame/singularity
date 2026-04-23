
import React from 'react';
import AppLayout from '@/components/AppLayout';
import { AppProvider } from '@/contexts/AppContext';
import { EventProvider } from '@/contexts/EventContext';
import { EventAutoSaveProvider } from '@/components/EventAutoSaver';

const Index: React.FC = () => {
  return (
    <AppProvider>
      <EventProvider>
        <EventAutoSaveProvider>
          <AppLayout />
        </EventAutoSaveProvider>
      </EventProvider>
    </AppProvider>
  );
};

export default Index;
