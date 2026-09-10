import { useState, useEffect } from 'react';
import { supabase } from '@/services/supabase';

export interface ReportMetrics {
  totalTickets: number;
  resolvedTickets: number;
  avgResolutionTime: string; // e.g. "2h 15m"
  slaCompliance: number; // percentage
  statusCounts: Record<string, number>;
  categoryCounts: Record<string, number>;
  topAgents: any[];
}

const DEFAULT_METRICS: ReportMetrics = {
  totalTickets: 0,
  resolvedTickets: 0,
  avgResolutionTime: '0h 0m',
  slaCompliance: 100,
  statusCounts: {
    Open: 0,
    'In Progress': 0,
    Pending: 0,
    Resolved: 0,
    Closed: 0
  },
  categoryCounts: {
    Hardware: 0,
    Software: 0,
    Network: 0,
    'Account & Access': 0,
    Other: 0
  },
  topAgents: []
};

export function useReports() {
  const [metrics, setMetrics] = useState<ReportMetrics>(DEFAULT_METRICS);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    try {
      setLoading(true);
      
      const { data: tickets, error: ticketsError } = await supabase
        .from('tickets')
        .select(`
          *,
          assignee:users!tickets_assignee_id_fkey(id, full_name)
        `);

      if (ticketsError) throw ticketsError;

      if (!tickets) return;

      const newMetrics = { ...DEFAULT_METRICS };
      newMetrics.totalTickets = tickets.length;
      newMetrics.statusCounts = { Open: 0, 'In Progress': 0, Pending: 0, Resolved: 0, Closed: 0 };
      newMetrics.categoryCounts = { Hardware: 0, Software: 0, Network: 0, 'Account & Access': 0, Other: 0 };

      let totalResolutionMinutes = 0;
      let ticketsWithResolution = 0;
      let slaMet = 0; // Assuming SLA is 24 hours (1440 mins)
      
      const agentStats: Record<string, any> = {};

      tickets.forEach((t: any) => {
        // Status counts
        if (newMetrics.statusCounts[t.ticket_status] !== undefined) {
          newMetrics.statusCounts[t.ticket_status]++;
        }

        // Category counts
        if (newMetrics.categoryCounts[t.issue_category] !== undefined) {
          newMetrics.categoryCounts[t.issue_category]++;
        } else {
          newMetrics.categoryCounts.Other++;
        }

        // Resolved and SLA
        if (t.ticket_status === 'Resolved' || t.ticket_status === 'Closed') {
          newMetrics.resolvedTickets++;
          
          if (t.resolution_duration_minutes) {
            totalResolutionMinutes += t.resolution_duration_minutes;
            ticketsWithResolution++;
            if (t.resolution_duration_minutes <= 1440) slaMet++;
          }

          // Agent stats
          if (t.assignee_id && t.assignee) {
            if (!agentStats[t.assignee_id]) {
              agentStats[t.assignee_id] = {
                name: t.assignee.full_name,
                resolved: 0,
                totalMinutes: 0,
                slaMet: 0,
                avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${t.assignee.full_name.replace(' ', '')}`
              };
            }
            agentStats[t.assignee_id].resolved++;
            agentStats[t.assignee_id].totalMinutes += (t.resolution_duration_minutes || 0);
            if ((t.resolution_duration_minutes || 0) <= 1440) {
              agentStats[t.assignee_id].slaMet++;
            }
          }
        }
      });

      // Calc averages
      if (ticketsWithResolution > 0) {
        const avg = totalResolutionMinutes / ticketsWithResolution;
        const h = Math.floor(avg / 60);
        const m = Math.round(avg % 60);
        newMetrics.avgResolutionTime = `${h}h ${m}m`;
        newMetrics.slaCompliance = Math.round((slaMet / ticketsWithResolution) * 100);
      } else {
        newMetrics.avgResolutionTime = '-';
        newMetrics.slaCompliance = 100;
      }

      // Top agents
      const agentList = Object.values(agentStats).map(a => {
        const avgMins = a.resolved > 0 ? a.totalMinutes / a.resolved : 0;
        const h = Math.floor(avgMins / 60);
        const m = Math.round(avgMins % 60);
        const sla = a.resolved > 0 ? Math.round((a.slaMet / a.resolved) * 100) : 100;
        
        return {
          name: a.name,
          resolved: a.resolved,
          avgResp: '-', // Fake for now as no db field
          avgRes: `${h}h ${m}m`,
          sla: sla,
          avatar: a.avatar
        };
      });

      // Sort by resolved desc
      agentList.sort((a, b) => b.resolved - a.resolved);
      newMetrics.topAgents = agentList.slice(0, 5); // top 5

      setMetrics(newMetrics);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();

    // Subscribe to realtime ticket changes to update reports live
    const channel = supabase
      .channel('reports_ticket_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets' }, () => {
        fetchReports();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    metrics,
    loading
  };
}
