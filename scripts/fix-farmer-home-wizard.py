"""Replace FarmerHome function with a version that mounts FarmProfileWizard."""

FILE = 'src/components/agri/level-home.tsx'

with open(FILE, 'r', encoding='utf-8') as f:
    content = f.read()

start_marker = "function FarmerHome({ onOpenTool, onOpenSearch }: Pick<LevelHomeProps, 'onOpenTool' | 'onOpenSearch'>) {"
end_marker = "\n}\n\nfunction ManagerHome"

start_idx = content.find(start_marker)
end_idx = content.find(end_marker, start_idx)
if start_idx == -1 or end_idx == -1:
    print(f"ERROR: start={start_idx} end={end_idx}")
    raise SystemExit(1)

new_farmer_home = '''function FarmerHome({ onOpenTool, onOpenSearch }: Pick<LevelHomeProps, 'onOpenTool' | 'onOpenSearch'>) {
  const { language, isRTL } = useTranslation();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [profileVersion, setProfileVersion] = useState(0);

  // Auto-open the wizard on first visit when no farm profile is set.
  // Mirrors HomeDashboard behaviour (1.5s delay so the page renders first
  // and the dialog slides in cleanly).
  useEffect(() => {
    if (needsFarmProfileSetup()) {
      const timer = setTimeout(() => setWizardOpen(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const hasProfile = !needsFarmProfileSetup();

  return (
    <div className="space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
      <LevelBanner level="farmer" />

      {/* First-run setup banner — only shown when no farm profile exists yet */}
      {!hasProfile && (
        <div className="rounded-2xl border border-emerald-300 bg-gradient-to-br from-emerald-50 to-green-50 p-4 dark:border-emerald-800 dark:from-emerald-950/40 dark:to-green-950/30">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white">
                <Sprout className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold">{copy(language, 'Set up your farm profile', 'Configurez le profil de votre ferme', 'أعدّ ملف مزرعتك')}</h3>
                <p className="text-xs text-muted-foreground mt-0.5 max-w-md">
                  {copy(language,
                    'Tell us your crop, planting date, and location — we will show you today tasks, irrigation needs, and crop stage automatically.',
                    'Indiquez votre culture, date de plantation et localisation — nous afficherons les taches, l irrigation et le stade automatiquement.',
                    'أخبرنا بمحصولك وتاريخ الزراعة وموقعك — سنعرض لك مهام اليوم واحتياجات الري ومرحلة المحصول تلقائياً.')}
                </p>
              </div>
            </div>
            <Button onClick={() => setWizardOpen(true)} className="gap-1.5 shrink-0">
              <Sprout className="h-4 w-4" />
              {copy(language, 'Set up my farm', 'Configurer ma ferme', 'أعدّ مزرعتي')}
            </Button>
          </div>
        </div>
      )}

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <ActionCard icon={CheckCircle2} color="#16a34a" title={copy(language, 'What should I do today?', 'Que faire aujourd’hui ?', 'ماذا أفعل اليوم؟')} description={copy(language, 'See irrigation, fertilization, and crop tasks from your farm data.', 'Voir les tâches d’irrigation, fertilisation et culture.', 'اعرض مهام الري والتسميد والمحصول.')} onClick={() => onOpenTool('home', 'today_tasks')} />
        <ActionCard icon={Droplets} color="#0284c7" title={copy(language, 'Should I irrigate?', 'Dois-je irriguer ?', 'هل أسقي؟')} description={copy(language, 'One number: how much water today, based on weather and crop stage.', 'Un chiffre: combien d’eau aujourd’hui, selon la météo et le stade.', 'رقم واحد: كمية الماء اليوم حسب الطقس ومرحلة المحصول.')} onClick={() => onOpenTool('farm', 'collapse_water_budget')} />
        <ActionCard icon={FlaskConical} color="#059669" title={copy(language, 'Do I apply fertilizer?', 'Dois-je fertiliser ?', 'هل أُسمد؟')} description={copy(language, 'Which type, how much, and when — based on your crop stage and soil tests.', 'Quel type, combien et quand — selon le stade et les analyses de sol.', 'أي نوع وكم ومتى — حسب مرحلة المحصول وتحاليل التربة.')} onClick={() => onOpenTool('farm', 'collapse_nutrient_budget')} />
        <ActionCard icon={Search} color="#0891b2" title={copy(language, "What's wrong with my plant?", 'Quel est le problème ?', 'ما مشكلة نباتي؟')} description={copy(language, 'Use a photo or observation to diagnose pests and diseases safely.', 'Utiliser une photo pour diagnostiquer ravageurs et maladies.', 'استخدم صورة لتشخيص الآفات والأمراض.')} onClick={() => onOpenTool('farm', 'collapse_ai_scout')} />
      </section>
      {/* Secondary cards — planning and money */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <ActionCard icon={CalendarDays} color="#7c3aed" title={copy(language, 'Plan one crop', 'Planifier une culture', 'خطط لمحصول')} description={copy(language, 'Generate a crop calendar with tasks, fertilization, irrigation, and labor.', 'Générer un calendrier avec tâches, fertilisation, irrigation et main-d’œuvre.', 'ولد تقويماً للمحصول مع المهام والتسميد والري والعمالة.')} onClick={() => onOpenTool('calendar')} />
        <ActionCard icon={DollarSign} color="#f59e0b" title={copy(language, 'Will I make money?', 'Serai-je rentable ?', 'هل سأربح؟')} description={copy(language, 'Run a real-world crop scenario in DZD with costs, yield, price, and risks.', 'Simuler une culture en DZD avec coûts, rendement, prix et risques.', 'حاك محصولاً بالدينار مع التكاليف والإنتاج والسعر والمخاطر.')} onClick={() => onOpenTool('simulator')} />
        <ActionCard icon={BookOpen} color="#047857" title={copy(language, 'Record an activity', 'Enregistrer une activité', 'سجل نشاطاً')} description={copy(language, 'Keep one traceable record for inputs, irrigation, scouting, and harvest.', 'Conserver une trace des intrants, du pompage, de la prospection et de la récolte.', 'احتفظ بسجل للمدخلات والري والكشف والحصاد.')} onClick={() => onOpenTool('farm', 'collapse_field_records')} />
      </section>
      <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <Card id="farmer-today-tasks">
          <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-sm"><CheckCircle2 className="h-4 w-4 text-emerald-600" />{copy(language, 'Today on your farm', 'Aujourd’hui dans votre ferme', 'اليوم في مزرعتك')}</CardTitle></CardHeader>
          <CardContent><TodayTasks key={profileVersion} level="farmer" onOpenTool={onOpenTool} /></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between gap-2 text-sm">
              <span className="flex items-center gap-2"><Tractor className="h-4 w-4 text-emerald-600" />{copy(language, 'Farm at a glance', 'Votre ferme en un coup d’œil', 'مزرعتك في لمحة')}</span>
              {hasProfile && (
                <Button size="sm" variant="ghost" className="h-7 px-2 text-[10px] gap-1" onClick={() => setWizardOpen(true)}>
                  <Sprout className="h-3 w-3" />
                  {copy(language, 'Edit', 'Modifier', 'تعديل')}
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent><FarmStats key={profileVersion} /></CardContent>
        </Card>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-emerald-300 bg-emerald-50/60 p-4 dark:bg-emerald-950/20">
        <div><p className="text-sm font-semibold">{copy(language, 'Need a different tool?', 'Besoin d’un autre outil ?', 'هل تحتاج أداة أخرى؟')}</p><p className="text-xs text-muted-foreground">{copy(language, 'Search the full library when you are ready. Advanced tools stay available.', 'Recherchez dans toute la bibliothèque quand vous êtes prêt. Les outils avancés restent disponibles.', 'ابحث في المكتبة الكاملة عندما تكون مستعداً. الأدوات المتقدمة ما زالت متاحة.')}</p></div>
        <Button variant="outline" size="sm" onClick={onOpenSearch} className="gap-1.5"><Wrench className="h-3.5 w-3.5" />{copy(language, 'Browse more tools', 'Parcourir plus d’outils', 'تصفح المزيد من الأدوات')}</Button>
      </div>

      {/* Farm profile wizard — auto-opens on first visit, re openable via Edit button */}
      <FarmProfileWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        onSaved={() => setProfileVersion(v => v + 1)}
      />
    </div>
  );
}'''

content = content[:start_idx] + new_farmer_home + content[end_idx:]

with open(FILE, 'w', encoding='utf-8') as f:
    f.write(content)

print(f"OK: Replaced FarmerHome function ({end_idx - start_idx} chars -> {len(new_farmer_home)} chars)")
