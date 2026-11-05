import React, { useState } from 'react';
import { Heart } from 'lucide-react';
import SupplierInvitationsList from './SupplierInvitationsList';
import SupplierInvitationDetail from './SupplierInvitationDetail';

const GOLD = '#C9A24A';

/** The supplier-role destination for the header's heart icon. Deliberately narrower than
 *  My Invitations (Provider Hub): "events I've worked on" means invitations the supplier
 *  actually accepted, not every invitation they've ever received - declined/withdrawn/
 *  unanswered ones belong in the main invitations list, not here. */
const SupplierMyEvents: React.FC = () => {
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAFAF7' }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6 flex items-center gap-2">
          <Heart className="w-4 h-4" style={{ color: GOLD }} />
          <h1 className="text-xl font-light" style={{ fontFamily: '"Playfair Display", Georgia, serif', color: '#1A1A1A' }}>
            My Events
          </h1>
        </div>

        {selectedBatchId
          ? <SupplierInvitationDetail batchId={selectedBatchId} onBack={() => setSelectedBatchId(null)} />
          : <SupplierInvitationsList onOpen={setSelectedBatchId} filterResponse="accepted" />}
      </div>
    </div>
  );
};

export default SupplierMyEvents;
