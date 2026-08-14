'use client';

import { useState } from 'react';
import { Check, LockKeyhole, Mail, ShieldCheck, UserPlus, Users, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useTranslation, type Language } from '@/lib/language-store';
import { planAllows, useWorkspaceStore, WORKSPACE_PLANS, type WorkspaceFeature, type WorkspacePlan, type WorkspaceRole } from '@/lib/workspace-store';

const copy = {
  en: {
    title: 'Workspace & access', description: 'A local-first foundation for farm teams, roles, and future subscription sync.', name: 'Workspace name', save: 'Save', plan: 'Current plan', free: 'Free', pro: 'Pro', team: 'Team', current: 'Current', members: 'Members', owner: 'Owner', manager: 'Manager', viewer: 'Viewer', active: 'Active', pending: 'Pending', invite: 'Invite teammate', email: 'Email address', role: 'Role', send: 'Create invitation', remove: 'Remove', collaborationLocked: 'Team collaboration is available on Pro and Team plans.', billingNote: 'Billing is not connected yet; these controls are the entitlement foundation for a future account backend.', features: 'Plan capabilities', aiAdvisor: 'AI agronomy guidance', fieldIntelligence: 'Field intelligence timeline', reportExport: 'Professional report export', teamCollaboration: 'Team collaboration', included: 'Included', upgrade: 'Upgrade required', invitationCreated: 'Invitation created locally.', invalidEmail: 'Enter a valid email address.', duplicateEmail: 'This email is already in the workspace.', limitReached: 'This plan has reached its member limit.', noMembers: 'No additional members yet.', roleHint: 'Viewer can review; Manager can coordinate farm work.',
  },
  fr: {
    title: 'Espace de travail et accès', description: 'Une base locale pour les équipes agricoles, les rôles et la future synchronisation des abonnements.', name: 'Nom de l’espace', save: 'Enregistrer', plan: 'Plan actuel', free: 'Gratuit', pro: 'Pro', team: 'Équipe', current: 'Actuel', members: 'Membres', owner: 'Propriétaire', manager: 'Gestionnaire', viewer: 'Lecteur', active: 'Actif', pending: 'En attente', invite: 'Inviter un collègue', email: 'Adresse e-mail', role: 'Rôle', send: 'Créer l’invitation', remove: 'Supprimer', collaborationLocked: 'La collaboration d’équipe est disponible avec les plans Pro et Équipe.', billingNote: 'La facturation n’est pas encore connectée ; ces contrôles préparent les droits d’un futur compte serveur.', features: 'Capacités du plan', aiAdvisor: 'Conseil agronomique IA', fieldIntelligence: 'Chronologie d’intelligence terrain', reportExport: 'Export de rapports professionnels', teamCollaboration: 'Collaboration d’équipe', included: 'Inclus', upgrade: 'Mise à niveau requise', invitationCreated: 'Invitation créée localement.', invalidEmail: 'Saisissez une adresse e-mail valide.', duplicateEmail: 'Cet e-mail existe déjà dans l’espace.', limitReached: 'Ce plan a atteint sa limite de membres.', noMembers: 'Aucun membre supplémentaire pour le moment.', roleHint: 'Le lecteur consulte ; le gestionnaire coordonne les travaux.',
  },
  ar: {
    title: 'مساحة العمل والصلاحيات', description: 'أساس محلي للفرق والأدوار ومزامنة الاشتراكات مستقبلاً.', name: 'اسم مساحة العمل', save: 'حفظ', plan: 'الخطة الحالية', free: 'مجانية', pro: 'احترافية', team: 'فريق', current: 'الحالية', members: 'الأعضاء', owner: 'المالك', manager: 'مدير', viewer: 'مشاهد', active: 'نشط', pending: 'قيد الانتظار', invite: 'دعوة زميل', email: 'البريد الإلكتروني', role: 'الدور', send: 'إنشاء الدعوة', remove: 'إزالة', collaborationLocked: 'التعاون الجماعي متاح في الخطتين الاحترافية والفريق.', billingNote: 'الفوترة غير متصلة بعد؛ هذه الضوابط تمثل أساس الصلاحيات لحساب خادم مستقبلي.', features: 'قدرات الخطة', aiAdvisor: 'إرشاد زراعي بالذكاء الاصطناعي', fieldIntelligence: 'الخط الزمني لذكاء الحقول', reportExport: 'تصدير التقارير الاحترافية', teamCollaboration: 'التعاون الجماعي', included: 'متاح', upgrade: 'الترقية مطلوبة', invitationCreated: 'تم إنشاء الدعوة محلياً.', invalidEmail: 'أدخل بريداً إلكترونياً صحيحاً.', duplicateEmail: 'هذا البريد موجود بالفعل في مساحة العمل.', limitReached: 'وصلت هذه الخطة إلى الحد الأقصى للأعضاء.', noMembers: 'لا يوجد أعضاء إضافيون بعد.', roleHint: 'يمكن للمشاهد المراجعة، ويمكن للمدير تنسيق أعمال المزرعة.',
  },
} as const;

type Copy = (typeof copy)[Language];

const planLabel = (plan: WorkspacePlan, c: Copy) => ({ free: c.free, pro: c.pro, team: c.team }[plan]);
const roleLabel = (role: WorkspaceRole, c: Copy) => ({ owner: c.owner, manager: c.manager, viewer: c.viewer }[role]);
const featureLabel = (feature: WorkspaceFeature, c: Copy) => ({ aiAdvisor: c.aiAdvisor, fieldIntelligence: c.fieldIntelligence, reportExport: c.reportExport, teamCollaboration: c.teamCollaboration }[feature]);

export function WorkspacePanel() {
  const { language, isRTL } = useTranslation();
  const c = copy[language];
  const { workspaceName, plan, members, setWorkspaceName, inviteMember, removeMember } = useWorkspaceStore();
  const [nameDraft, setNameDraft] = useState(workspaceName);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Exclude<WorkspaceRole, 'owner'>>('viewer');
  const [feedback, setFeedback] = useState('');

  const features: WorkspaceFeature[] = ['aiAdvisor', 'fieldIntelligence', 'reportExport', 'teamCollaboration'];
  const submitInvitation = () => {
    const normalized = email.trim().toLowerCase();
    if (!normalized.includes('@')) {
      setFeedback(c.invalidEmail);
      return;
    }
    if (!planAllows(plan, 'teamCollaboration')) {
      setFeedback(c.collaborationLocked);
      return;
    }
    if (members.some(member => member.email === normalized)) {
      setFeedback(c.duplicateEmail);
      return;
    }
    if (!inviteMember(normalized, role)) {
      setFeedback(c.limitReached);
      return;
    }
    setEmail('');
    setFeedback(c.invitationCreated);
  };

  return (
    <Card className="overflow-hidden border-emerald-200/60 dark:border-emerald-900/60">
      <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/30">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base"><ShieldCheck className="h-5 w-5 text-emerald-600" />{c.title}</CardTitle>
            <CardDescription className="mt-1 max-w-2xl">{c.description}</CardDescription>
          </div>
          <Badge variant="outline" className="border-emerald-300 text-emerald-700 dark:text-emerald-300">{planLabel(plan, c)} · {c.current}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5 p-4">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="workspace-name">{c.name}</Label>
              <div className="flex gap-2">
                <Input id="workspace-name" value={nameDraft} onChange={event => setNameDraft(event.target.value)} dir={isRTL ? 'rtl' : 'ltr'} />
                <Button type="button" variant="outline" onClick={() => setWorkspaceName(nameDraft)}>{c.save}</Button>
              </div>
            </div>
            <div className="rounded-lg border border-border/70 p-3">
              <div className="mb-2 flex items-center justify-between gap-2"><span className="text-sm font-semibold">{c.plan}</span><Badge>{planLabel(plan, c)}</Badge></div>
              <p className="text-xs text-muted-foreground">{c.billingNote}</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold"><Users className="h-4 w-4 text-emerald-600" />{c.members} ({members.length}/{WORKSPACE_PLANS[plan].maxMembers})</div>
              <div className="space-y-2">
                {members.map(member => (
                  <div key={member.id} className="flex items-center justify-between gap-2 rounded-lg border border-border/60 px-3 py-2 text-sm">
                    <div className="min-w-0"><p className="truncate font-medium">{member.name}</p><p className="truncate text-xs text-muted-foreground">{member.email}</p></div>
                    <div className="flex shrink-0 items-center gap-2"><Badge variant="secondary">{roleLabel(member.role, c)}</Badge>{member.status === 'pending' && <span className="text-[11px] text-muted-foreground">{c.pending}</span>}{member.role !== 'owner' && <Button aria-label={`${c.remove} ${member.email}`} variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeMember(member.id)}><X className="h-3.5 w-3.5" /></Button>}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold">{c.features}</h3>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {features.map(feature => {
                  const enabled = planAllows(plan, feature);
                  return <div key={feature} className="flex items-start gap-2 rounded-lg border border-border/60 p-3 text-sm"><span className={`mt-0.5 rounded-full p-0.5 ${enabled ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300' : 'bg-muted text-muted-foreground'}`}>{enabled ? <Check className="h-3.5 w-3.5" /> : <LockKeyhole className="h-3.5 w-3.5" />}</span><span><span className="block font-medium">{featureLabel(feature, c)}</span><span className="text-xs text-muted-foreground">{enabled ? c.included : c.upgrade}</span></span></div>;
                })}
              </div>
            </div>
            <Separator />
            <div className="space-y-3 rounded-lg border border-dashed border-border/80 p-3">
              <div className="flex items-center gap-2"><UserPlus className="h-4 w-4 text-emerald-600" /><h3 className="text-sm font-semibold">{c.invite}</h3></div>
              <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                <div className="relative"><Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" type="email" value={email} onChange={event => { setEmail(event.target.value); setFeedback(''); }} placeholder={c.email} disabled={!planAllows(plan, 'teamCollaboration')} /></div>
                <select aria-label={c.role} value={role} onChange={event => setRole(event.target.value as typeof role)} disabled={!planAllows(plan, 'teamCollaboration')} className="h-10 rounded-md border border-input bg-background px-3 text-sm"><option value="viewer">{c.viewer}</option><option value="manager">{c.manager}</option></select>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs text-muted-foreground">{planAllows(plan, 'teamCollaboration') ? c.roleHint : c.collaborationLocked}</p><Button type="button" size="sm" onClick={submitInvitation} disabled={!planAllows(plan, 'teamCollaboration') || !email.trim()}>{c.send}</Button></div>
              {feedback && <p role="status" className="text-xs text-emerald-700 dark:text-emerald-300">{feedback}</p>}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
