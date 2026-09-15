import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { bugApi } from '@/lib/api';
import { toast } from 'sonner';
import {
  Bug,
  Upload,
  X,
  Loader2,
  Info,
} from 'lucide-react';

const CATEGORIES = [
  { value: 'UI_BUG', label: 'UI / Display Issue' },
  { value: 'CRASH', label: 'System Crash / Error Screen' },
  { value: 'AUTH', label: 'Authentication / Login' },
  { value: 'TIMETABLE', label: 'Timetable & Scheduling' },
  { value: 'EXAMS', label: 'Exams & Grading' },
  { value: 'FINANCE', label: 'Fees & Finance Sync' },
  { value: 'AI_LEGAL', label: 'AI Assistant & Copilot' },
  { value: 'OTHER', label: 'Other Issue' },
];

const SEVERITIES = [
  { value: 'LOW', label: 'Low — Cosmetic or minor issue', color: 'text-slate-400' },
  { value: 'MEDIUM', label: 'Medium — Functionality impaired, workaround exists', color: 'text-amber-400' },
  { value: 'HIGH', label: 'High — Important feature broken', color: 'text-orange-400' },
  { value: 'CRITICAL', label: 'Critical — Crash or system blocked', color: 'text-red-400' },
];

export default function BugReportModal({ open, onOpenChange, onSuccess, defaultOrgId, defaultOrgName }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('UI_BUG');
  const [severity, setSeverity] = useState('MEDIUM');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [includeDiagnostics, setIncludeDiagnostics] = useState(true);
  const fileInputRef = useRef(null);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setCategory('UI_BUG');
    setSeverity('MEDIUM');
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (PNG, JPG, WebP, GIF)');
      return;
    }

    // 10MB limit
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Screenshot file must be under 10MB');
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || title.trim().length < 3) {
      toast.error('Please provide a descriptive title (at least 3 characters)');
      return;
    }

    if (!description.trim() || description.trim().length < 5) {
      toast.error('Please describe what happened or steps to reproduce (at least 5 characters)');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('category', category);
      formData.append('severity', severity);
      if (defaultOrgId) formData.append('orgId', defaultOrgId);
      if (defaultOrgName) formData.append('orgName', defaultOrgName);

      if (imageFile) {
        formData.append('image', imageFile);
      }

      if (includeDiagnostics && typeof window !== 'undefined') {
        const diagnostics = {
          currentPath: window.location.pathname + window.location.search,
          userAgent: navigator.userAgent,
          screenResolution: `${window.screen.width}x${window.screen.height}`,
          viewport: `${window.innerWidth}x${window.innerHeight}`,
          submittedAt: new Date().toISOString(),
        };
        formData.append('metadata', JSON.stringify(diagnostics));
      }

      await bugApi.submit(formData);
      toast.success('Bug report submitted successfully! Our technical team has been notified.');
      resetForm();
      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (err) {
      const errorMsg = err?.response?.data?.error || err?.message || 'Failed to submit bug report';
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[92vh] overflow-y-auto sm:rounded-xl">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary font-semibold">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Bug className="h-4 w-4 text-primary" />
            </div>
            <DialogTitle className="text-lg">Report a Bug or Crash</DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Help us improve Convee. Provide details and screenshots of any unexpected error, UI glitch, or system crash.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Issue Title */}
          <div className="space-y-1.5">
            <Label htmlFor="bug-title" className="text-xs font-semibold">
              Issue Summary / Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="bug-title"
              placeholder="e.g., Timetable proxy assignment fails with error on Friday slot"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={150}
              className="text-sm"
            />
          </div>

          {/* Category & Severity Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="text-xs h-9">
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value} className="text-xs">
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Severity Level</Label>
              <Select value={severity} onValueChange={setSeverity}>
                <SelectTrigger className="text-xs h-9">
                  <SelectValue placeholder="Select Severity" />
                </SelectTrigger>
                <SelectContent>
                  {SEVERITIES.map((sev) => (
                    <SelectItem key={sev.value} value={sev.value} className="text-xs">
                      <span className={sev.color}>{sev.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Detailed Description */}
          <div className="space-y-1.5">
            <Label htmlFor="bug-description" className="text-xs font-semibold">
              Description & Steps to Reproduce <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="bug-description"
              rows={4}
              placeholder="1. Navigate to Timetables&#10;2. Select Class 10-A and click Proxy Teacher&#10;3. Click Save & witness error alert&#10;&#10;Expected: Teacher assigned. Actual: Screen threw error."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="text-xs font-sans"
            />
          </div>

          {/* Screenshot / Image Upload */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold flex items-center justify-between">
              <span>Attach Screenshot or Photo (Optional)</span>
              <span className="text-[11px] text-muted-foreground font-normal">Max 10MB (PNG, JPG, WebP)</span>
            </Label>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageChange}
              accept="image/*"
              className="hidden"
            />

            {!imagePreview ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-border/80 hover:border-primary/50 hover:bg-primary/5 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-colors text-center"
              >
                <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center mb-2 text-muted-foreground">
                  <Upload className="h-4 w-4" />
                </div>
                <div className="text-xs font-medium text-foreground">Click or drop an image to upload</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">Captures error dialogs or visual bugs</div>
              </div>
            ) : (
              <div className="relative rounded-xl border border-border p-2 bg-muted/30 flex items-center gap-3">
                <img
                  src={imagePreview}
                  alt="Bug preview"
                  className="h-16 w-24 object-cover rounded-lg border border-border bg-black/20"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-foreground truncate">{imageFile?.name}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {(imageFile?.size / (1024 * 1024)).toFixed(2)} MB
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={removeImage}
                  className="h-8 w-8 text-destructive hover:bg-destructive/10"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Diagnostics notice */}
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/40 border border-border/60 text-xs">
            <Info className="h-4 w-4 text-primary shrink-0" />
            <div className="flex-1 text-[11px] text-muted-foreground">
              Browser, screen resolution, and current URL path will be safely attached to speed up investigation.
            </div>
          </div>

          <DialogFooter className="pt-2 gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || !title.trim() || !description.trim()}
              className="text-xs gap-1.5 bg-primary text-primary-foreground"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Submitting Report...
                </>
              ) : (
                <>
                  <Bug className="h-3.5 w-3.5" />
                  Submit Bug Report
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
