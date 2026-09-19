import React, { useState, useEffect, useMemo } from 'react';
import { CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command';
import { useNavigate } from 'react-router-dom';
import { searchApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Home,
  Hash,
  ListTodo,
  Sparkles,
  Calendar,
  FolderOpen,
  User as UserIcon,
  MessageSquare,
  Landmark,
  BookOpen,
  Clock,
  ShieldCheck,
  BarChart3,
  Users,
  CreditCard,
} from 'lucide-react';

export function CommandPalette({ open, setOpen }) {
  const navigate = useNavigate();
  const { currentOrg, user } = useAuth();
  const { t } = useLanguage();
  const [q, setQ] = useState('');
  const [results, setResults] = useState(null);

  const role = (currentOrg?.role || user?.systemRole || 'STUDENT').toUpperCase();
  const isAccountant =
    role === 'ACCOUNTANT' ||
    user?.systemRole === 'ACCOUNTANT' ||
    user?.email?.toLowerCase().includes('accountant');
  const isParent = role === 'PARENT';
  const isStudent = role === 'STUDENT';
  const isTeacher = role === 'TEACHER';
  const isLeadership = ['DIRECTOR', 'OWNER', 'PRINCIPAL', 'ADMIN', 'DEAN', 'HOD'].includes(role);

  // Dynamic role-filtered navigation items
  const navItems = useMemo(() => {
    if (isAccountant) {
      return [
        { label: t('nav.accountant', 'Financial Sync (Tally)'), path: '/app/accountant', icon: Landmark },
        { label: t('nav.ai', 'AI Assistant'), path: '/app/ai', icon: Sparkles },
        { label: t('nav.myPayslips', 'My Payslips'), path: '/app/my-payslips', icon: CreditCard },
        { label: t('topbar.profile', 'My Profile'), path: '/app/profile', icon: UserIcon },
      ];
    }
    if (isParent) {
      return [
        { label: t('nav.parent', 'Parent Portal'), path: '/app/parent', icon: Users },
        { label: t('nav.homework', 'Homework & Assignments'), path: '/app/homework', icon: BookOpen },
        { label: t('nav.ai', 'AI Assistant'), path: '/app/ai', icon: Sparkles },
        { label: t('nav.meetings', 'Meetings'), path: '/app/meetings', icon: Calendar },
        { label: t('topbar.profile', 'My Profile'), path: '/app/profile', icon: UserIcon },
      ];
    }
    if (isStudent) {
      return [
        { label: t('nav.home', 'Home'), path: '/app/home', icon: Home },
        { label: t('nav.homework', 'Homework & Submissions'), path: '/app/homework', icon: BookOpen },
        { label: t('nav.timetable', 'Timetable'), path: '/app/timetable', icon: Clock },
        { label: t('topbar.studyBuddy', 'Study Buddy (AI & Daily Quiz)'), path: '/app/ai', icon: Sparkles },
        { label: t('nav.meetings', 'Meetings'), path: '/app/meetings', icon: Calendar },
        { label: t('nav.files', 'Files'), path: '/app/files', icon: FolderOpen },
        { label: t('topbar.profile', 'My Profile'), path: '/app/profile', icon: UserIcon },
      ];
    }
    if (isTeacher) {
      return [
        { label: t('nav.home', 'Home'), path: '/app/home', icon: Home },
        { label: t('nav.tasks', 'Tasks'), path: '/app/tasks', icon: ListTodo },
        { label: t('nav.classroom', 'Classroom'), path: '/app/classroom', icon: BookOpen },
        { label: t('nav.homework', 'Homework & Assignments'), path: '/app/homework', icon: BookOpen },
        { label: t('nav.timetable', 'Timetable'), path: '/app/timetable', icon: Clock },
        { label: t('nav.ai', 'AI Assistant'), path: '/app/ai', icon: Sparkles },
        { label: t('nav.meetings', 'Meetings'), path: '/app/meetings', icon: Calendar },
        { label: t('nav.files', 'Files'), path: '/app/files', icon: FolderOpen },
        { label: t('nav.myPayslips', 'My Payslips'), path: '/app/my-payslips', icon: CreditCard },
        { label: t('topbar.profile', 'My Profile'), path: '/app/profile', icon: UserIcon },
      ];
    }
    if (isLeadership) {
      return [
        { label: t('nav.home', 'Home'), path: '/app/home', icon: Home },
        { label: t('nav.tasks', 'Tasks'), path: '/app/tasks', icon: ListTodo },
        { label: t('nav.accountant', 'Financial Sync (Tally)'), path: '/app/accountant', icon: Landmark },
        { label: t('nav.feeStatus', 'Fee Collection Status'), path: '/app/fee-status', icon: CreditCard },
        { label: t('nav.admin', 'Admin Console'), path: '/app/admin', icon: ShieldCheck },
        { label: t('nav.analytics', 'Analytics'), path: '/app/analytics', icon: BarChart3 },
        { label: t('nav.department', 'Departments & Classes'), path: '/app/department', icon: Users },
        { label: t('nav.classroom', 'Classroom'), path: '/app/classroom', icon: BookOpen },
        { label: t('nav.timetable', 'Timetable'), path: '/app/timetable', icon: Clock },
        { label: t('nav.ai', 'AI Assistant'), path: '/app/ai', icon: Sparkles },
        { label: t('nav.meetings', 'Meetings'), path: '/app/meetings', icon: Calendar },
        { label: t('nav.files', 'Files'), path: '/app/files', icon: FolderOpen },
        { label: t('nav.rolePermissions', 'Role Permissions'), path: '/app/role-permissions', icon: ShieldCheck },
        { label: t('nav.studentIdGenerator', 'Student ID Generator'), path: '/app/student-id-generator', icon: UserIcon },
        { label: t('topbar.profile', 'My Profile'), path: '/app/profile', icon: UserIcon },
      ];
    }
    return [
      { label: t('nav.home', 'Home'), path: '/app/home', icon: Home },
      { label: t('nav.ai', 'AI Assistant'), path: '/app/ai', icon: Sparkles },
      { label: t('topbar.profile', 'My Profile'), path: '/app/profile', icon: UserIcon },
    ];
  }, [isAccountant, isParent, isStudent, isTeacher, isLeadership, t]);

  useEffect(() => {
    if (!q || q.length < 2) {
      setResults(null);
      return;
    }
    let ignore = false;
    const timer = setTimeout(async () => {
      try {
        const r = await searchApi.global(q, currentOrg?.id);
        if (!ignore) setResults(r);
      } catch {}
    }, 200);
    return () => {
      ignore = true;
      clearTimeout(timer);
    };
  }, [q, currentOrg?.id]);

  const go = (p) => {
    setOpen(false);
    navigate(p);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen} data-testid="command-palette">
      <CommandInput placeholder={t('command.searchPlaceholder', 'Search users, messages, tasks, files, channels…')} value={q} onValueChange={setQ} />
      <CommandList>
        <CommandEmpty>{q.length < 2 ? t('command.typeToSearch', 'Type to search…') : t('command.noResults', 'No results found.')}</CommandEmpty>
        {(!q || q.length < 2) && (
          <CommandGroup heading={t('command.navigate', 'Navigate')}>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <CommandItem key={item.path} onSelect={() => go(item.path)}>
                  <Icon className="h-4 w-4 mr-2" /> {item.label}
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}
        {results?.users?.length > 0 && (
          <CommandGroup heading={t('command.people', 'People')}>
            {results.users.map((u) => (
              <CommandItem key={u.id} onSelect={() => go(`/app/profile?user=${u.id}`)}>
                <UserIcon className="h-4 w-4 mr-2" /> {u.fullName} <span className="ml-auto text-xs text-muted-foreground">{u.email}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {!isAccountant && results?.channels?.length > 0 && (
          <CommandGroup heading={t('command.channels', 'Channels')}>
            {results.channels.map((c) => (
              <CommandItem key={c.id} onSelect={() => go(`/app/channels/${c.id}`)}>
                <Hash className="h-4 w-4 mr-2" /> {c.name}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {results?.messages?.length > 0 && (
          <CommandGroup heading={t('command.messages', 'Messages')}>
            {results.messages.map((m) => (
              <CommandItem key={m.id} onSelect={() => go(`/app/channels/${m.channelId}`)}>
                <MessageSquare className="h-4 w-4 mr-2" /> <span className="truncate">{m.content}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {!isAccountant && !isStudent && !isParent && results?.tasks?.length > 0 && (
          <CommandGroup heading={t('command.tasks', 'Tasks')}>
            {results.tasks.map((tItem) => (
              <CommandItem key={tItem.id} onSelect={() => go(`/app/tasks/${tItem.id}`)}>
                <ListTodo className="h-4 w-4 mr-2" /> {tItem.title}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
