import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { userApi, fileApi, API_BASE, bugApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import {
  Upload,
  Trash2,
  Loader2,
  Key,
  ShieldCheck,
  Lock,
  Bug,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Image as ImageIcon,
  ExternalLink,
  Plus,
  Scale,
} from 'lucide-react';
import BugReportModal from '@/components/profile/BugReportModal';

function initials(n) { return (n || '?').split(' ').map((x) => x[0]).slice(0, 2).join('').toUpperCase(); }

export default function ProfilePage() {
  const { user, currentOrg, refresh } = useAuth();
  const { t } = useLanguage();
  const [form, setForm] = useState({ fullName: '', bio: '', avatarUrl: '' });
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Email linking & OTP verification state
  const isInternalIdEmail = Boolean(user?.email && (user.email.startsWith('STU-') || user.email.startsWith('PAR-') || !user.email.includes('@')));
  const [emailInput, setEmailInput] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [isEditingEmail, setIsEditingEmail] = useState(false);

  // Password state
  const [passForm, setPassForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passSaving, setPassSaving] = useState(false);

  // AI-Legal Credentials state
  const hasAiLegalAddon = Boolean(
    currentOrg?.hasAiLegal ||
    user?.memberships?.some((m) => {
      const desc = m.organization?.description || '';
      return /\[ADDONS:[^\]]*AI_LEGAL[^\]]*\]/i.test(desc);
    })
  );
  const [aiLegalForm, setAiLegalForm] = useState({ newPassword: '', confirmPassword: '' });
  const [aiLegalSaving, setAiLegalSaving] = useState(false);
  const [aiLegalStatus, setAiLegalStatus] = useState(null);
  const [loadingAiLegalStatus, setLoadingAiLegalStatus] = useState(false);

  // Bug Reports state
  const [isBugModalOpen, setIsBugModalOpen] = useState(false);
  const [myBugReports, setMyBugReports] = useState([]);
  const [loadingBugs, setLoadingBugs] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  const fetchMyBugReports = async () => {
    try {
      setLoadingBugs(true);
      const res = await bugApi.myReports();
      setMyBugReports(res.reports || []);
    } catch (e) {
      console.error('Failed to load my bug reports', e);
    } finally {
      setLoadingBugs(false);
    }
  };

  useEffect(() => {
    if (user) {
      setForm({
        fullName: user.fullName || '',
        bio: user.bio || '',
        avatarUrl: user.avatarUrl || '',
      });
      setEmailInput(isInternalIdEmail ? '' : user.email || '');
      setOtpSent(false);
      setOtpCode('');
      setIsEditingEmail(false);
      fetchMyBugReports();
    }
  }, [user, isInternalIdEmail]);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fileApi.upload(formData);
      const fullUrl = res.url?.startsWith('http') ? res.url : `${API_BASE.replace('/api/v1', '')}${res.url}`;
      setForm((prev) => ({ ...prev, avatarUrl: fullUrl }));
      toast.success('Image uploaded successfully');
    } catch (err) {
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeAvatar = () => {
    setForm((prev) => ({ ...prev, avatarUrl: '' }));
  };

  const save = async () => {
    try {
      await userApi.updateMe(form);
      toast.success('Profile saved');
      refresh();
    } catch (e) {
      toast.error(e?.response?.data?.error || 'Failed to save profile');
    }
  };

  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    const cleanEmail = emailInput.trim().toLowerCase();
    if (!cleanEmail) {
      toast.error('Please enter an email address');
      return;
    }
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(cleanEmail)) {
      toast.error('Please enter a valid email format (e.g. name@example.com)');
      return;
    }

    setSendingOtp(true);
    try {
      const res = await userApi.sendEmailVerification(cleanEmail);
      setOtpSent(true);
      if (res.devOtp) {
        setOtpCode(res.devOtp);
      }
      toast.success(res?.message || 'Verification code sent to your email address!');
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to send verification code');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const cleanEmail = emailInput.trim().toLowerCase();
    const cleanCode = otpCode.trim();

    if (!cleanCode || cleanCode.length < 6) {
      toast.error('Please enter the 6-digit verification code');
      return;
    }

    setVerifyingOtp(true);
    try {
      const res = await userApi.verifyEmailCode(cleanEmail, cleanCode);
      toast.success(res?.message || 'Email verified and successfully linked to your account!');
      setOtpSent(false);
      setOtpCode('');
      setIsEditingEmail(false);
      await refresh();
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Invalid or expired verification code');
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passForm.newPassword !== passForm.confirmPassword) {
      toast.error('New passwords do not match.');
      return;
    }
    if (passForm.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long.');
      return;
    }

    setPassSaving(true);
    try {
      const res = await userApi.setPassword({
        currentPassword: passForm.currentPassword,
        newPassword: passForm.newPassword,
      });
      toast.success(res?.message || 'Password updated successfully!');
      setPassForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      await refresh();
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to update password');
    } finally {
      setPassSaving(false);
    }
  };

  useEffect(() => {
    if (hasAiLegalAddon) {
      setLoadingAiLegalStatus(true);
      userApi.getAiLegalStatus()
        .then((res) => setAiLegalStatus(res))
        .catch(() => setAiLegalStatus(null))
        .finally(() => setLoadingAiLegalStatus(false));
    }
  }, [hasAiLegalAddon, currentOrg?.id]);

  const handleAiLegalPasswordSubmit = async (e) => {
    e.preventDefault();
    if (aiLegalForm.newPassword !== aiLegalForm.confirmPassword) {
      toast.error('AI-Legal passwords do not match.');
      return;
    }
    if (aiLegalForm.newPassword.length < 6) {
      toast.error('AI-Legal password must be at least 6 characters long.');
      return;
    }

    setAiLegalSaving(true);
    try {
      const res = await userApi.setAiLegalPassword({
        newPassword: aiLegalForm.newPassword,
      });
      toast.success(res?.message || 'AI-Legal password updated successfully!');
      setAiLegalForm({ newPassword: '', confirmPassword: '' });
      const statusRes = await userApi.getAiLegalStatus();
      setAiLegalStatus(statusRes);
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to update AI-Legal password');
    } finally {
      setAiLegalSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">{t('profile.title', 'Profile & Account')}</h1>
        <p className="text-muted-foreground">{t('profile.subtitle', 'Manage your credentials, login email, password, and personal details')}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('profile.personalDetails', 'Personal Details')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pb-4 border-b border-border">
            <Avatar className="h-20 w-20 border border-border">
              <AvatarImage src={form.avatarUrl} alt={form.fullName} />
              <AvatarFallback className="bg-primary/10 text-primary text-xl font-medium">
                {initials(form.fullName)}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1.5 flex-1">
              <div className="font-semibold text-lg flex items-center flex-wrap gap-2">
                <span>{form.fullName || user?.email}</span>
                {(currentOrg?.userUniqueId || currentOrg?.directorId || user?.directorId || (user?.memberships?.find((m) => m.orgId === currentOrg?.id)?.title?.match(/\[(.*?)\]/)?.[1])) && (
                  <Badge variant="default" className="font-mono text-xs bg-primary text-primary-foreground px-2 py-0.5">
                    ID: {currentOrg?.userUniqueId || currentOrg?.directorId || user?.directorId || (user?.memberships?.find((m) => m.orgId === currentOrg?.id)?.title?.match(/\[(.*?)\]/)?.[1])}
                  </Badge>
                )}
              </div>
              <div className="text-sm text-muted-foreground">
                {isInternalIdEmail ? (
                  <span className="text-amber-400 font-medium">{t('profile.idLogin', 'ID Login')}: {user?.email} ({t('profile.noEmailLinked', 'No email linked')})</span>
                ) : (
                  <span className="text-foreground font-medium flex items-center gap-1.5">
                    {user?.email}
                    <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                      {t('profile.verifiedEmail', '✓ Verified Email')}
                    </Badge>
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="gap-2 text-xs"
                >
                  {uploading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Upload className="h-3.5 w-3.5" />
                  )}
                  {uploading ? t('profile.uploading', 'Uploading…') : t('profile.uploadPhoto', 'Upload photo')}
                </Button>
                {form.avatarUrl && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={removeAvatar}
                    className="gap-1.5 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {t('profile.remove', 'Remove')}
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="fullName">{t('profile.fullName', 'Full name')}</Label>
              <Input
                id="fullName"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="bio">{t('profile.bio', 'Bio')}</Label>
              <Textarea
                id="bio"
                rows={3}
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                placeholder={t('profile.aboutYou', 'About you')}
              />
            </div>
          </div>

          <Button onClick={save} data-testid="profile-save-btn">
            {t('profile.saveProfileChanges', 'Save profile changes')}
          </Button>
        </CardContent>
      </Card>

      {/* Email & OTP Verification Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">{t('profile.emailAndVerification', 'Login Email & Inbox Verification')}</CardTitle>
              <CardDescription className="text-xs">
                {isInternalIdEmail
                  ? t('profile.unverifiedDesc', 'Verify and link your real email address with a 6-digit verification code to enable email login and notifications.')
                  : t('profile.verifiedDesc', 'Your active verified email for notifications, announcements, and portal sign in.')}
              </CardDescription>
            </div>
            {!isInternalIdEmail && !isEditingEmail && (
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-7"
                onClick={() => setIsEditingEmail(true)}
              >
                {t('profile.changeEmail', 'Change Email')}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isInternalIdEmail || isEditingEmail ? (
            <div className="space-y-4">
              {isInternalIdEmail && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300">
                  ⚠️ <strong>{t('profile.noEmailLinked', 'No real email is currently linked to your account.')}</strong> You are logging in via your ID (<code>{user?.email}</code>). Verify your email below to ensure you never lose access.
                </div>
              )}

              {!otpSent ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="emailInput">{t('profile.realEmailAddress', 'Real Email Address')}</Label>
                    <Input
                      id="emailInput"
                      type="email"
                      required
                      placeholder="e.g. yourname@gmail.com"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                    />
                    <p className="text-[11px] text-muted-foreground">
                      {t('profile.codeSentNote', 'A 6-digit confirmation code will be sent to this email to verify that the mailbox exists.')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button type="submit" disabled={sendingOtp || !emailInput.trim()} className="gap-2">
                      {sendingOtp && <Loader2 className="h-4 w-4 animate-spin" />}
                      {sendingOtp ? t('profile.sendingCode', 'Sending Verification Code…') : t('profile.sendCode', 'Send 6-Digit Verification Code')}
                    </Button>
                    {isEditingEmail && (
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => {
                          setIsEditingEmail(false);
                          setEmailInput(user?.email || '');
                        }}
                      >
                        {t('common.cancel', 'Cancel')}
                      </Button>
                    )}
                  </div>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-4 p-4 rounded-xl border border-primary/30 bg-primary/5">
                  <div className="space-y-1">
                    <div className="text-xs font-semibold text-foreground">
                      {t('profile.enterCodeSentTo', 'Enter 6-Digit Code Sent to')} <span className="font-mono text-primary font-bold">{emailInput}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      {t('profile.checkInboxNote', 'Please check your inbox (and spam folder) for the verification code.')}
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="otpCode" className="text-xs font-semibold">{t('profile.codeLabel', '6-Digit Verification Code')}</Label>
                    <Input
                      id="otpCode"
                      type="text"
                      maxLength={6}
                      required
                      placeholder="e.g. 849201"
                      className="font-mono text-center tracking-widest text-lg font-bold max-w-[200px]"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <Button type="submit" disabled={verifyingOtp || otpCode.length < 6} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                      {verifyingOtp && <Loader2 className="h-4 w-4 animate-spin" />}
                      {verifyingOtp ? t('profile.verifyingCode', 'Verifying Code…') : t('profile.confirmAndLink', '✓ Confirm & Link Email')}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setOtpSent(false)}
                      className="text-xs text-muted-foreground"
                    >
                      {t('profile.changeEmailResend', 'Change Email / Resend')}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
              <div className="space-y-0.5">
                <div className="text-xs font-medium text-emerald-400">{t('profile.activeVerifiedEmail', 'Active Verified Email')}</div>
                <div className="text-sm font-semibold text-foreground font-mono">{user?.email}</div>
              </div>
              <Badge variant="outline" className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-xs">
                {t('profile.verified', '✓ Verified')}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security & Password Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-base">{t('profile.securityAndPassword', 'Security & Password')}</CardTitle>
              <CardDescription className="text-xs">
                {user?.hasPassword
                  ? t('profile.securityDesc', 'Update your account password. You can log in using your password alongside your Email or Director ID.')
                  : t('profile.googleOAuthDesc', 'You logged in with Google OAuth. Set a password below if you would also like to sign in using your Director ID / Email and password.')}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            {user?.hasPassword && (
              <div>
                <Label htmlFor="currentPassword">{t('profile.currentPassword', 'Current Password')}</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  required
                  value={passForm.currentPassword}
                  onChange={(e) => setPassForm({ ...passForm, currentPassword: e.target.value })}
                  placeholder={t('profile.enterCurrentPassword', 'Enter current password')}
                />
              </div>
            )}
            <div>
              <Label htmlFor="newPassword">{user?.hasPassword ? t('profile.newPassword', 'New Password') : t('profile.createPassword', 'Create Password')}</Label>
              <Input
                id="newPassword"
                type="password"
                required
                minLength={6}
                value={passForm.newPassword}
                onChange={(e) => setPassForm({ ...passForm, newPassword: e.target.value })}
                placeholder={t('profile.atLeast6Chars', 'At least 6 characters')}
              />
            </div>
            <div>
              <Label htmlFor="confirmPassword">{t('profile.confirmPassword', 'Confirm Password')}</Label>
              <Input
                id="confirmPassword"
                type="password"
                required
                minLength={6}
                value={passForm.confirmPassword}
                onChange={(e) => setPassForm({ ...passForm, confirmPassword: e.target.value })}
                placeholder={t('profile.reEnterNewPassword', 'Re-enter new password')}
              />
            </div>

            <Button type="submit" disabled={passSaving} className="gap-2">
              {passSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
              {passSaving ? t('profile.saving', 'Saving…') : user?.hasPassword ? t('profile.updatePassword', 'Update Password') : t('profile.setPassword', 'Set Account Password')}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* AI-Legal Credentials Card (Visible for organizations with AI-Legal Add-on) */}
      {hasAiLegalAddon && (
        <Card className="border-purple-500/30 bg-gradient-to-b from-purple-500/[0.04] to-transparent shadow-sm">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20">
                  <Scale className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base">{t('profile.aiLegalTitle', 'AI-Legal™ Platform Credentials')}</CardTitle>
                    <Badge variant="outline" className="bg-purple-500/15 text-purple-300 border-purple-500/30 text-[11px] font-medium flex items-center gap-1">
                      <Scale className="h-2.5 w-2.5" />
                      {t('profile.aiLegalActive', 'Add-on Active')}
                    </Badge>
                  </div>
                  <CardDescription className="text-xs">
                    {t('profile.aiLegalDesc', 'Set an independent password for logging directly into the standalone AI-Legal™ portal. This does not affect your Convee login password.')}
                  </CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="space-y-0.5">
                <span className="text-purple-300 font-medium">{t('profile.aiLegalUsername', 'AI-Legal Direct Login ID / Email')}:</span>
                <div className="font-mono font-semibold text-foreground">{user?.email}</div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px]">
                  ✓ {aiLegalStatus?.isRegistered ? t('profile.aiLegalSynced', 'Account Synced') : t('profile.aiLegalReady', 'Ready to Connect')}
                </Badge>
                {aiLegalStatus?.plan && (
                  <Badge variant="secondary" className="text-[10px] font-mono">
                    {aiLegalStatus.plan} PLAN
                  </Badge>
                )}
              </div>
            </div>

            <form onSubmit={handleAiLegalPasswordSubmit} className="space-y-4">
              <div>
                <Label htmlFor="newAiLegalPassword">{t('profile.newAiLegalPassword', 'New AI-Legal Password')}</Label>
                <Input
                  id="newAiLegalPassword"
                  type="password"
                  required
                  minLength={6}
                  value={aiLegalForm.newPassword}
                  onChange={(e) => setAiLegalForm({ ...aiLegalForm, newPassword: e.target.value })}
                  placeholder={t('profile.enterNewAiLegalPass', 'At least 6 characters')}
                />
              </div>
              <div>
                <Label htmlFor="confirmAiLegalPassword">{t('profile.confirmAiLegalPassword', 'Confirm AI-Legal Password')}</Label>
                <Input
                  id="confirmAiLegalPassword"
                  type="password"
                  required
                  minLength={6}
                  value={aiLegalForm.confirmPassword}
                  onChange={(e) => setAiLegalForm({ ...aiLegalForm, confirmPassword: e.target.value })}
                  placeholder={t('profile.reEnterNewAiLegalPass', 'Re-enter AI-Legal password')}
                />
              </div>

              <div className="pt-1">
                <Button
                  type="submit"
                  disabled={aiLegalSaving || !aiLegalForm.newPassword}
                  className="gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-sm"
                >
                  {aiLegalSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                  {aiLegalSaving ? t('profile.saving', 'Saving…') : t('profile.updateAiLegalPass', 'Update AI-Legal Password')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Bug & Crash Reporting Card */}
      <Card className="border-border/80">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center">
                <Bug className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base">{t('profile.reportBug', 'Report Bug or System Issue')}</CardTitle>
                <CardDescription className="text-xs">
                  {t('profile.reportBugDesc', 'Found a glitch, error, or system crash? Submit details and screenshots directly to the development team.')}
                </CardDescription>
              </div>
            </div>
            <Button
              onClick={() => setIsBugModalOpen(true)}
              className="gap-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white shadow-sm self-start sm:self-auto text-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              {t('profile.reportAnIssue', 'Report an Issue')}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-t border-border/60 pt-3">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                {t('profile.myReportedIssues', 'My Reported Issues')} ({myBugReports.length})
              </h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchMyBugReports}
                disabled={loadingBugs}
                className="text-xs h-7 gap-1 text-muted-foreground hover:text-foreground"
              >
                {loadingBugs ? <Loader2 className="h-3 w-3 animate-spin" /> : t('common.refresh', 'Refresh')}
              </Button>
            </div>

            {loadingBugs && myBugReports.length === 0 ? (
              <div className="p-4 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                {t('common.loading', 'Loading...')}
              </div>
            ) : myBugReports.length === 0 ? (
              <div className="p-6 text-center rounded-xl border border-dashed border-border/60 bg-muted/20">
                <CheckCircle2 className="h-8 w-8 text-muted-foreground/60 mx-auto mb-2" />
                <p className="text-xs font-medium text-foreground">{t('profile.noBugsYet', 'No bug reports submitted yet')}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {t('profile.reportBugPrompt', 'If you run into any crash or unexpected behavior anywhere in AI Education, click "Report an Issue" above.')}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {myBugReports.map((report) => {
                  const statusColors = {
                    OPEN: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
                    IN_PROGRESS: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
                    RESOLVED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
                    CLOSED: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
                  };

                  const severityColors = {
                    CRITICAL: 'bg-red-500/15 text-red-400 border-red-500/30',
                    HIGH: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
                    MEDIUM: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
                    LOW: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
                  };

                  return (
                    <div
                      key={report.id}
                      className="p-3.5 rounded-xl border border-border/70 bg-card hover:bg-muted/30 transition-colors space-y-2.5"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                        <div className="space-y-1 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm text-foreground">{report.title}</span>
                            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 font-medium ${statusColors[report.status] || ''}`}>
                              {report.status}
                            </Badge>
                            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 font-medium ${severityColors[report.severity] || ''}`}>
                              {report.severity}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground whitespace-pre-wrap line-clamp-3">
                            {report.description}
                          </p>
                        </div>

                        {report.imageUrl && (
                          <div
                            onClick={() => setPreviewImage(report.imageUrl)}
                            className="relative group cursor-pointer shrink-0 border border-border rounded-lg overflow-hidden h-14 w-20 bg-black/40"
                            title="Click to view full screenshot"
                          >
                            <img
                              src={report.imageUrl}
                              alt="Bug Attachment"
                              className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <ExternalLink className="h-3.5 w-3.5 text-white" />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Resolution note if available */}
                      {report.adminNotes && (
                        <div className="p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-xs">
                          <span className="font-semibold text-emerald-400">Admin Response: </span>
                          <span className="text-muted-foreground">{report.adminNotes}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/40">
                        <span className="font-mono text-[10px] text-muted-foreground/70">Category: {report.category}</span>
                        <span>{new Date(report.createdAt).toLocaleDateString()} at {new Date(report.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Bug Report Submission Modal */}
      <BugReportModal
        open={isBugModalOpen}
        onOpenChange={setIsBugModalOpen}
        onSuccess={fetchMyBugReports}
        defaultOrgId={currentOrg?.id}
        defaultOrgName={currentOrg?.name}
      />

      {/* Screenshot Preview Modal */}
      <Dialog open={Boolean(previewImage)} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-2 bg-black/90 border-border/80">
          <div className="flex items-center justify-between px-2 py-1 text-xs text-slate-300">
            <span>Screenshot Attachment</span>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-white"
              onClick={() => window.open(previewImage, '_blank')}
            >
              <ExternalLink className="h-3.5 w-3.5 mr-1" /> Open in New Tab
            </Button>
          </div>
          <div className="max-h-[75vh] overflow-auto flex items-center justify-center p-2">
            <img
              src={previewImage}
              alt="Screenshot Preview"
              className="max-w-full max-h-full object-contain rounded-md"
            />
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

