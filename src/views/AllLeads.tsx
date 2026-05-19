import React from 'react';
import { LeadsTable } from '../components/leads/LeadsTable';
import { Lead } from '../hooks/useLeads';

interface AllLeadsProps {
  leads: Lead[];
  loading: boolean;
  activePage: string;
  updateLeadStatus: (leadId: string, status: Lead['crm_status']) => void;
  onSelectLead: (lead: Lead) => void;
  onOpenPitch: (lead: Lead) => void;
  onOpenOutreachLog: (lead: Lead) => void;
}

export const AllLeads: React.FC<AllLeadsProps> = ({
  leads,
  loading,
  activePage,
  updateLeadStatus,
  onSelectLead,
  onOpenPitch,
  onOpenOutreachLog
}) => {
  return (
    <div className="space-y-6">
      <LeadsTable
        leads={leads}
        loading={loading}
        activePage={activePage}
        updateLeadStatus={updateLeadStatus}
        onSelectLead={onSelectLead}
        onOpenPitch={onOpenPitch}
        onOpenOutreachLog={onOpenOutreachLog}
      />
    </div>
  );
};
