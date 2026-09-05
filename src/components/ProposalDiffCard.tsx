import React, { useState } from 'react';
import { ExtractedProposal, ExtractedShiftRow, ExtractedTaskRow } from '../types';
import { 
  Sparkles, 
  Calendar, 
  Clock, 
  ArrowRight, 
  Check, 
  AlertTriangle, 
  CheckCircle2, 
  Edit3, 
  X,
  Plus
} from 'lucide-react';

interface ProposalDiffCardProps {
  proposal: ExtractedProposal;
  onApplyShifts: (proposalId: string, shifts: ExtractedShiftRow[]) => void;
  onApplyTasks: (proposalId: string, tasks: ExtractedTaskRow[], projectId?: string) => void;
  onApplyDeadline?: (deadlineStr: string, projectTitle: string) => void;
  onUndoProposal?: (proposalId: string) => void;
}

export const ProposalDiffCard: React.FC<ProposalDiffCardProps> = ({
  proposal,
  onApplyShifts,
  onApplyTasks,
  onApplyDeadline,
  onUndoProposal,
}) => {
  const [shifts, setShifts] = useState<ExtractedShiftRow[]>(proposal.shifts || []);
  const [tasks, setTasks] = useState<ExtractedTaskRow[]>(proposal.tasks || []);
  const [applied, setApplied] = useState(false);
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [editStartTime, setEditStartTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');

  // Toggle shift confirmation
  const handleToggleConfirmShift = (shiftId: string) => {
    setShifts((prev) =>
      prev.map((s) => (s.id === shiftId ? { ...s, confirmed: !s.confirmed } : s))
    );
  };

  // Edit shift start/end
  const handleStartEditShift = (row: ExtractedShiftRow) => {
    setEditingRowId(row.id);
    setEditStartTime(row.startTime);
    setEditEndTime(row.endTime);
  };

  const handleSaveEditShift = (rowId: string) => {
    setShifts((prev) =>
      prev.map((s) => {
        if (s.id === rowId) {
          return {
            ...s,
            startTime: editStartTime,
            endTime: editEndTime,
            confirmed: true,
            isLowConfidence: false,
          };
        }
        return s;
      })
    );
    setEditingRowId(null);
  };

  // Toggle task accept/reject
  const handleToggleTask = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, accepted: !t.accepted } : t))
    );
  };

  // Check if any low confidence shifts remain unconfirmed
  const unconfirmedLowConfidence = shifts.some((s) => s.isLowConfidence && !s.confirmed);

  if (applied) {
    return (
      <div className="p-4 rounded-2xl border border-black/[0.04] bg-slate-50/80 text-xs space-y-2 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 font-semibold text-[#1A1D23]">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Changes applied to {proposal.type === 'shift_schedule' ? 'Calendar' : 'Project Board'}</span>
          </span>
          {onUndoProposal && (
            <button
              onClick={() => {
                setApplied(false);
                onUndoProposal(proposal.id);
              }}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 underline cursor-pointer"
            >
              Undo Import
            </button>
          )}
        </div>
        <p className="text-[#6B7280] text-xs">
          {proposal.type === 'shift_schedule'
            ? `${shifts.length} shifts confirmed and synced to your schedule.`
            : `${tasks.filter((t) => t.accepted).length} tasks added with estimated durations.`}
        </p>
      </div>
    );
  }

  // 1. Shift Schedule Photo Proposal
  if (proposal.type === 'shift_schedule' && shifts.length > 0) {
    return (
      <div className="p-4 rounded-2xl border border-black/[0.04] bg-white space-y-3.5 text-xs shadow-[0_2px_8px_rgba(30,35,50,0.06),0_1px_2px_rgba(30,35,50,0.04)]">
        {/* Extraction Summary Line */}
        <div className="flex items-start justify-between gap-2 border-b border-black/[0.04] pb-2.5">
          <div className="space-y-0.5">
            <span className="text-[11px] uppercase font-semibold text-[#9CA3AF] tracking-[0.04em] flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Extraction Proposal</span>
            </span>
            <h4 className="font-bold text-[#1A1D23] text-sm">
              {proposal.summary}
            </h4>
          </div>
          <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200/50 shrink-0 font-semibold">
            Requires Approval
          </span>
        </div>

        <p className="text-xs text-[#6B7280] leading-relaxed">
          Review extracted shifts, computed door-to-door cost, and daily freelance capacity below. Low-confidence rows must be confirmed before applying.
        </p>

        {/* Shifts Table */}
        <div className="border border-black/[0.04] rounded-xl overflow-hidden bg-white shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/70 text-[#6B7280] font-semibold border-b border-black/[0.04]">
                  <th className="p-2.5">Date</th>
                  <th className="p-2.5">Shift Times</th>
                  <th className="p-2.5">Door-to-Door Cost</th>
                  <th className="p-2.5">Available Window</th>
                  <th className="p-2.5 text-right">Confirm</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.04] bg-white">
                {shifts.map((row) => {
                  const isEditing = editingRowId === row.id;
                  return (
                    <tr 
                      key={row.id}
                      className={`hover:bg-slate-50/50 transition-colors ${
                        row.isLowConfidence && !row.confirmed
                          ? 'bg-amber-50/30'
                          : row.confirmed
                          ? 'bg-emerald-50/20'
                          : ''
                      }`}
                    >
                      {/* Date */}
                      <td className="p-2.5 font-medium text-[#1A1D23] whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span>{row.date}</span>
                          {row.isLowConfidence && !row.confirmed && (
                            <span 
                              className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-semibold flex items-center gap-0.5"
                              title="Detected from handwritten/partially cropped photo — please verify"
                            >
                              <AlertTriangle className="w-2.5 h-2.5" />
                              <span>Verify</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Times (Inline edit mode supported) */}
                      <td className="p-2.5 whitespace-nowrap">
                        {isEditing ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              value={editStartTime}
                              onChange={(e) => setEditStartTime(e.target.value)}
                              className="w-16 px-1.5 py-0.5 border border-blue-600 rounded text-xs"
                            />
                            <span>—</span>
                            <input
                              type="text"
                              value={editEndTime}
                              onChange={(e) => setEditEndTime(e.target.value)}
                              className="w-16 px-1.5 py-0.5 border border-blue-600 rounded text-xs"
                            />
                            <button
                              onClick={() => handleSaveEditShift(row.id)}
                              className="p-1 text-emerald-600 hover:text-emerald-700"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingRowId(null)}
                              className="p-1 text-slate-400 hover:text-slate-600"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono tabular-nums text-[#1A1D23] font-medium">
                              {row.startTime} — {row.endTime}
                            </span>
                            <button
                              onClick={() => handleStartEditShift(row)}
                              className="opacity-60 hover:opacity-100 text-[#6B7280] p-0.5"
                              title="Edit times"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Door-to-Door Cost */}
                      <td className="p-2.5 whitespace-nowrap">
                        <span className="font-mono tabular-nums text-[#6B7280]">
                          {row.doorToDoorFormatted}
                        </span>
                      </td>

                      {/* Available Window Remaining */}
                      <td className="p-2.5 whitespace-nowrap">
                        <div className="space-y-0.5">
                          <span className="font-mono tabular-nums text-[#1A1D23] font-semibold">
                            {row.availableWindowFormatted}
                          </span>
                          {row.conflictWarning && (
                            <div className="flex items-center gap-1 text-[11px] text-red-600 font-semibold">
                              <AlertTriangle className="w-3 h-3 shrink-0" />
                              <span>{row.conflictWarning}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Verification / Low Confidence Action */}
                      <td className="p-2.5 text-right whitespace-nowrap">
                        {row.isLowConfidence ? (
                          <button
                            onClick={() => handleToggleConfirmShift(row.id)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer inline-flex items-center gap-1 active:scale-[0.98] ${
                              row.confirmed
                                ? 'bg-slate-100 text-[#1A1D23] border border-black/[0.04]'
                                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-2xs'
                            }`}
                          >
                            {row.confirmed ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-600" />
                                <span>Confirmed</span>
                              </>
                            ) : (
                              <span>Confirm Row</span>
                            )}
                          </button>
                        ) : (
                          <span className="text-emerald-700 font-semibold text-xs inline-flex items-center gap-0.5">
                            <Check className="w-3.5 h-3.5" />
                            <span>OK</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Confidence Guidance Notice if unconfirmed */}
        {unconfirmedLowConfidence && (
          <div className="flex items-center gap-2 p-3 rounded-xl border border-amber-200 bg-amber-50/50 text-amber-900 text-xs">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
            <span>
              <strong>Low-confidence row detected.</strong> Please inspect the time and click &quot;Confirm Row&quot; before adding to the calendar.
            </span>
          </div>
        )}

        {/* Apply Button */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-[#6B7280]">
            Computed buffers: +45m commute &amp; lunch
          </span>
          
          <button
            onClick={() => {
              if (unconfirmedLowConfidence) {
                return;
              }
              setApplied(true);
              onApplyShifts(proposal.id, shifts);
            }}
            disabled={unconfirmedLowConfidence}
            className={`flex items-center gap-1.5 px-4 py-2 min-h-[44px] rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer active:scale-[0.98] ${
              unconfirmedLowConfidence
                ? 'bg-slate-100 text-slate-400 border border-black/[0.04] cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-[0_2px_8px_rgba(37,99,235,0.25)]'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Add {shifts.length} shifts to Calendar</span>
          </button>
        </div>
      </div>
    );
  }

  // 2. Client Brief Proposal
  if (proposal.type === 'client_brief' && tasks.length > 0) {
    const acceptedCount = tasks.filter((t) => t.accepted).length;

    return (
      <div className="p-4 rounded-2xl border border-black/[0.04] bg-white space-y-3.5 text-xs shadow-[0_2px_8px_rgba(30,35,50,0.06),0_1px_2px_rgba(30,35,50,0.04)]">
        {/* Extraction Summary Line */}
        <div className="flex items-start justify-between gap-2 border-b border-black/[0.04] pb-2.5">
          <div className="space-y-0.5">
            <span className="text-[11px] uppercase font-semibold text-[#9CA3AF] tracking-[0.04em] flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Project Deliverables Proposal</span>
            </span>
            <h4 className="font-bold text-[#1A1D23] text-sm">
              {proposal.summary}
            </h4>
          </div>
          <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-100 text-[#1A1D23] border border-black/[0.04] shrink-0 font-semibold">
            {proposal.projectName?.split('—')[0].trim() || 'Project'}
          </span>
        </div>

        <p className="text-xs text-[#6B7280] leading-relaxed">
          The following task deliverables with estimates were identified. Accept or reject rows before writing to the board:
        </p>

        {/* Task List Table */}
        <div className="space-y-2">
          {tasks.map((t) => (
            <div
              key={t.id}
              className={`p-3 min-h-[44px] rounded-xl border transition-all duration-200 flex items-center justify-between gap-2 ${
                t.accepted
                  ? 'bg-slate-50/60 border-black/[0.04] text-[#1A1D23] shadow-2xs'
                  : 'bg-slate-100/30 border-dashed border-slate-200 text-slate-400 opacity-60'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <input
                  type="checkbox"
                  checked={t.accepted}
                  onChange={() => handleToggleTask(t.id)}
                  className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                />
                <div className="truncate flex-1">
                  <span className={`font-semibold block truncate ${t.accepted ? 'text-[#1A1D23]' : 'line-through text-slate-400'}`}>
                    {t.title}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="font-mono tabular-nums text-xs font-semibold px-2 py-0.5 rounded-md bg-white border border-black/[0.04] text-[#1A1D23]">
                  {t.estimate}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-[#6B7280]">
            <strong className="font-mono tabular-nums text-[#1A1D23]">{acceptedCount}</strong> of {tasks.length} deliverables accepted
          </span>

          <button
            onClick={() => {
              setApplied(true);
              onApplyTasks(proposal.id, tasks, proposal.projectId);
            }}
            disabled={acceptedCount === 0}
            className="flex items-center gap-1.5 px-4 py-2 min-h-[44px] rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-30 text-white text-xs font-semibold transition-all duration-200 cursor-pointer shadow-[0_2px_8px_rgba(37,99,235,0.25)] active:scale-[0.98]"
          >
            <span>Add {acceptedCount} tasks to Board</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  // 3. Contract or Invoice Proposal
  if (proposal.type === 'contract_invoice' && proposal.deadlineWarning) {
    const d = proposal.deadlineWarning;
    return (
      <div className="p-4 rounded-2xl border border-black/[0.04] bg-white space-y-3.5 text-xs shadow-[0_2px_8px_rgba(30,35,50,0.06),0_1px_2px_rgba(30,35,50,0.04)]">
        <div className="flex items-start justify-between gap-2 border-b border-black/[0.04] pb-2">
          <div className="space-y-0.5">
            <span className="text-[11px] uppercase font-semibold text-[#9CA3AF] tracking-[0.04em] flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Contract Deadline Detected</span>
            </span>
            <h4 className="font-bold text-[#1A1D23] text-sm">
              {proposal.summary}
            </h4>
          </div>
          <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-100 text-[#1A1D23] border border-black/[0.04]">
            {proposal.projectName?.split('—')[0].trim() || 'Contract'}
          </span>
        </div>

        <div className="p-3 rounded-xl border border-black/[0.04] bg-slate-50/70 space-y-1 text-[#1A1D23]">
          <div className="flex items-center gap-1.5 font-semibold text-[#1A1D23]">
            <span className="text-xs uppercase tracking-[0.04em] text-[#6B7280]">Target Deadline:</span>
            <span>{d.date}</span>
          </div>
          <p className="text-xs text-[#6B7280]">
            {d.description}
          </p>
        </div>

        <div className="flex items-center justify-end">
          <button
            onClick={() => {
              setApplied(true);
              if (onApplyDeadline) onApplyDeadline(d.date, d.description);
            }}
            className="flex items-center gap-1.5 px-4 py-2 min-h-[44px] rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-all duration-200 cursor-pointer shadow-[0_2px_8px_rgba(37,99,235,0.25)] active:scale-[0.98]"
          >
            <Check className="w-3.5 h-3.5" />
            <span>{d.actionLabel}</span>
          </button>
        </div>
      </div>
    );
  }

  return null;
};
