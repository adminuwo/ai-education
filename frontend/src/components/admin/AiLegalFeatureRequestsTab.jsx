import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { orgApi, superAdminApi } from '@/lib/api';
import { toast } from 'sonner';
import {
  Scale,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Building2,
  User,
  Search,
  RefreshCw,
  MessageSquareQuote,
  Sparkles,
  ArrowUpDown,
  Check,
  X,
  PlayCircle
} from 'lucide-react';

export default function AiLegalFeatureRequestsTab({ currentOrg, isSuperAdmin = false, onRequestNew, refreshTrigger }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scope, setScope] = useState('org'); // 'org' | 'all'
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionDialog, setActionDialog] = useState({
    open: false,
    request: null,
    targetStatus: 'approved', // 'approved' | 'rejected' | 'in_progress'
    adminNotes: '',
    submitting: false,
  });

  const loadRequests = useCallback(async () => {
    setLoading(true);
    try {
      const orgId = currentOrg?.id || 'global';
      const effectiveScope = isSuperAdmin ? 'all' : scope;
      const res = await orgApi.getAiLegalFeatureRequests(orgId, { scope: effectiveScope });
      setRequests(res?.requests || []);
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to load AI-Legal feature requests.');
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [currentOrg?.id, isSuperAdmin, scope]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests, refreshTrigger]);

  const handleUpdateStatus = async () => {
    if (!actionDialog.request) return;
    setActionDialog((prev) => ({ ...prev, submitting: true }));

    try {
      await superAdminApi.updateAiLegalFeatureRequest(actionDialog.request.id, {
        status: actionDialog.targetStatus,
        adminNotes: actionDialog.adminNotes,
      });

      toast.success(
        `Feature request from "${actionDialog.request.organizationName}" has been marked as ${actionDialog.targetStatus.toUpperCase()}!`
      );
      setActionDialog({ open: false, request: null, targetStatus: 'approved', adminNotes: '', submitting: false });
      loadRequests();
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to update feature request status.');
      setActionDialog((prev) => ({ ...prev, submitting: false }));
    }
  };

  const filteredRequests = requests.filter((r) => {
    if (statusFilter !== 'ALL' && (r.status || 'pending').toLowerCase() !== statusFilter.toLowerCase()) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchFeature = (r.feature || '').toLowerCase().includes(q);
      const matchOrg = (r.organizationName || '').toLowerCase().includes(q);
      const matchUser = (r.userName || '').toLowerCase().includes(q) || (r.userEmail || '').toLowerCase().includes(q);
      if (!matchFeature && !matchOrg && !matchUser) return false;
    }
    return true;
  });

  const counts = {
    total: requests.length,
    pending: requests.filter((r) => (r.status || 'pending').toLowerCase() === 'pending').length,
    approved: requests.filter((r) => (r.status || '').toLowerCase() === 'approved').length,
    rejected: requests.filter((r) => (r.status || '').toLowerCase() === 'rejected').length,
    in_progress: requests.filter((r) => (r.status || '').toLowerCase() === 'in_progress').length,
  };

  const renderStatusBadge = (status) => {
    const s = (status || 'pending').toLowerCase();
    switch (s) {
      case 'approved':
        return (
          <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 gap-1 text-[11px] font-semibold py-0.5">
            <CheckCircle2 className="h-3 w-3" /> Approved
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 gap-1 text-[11px] font-semibold py-0.5">
            <XCircle className="h-3 w-3" /> Declined
          </Badge>
        );
      case 'in_progress':
        return (
          <Badge className="bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30 gap-1 text-[11px] font-semibold py-0.5">
            <PlayCircle className="h-3 w-3" /> In Progress
          </Badge>
        );
      default:
        return (
          <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 gap-1 text-[11px] font-semibold py-0.5">
            <Clock className="h-3 w-3" /> Pending Review
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="bg-card border-border shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Requests</p>
              <p className="text-2xl font-bold mt-0.5 text-foreground">{counts.total}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Scale className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-amber-500 uppercase tracking-wider">Pending Review</p>
              <p className="text-2xl font-bold mt-0.5 text-amber-500">{counts.pending}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-emerald-500 uppercase tracking-wider">Approved</p>
              <p className="text-2xl font-bold mt-0.5 text-emerald-500">{counts.approved}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-rose-500 uppercase tracking-wider">Declined</p>
              <p className="text-2xl font-bold mt-0.5 text-rose-500">{counts.rejected}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500">
              <XCircle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Container Card */}
      <Card className="border-border shadow-xs">
        <CardHeader className="pb-3 border-b border-border/60">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-base sm:text-lg font-semibold flex items-center gap-2">
                    AI-Legal™ Feature Requests Tracker
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">
                    {isSuperAdmin
                      ? 'Review, approve, and prioritize legal technology modules requested by educational institutions.'
                      : 'Track the live approval status of legal AI features and explore roadmap ideas submitted by other campuses.'}
                  </CardDescription>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <Button variant="outline" size="sm" onClick={loadRequests} disabled={loading} className="h-8 text-xs gap-1.5">
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>

              {onRequestNew && (
                <Button
                  size="sm"
                  onClick={onRequestNew}
                  className="h-8 text-xs gap-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-xs"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Request New Feature
                </Button>
              )}
            </div>
          </div>

          {/* Scope Toggle & Filter Controls */}
          <div className="pt-3 flex flex-col md:flex-row md:items-center justify-between gap-2.5">
            {/* Scope tabs for regular org admins */}
            {!isSuperAdmin && (
              <div className="inline-flex items-center bg-muted/60 p-1 rounded-lg border border-border text-xs shrink-0">
                <button
                  type="button"
                  onClick={() => setScope('org')}
                  className={`px-3 py-1 rounded-md font-medium transition-all ${
                    scope === 'org'
                      ? 'bg-background text-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  This Campus ({currentOrg?.name?.split(',')[0] || 'My Org'})
                </button>
                <button
                  type="button"
                  onClick={() => setScope('all')}
                  className={`px-3 py-1 rounded-md font-medium transition-all flex items-center gap-1.5 ${
                    scope === 'all'
                      ? 'bg-background text-purple-600 dark:text-purple-400 shadow-xs font-semibold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Building2 className="h-3 w-3" />
                  All Campuses (Community Roadmap)
                </button>
              </div>
            )}

            <div className="flex items-center gap-2 flex-1 md:justify-end">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search feature or campus..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-8 text-xs"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-8 w-36 text-xs shrink-0">
                  <SelectValue placeholder="Status Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="rejected">Declined</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading && requests.length === 0 ? (
            <div className="p-8 flex flex-col items-center justify-center text-center space-y-2">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
              <p className="text-xs text-muted-foreground animate-pulse">Loading feature requests from AI-Legal directory...</p>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                <Scale className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-foreground">No Feature Requests Found</h4>
                <p className="text-xs text-muted-foreground max-w-sm">
                  {statusFilter !== 'ALL' || searchQuery
                    ? 'No requests match your current filters.'
                    : 'No feature requests have been submitted yet. Submit your first legal feature idea above!'}
                </p>
              </div>
              {onRequestNew && (
                <Button size="sm" variant="outline" onClick={onRequestNew} className="text-xs mt-2 gap-1.5">
                  <Plus className="h-3.5 w-3.5" /> Submit First Request
                </Button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {filteredRequests.map((req) => {
                const isCurrentOrgReq = currentOrg && req.organizationSlug === currentOrg.slug;

                return (
                  <div
                    key={req.id}
                    className={`p-4 sm:p-5 transition-colors hover:bg-muted/20 flex flex-col md:flex-row md:items-start justify-between gap-4 ${
                      isCurrentOrgReq && scope === 'all' ? 'bg-purple-500/[0.03] border-l-2 border-purple-500' : ''
                    }`}
                  >
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-md bg-secondary text-secondary-foreground border border-border">
                          <Building2 className="h-3 w-3 text-muted-foreground" />
                          {req.organizationName || 'Educational Institution'}
                        </span>

                        {isCurrentOrgReq && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-purple-500/40 text-purple-600 dark:text-purple-400 font-bold">
                            Your Campus
                          </Badge>
                        )}

                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {req.createdAt ? new Date(req.createdAt).toLocaleDateString() : 'Recently'}
                        </span>

                        <div className="ml-auto md:ml-0">{renderStatusBadge(req.status)}</div>
                      </div>

                      <div className="text-sm text-foreground font-medium whitespace-pre-wrap leading-relaxed">
                        {req.feature}
                      </div>

                      {req.adminNotes && (
                        <div className="p-2.5 rounded-lg bg-muted/50 border border-border/60 text-xs flex items-start gap-2 text-muted-foreground">
                          <MessageSquareQuote className="h-4 w-4 text-purple-500 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-semibold text-foreground">Engineering / Admin Note: </span>
                            {req.adminNotes}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          Submitted by: <strong className="text-foreground">{req.userName || 'Faculty/Dean'}</strong>
                          {req.userEmail ? ` (${req.userEmail})` : ''}
                        </span>
                      </div>
                    </div>

                    {/* Action Controls for Super Admin */}
                    {isSuperAdmin && (
                      <div className="flex items-center gap-1.5 shrink-0 self-end md:self-start pt-2 md:pt-0">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            setActionDialog({
                              open: true,
                              request: req,
                              targetStatus: 'approved',
                              adminNotes: req.adminNotes || '',
                              submitting: false,
                            })
                          }
                          className="h-8 px-2.5 text-xs text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10 hover:text-emerald-500"
                          title="Approve Request"
                        >
                          <Check className="h-3.5 w-3.5 mr-1 text-emerald-500" />
                          Approve
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            setActionDialog({
                              open: true,
                              request: req,
                              targetStatus: 'rejected',
                              adminNotes: req.adminNotes || '',
                              submitting: false,
                            })
                          }
                          className="h-8 px-2.5 text-xs text-rose-600 border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-500"
                          title="Decline Request"
                        >
                          <X className="h-3.5 w-3.5 mr-1 text-rose-500" />
                          Decline
                        </Button>

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            setActionDialog({
                              open: true,
                              request: req,
                              targetStatus: 'in_progress',
                              adminNotes: req.adminNotes || '',
                              submitting: false,
                            })
                          }
                          className="h-8 px-2 text-xs text-blue-600 hover:bg-blue-500/10 hover:text-blue-500"
                          title="Mark In Progress"
                        >
                          <PlayCircle className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Super Admin Status Review Dialog */}
      <Dialog
        open={actionDialog.open}
        onOpenChange={(open) => !actionDialog.submitting && setActionDialog((prev) => ({ ...prev, open }))}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {actionDialog.targetStatus === 'approved' ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  Approve Feature Request
                </>
              ) : actionDialog.targetStatus === 'rejected' ? (
                <>
                  <XCircle className="h-5 w-5 text-rose-500" />
                  Decline Feature Request
                </>
              ) : (
                <>
                  <PlayCircle className="h-5 w-5 text-blue-500" />
                  Mark In Active Development
                </>
              )}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Update institutional feature status for <strong>{actionDialog.request?.organizationName}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="p-3 rounded-lg bg-muted/40 border border-border text-xs space-y-1">
              <span className="font-semibold text-foreground">Requested Feature:</span>
              <p className="text-muted-foreground whitespace-pre-wrap">{actionDialog.request?.feature}</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Engineering Notes / Feedback for Campus Admins (Optional)
              </label>
              <Textarea
                placeholder={
                  actionDialog.targetStatus === 'approved'
                    ? 'e.g. Scheduled for rollout in release v2.4. Moot court simulator models are in progress.'
                    : actionDialog.targetStatus === 'rejected'
                    ? 'e.g. Beyond the current academic scope or already achievable via Supreme Court Research tab.'
                    : 'e.g. Engineering team is currently testing this API integration.'
                }
                value={actionDialog.adminNotes}
                onChange={(e) => setActionDialog((prev) => ({ ...prev, adminNotes: e.target.value }))}
                className="text-xs min-h-[90px]"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActionDialog((prev) => ({ ...prev, open: false }))}
              disabled={actionDialog.submitting}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleUpdateStatus}
              disabled={actionDialog.submitting}
              className={
                actionDialog.targetStatus === 'approved'
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  : actionDialog.targetStatus === 'rejected'
                  ? 'bg-rose-600 hover:bg-rose-500 text-white'
                  : 'bg-blue-600 hover:bg-blue-500 text-white'
              }
            >
              {actionDialog.submitting ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Updating...
                </>
              ) : (
                `Confirm ${actionDialog.targetStatus.toUpperCase()}`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
