'use client';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Pencil, Trash2, Check, X, Layers } from 'lucide-react';
import { useFarmStore, cropOptions, soilTypeOptions, irrigationTypeOptions, type Farm } from '@/lib/farm-store';
import { cn } from '@/lib/utils';

interface Props { open: boolean; onOpenChange: (open: boolean) => void; }

export function FarmManagementDialog({ open, onOpenChange }: Props) {
  const { farms, activeFarmId, addFarm, updateFarm, deleteFarm, setActiveFarm, farmCalcs } = useFarmStore();
  const [editingFarm, setEditingFarm] = useState<Farm | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState('');
  const [formArea, setFormArea] = useState('1');
  const [formCrop, setFormCrop] = useState('Maize');
  const [formSoil, setFormSoil] = useState('Loam');
  const [formIrrigation, setFormIrrigation] = useState('Drip');
  const [formPlantingDate, setFormPlantingDate] = useState('');
  const [formNotes, setFormNotes] = useState('');

  const resetForm = () => { setFormName(''); setFormArea('1'); setFormCrop('Maize'); setFormSoil('Loam'); setFormIrrigation('Drip'); setFormPlantingDate(''); setFormNotes(''); setEditingFarm(null); setShowForm(false); };

  const startEdit = (farm: Farm) => {
    setEditingFarm(farm); setFormName(farm.name); setFormArea(String(farm.area)); setFormCrop(farm.crop); setFormSoil(farm.soilType); setFormIrrigation(farm.irrigationType); setFormPlantingDate(farm.plantingDate || ''); setFormNotes(farm.notes || ''); setShowForm(true);
  };

  const handleSave = () => {
    if (!formName.trim()) return;
    const data = { name: formName.trim(), area: parseFloat(formArea) || 1, crop: formCrop, soilType: formSoil, irrigationType: formIrrigation, plantingDate: formPlantingDate || undefined, notes: formNotes.trim() || undefined };
    if (editingFarm) updateFarm(editingFarm.id, data); else addFarm(data);
    resetForm();
  };

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) resetForm(); onOpenChange(v); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-6 pb-4 border-b border-border bg-gradient-to-r from-emerald-50 to-background dark:from-emerald-950/30 dark:to-background">
          <DialogTitle className="flex items-center gap-2"><Layers className="h-5 w-5 text-emerald-600" /> Farm Management</DialogTitle>
          <DialogDescription>Define your farms to tag calculations and track performance.</DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-1 min-h-0">
          <div className="p-6 space-y-4">
            {farms.length > 0 && !showForm && (
              <div className="space-y-2">
                {farms.map(farm => {
                  const calcs = farmCalcs.filter(c => c.farmId === farm.id);
                  const isActive = farm.id === activeFarmId;
                  return (
                    <div key={farm.id} className={cn('rounded-lg border-2 p-4 transition-all', isActive ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20' : 'border-border bg-card')}>
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          {isActive && <div className="flex items-center justify-center h-5 w-5 rounded-full bg-emerald-600 text-white"><Check className="h-3 w-3" /></div>}
                          <div>
                            <h3 className="text-base font-semibold">{farm.name}</h3>
                            <div className="flex items-center gap-2 flex-wrap mt-1">
                              <Badge variant="outline" className="text-[10px]">{farm.crop}</Badge>
                              <Badge variant="outline" className="text-[10px]">{farm.area} ha</Badge>
                              <Badge variant="outline" className="text-[10px]">{farm.soilType}</Badge>
                              <Badge variant="outline" className="text-[10px]">{farm.irrigationType}</Badge>
                              {calcs.length > 0 && <Badge variant="secondary" className="text-[10px]">{calcs.length} calcs</Badge>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {!isActive && <Button variant="outline" size="sm" onClick={() => { setActiveFarm(farm.id); onOpenChange(false); }} className="h-7 text-xs">Select</Button>}
                          <Button variant="ghost" size="sm" onClick={() => startEdit(farm)} className="h-7 w-7 p-0"><Pencil className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="sm" onClick={() => deleteFarm(farm.id)} className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                      </div>
                      {farm.notes && <p className="text-xs text-muted-foreground italic mt-1">{farm.notes}</p>}
                    </div>
                  );
                })}
              </div>
            )}
            {showForm ? (
              <div className="space-y-4 rounded-lg border-2 border-emerald-200 dark:border-emerald-800 p-4 bg-emerald-50/30 dark:bg-emerald-950/10">
                <h3 className="text-sm font-semibold">{editingFarm ? 'Edit Farm' : 'Add New Farm'}</h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="space-y-1"><Label htmlFor="fn" className="text-xs">Farm Name *</Label><Input id="fn" value={formName} onChange={e => setFormName(e.target.value)} placeholder="e.g. North Field" className="h-9" /></div>
                  <div className="space-y-1"><Label htmlFor="fa" className="text-xs">Area (hectares)</Label><Input id="fa" type="number" step="0.1" value={formArea} onChange={e => setFormArea(e.target.value)} className="h-9" /></div>
                  <div className="space-y-1"><Label className="text-xs">Crop</Label><Select value={formCrop} onValueChange={setFormCrop}><SelectTrigger className="h-9"><SelectValue /></SelectTrigger><SelectContent>{cropOptions.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
                  <div className="space-y-1"><Label className="text-xs">Soil Type</Label><Select value={formSoil} onValueChange={setFormSoil}><SelectTrigger className="h-9"><SelectValue /></SelectTrigger><SelectContent>{soilTypeOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
                  <div className="space-y-1"><Label className="text-xs">Irrigation Type</Label><Select value={formIrrigation} onValueChange={setFormIrrigation}><SelectTrigger className="h-9"><SelectValue /></SelectTrigger><SelectContent>{irrigationTypeOptions.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent></Select></div>
                  <div className="space-y-1"><Label htmlFor="fpd" className="text-xs">Planting Date</Label><Input id="fpd" type="date" value={formPlantingDate} onChange={e => setFormPlantingDate(e.target.value)} className="h-9" /></div>
                </div>
                <div className="space-y-1"><Label htmlFor="fn2" className="text-xs">Notes</Label><Textarea id="fn2" value={formNotes} onChange={e => setFormNotes(e.target.value)} placeholder="Optional notes..." className="min-h-[60px] text-sm" /></div>
                <div className="flex items-center gap-2">
                  <Button onClick={handleSave} size="sm" className="gap-1.5 bg-emerald-600 hover:bg-emerald-700" disabled={!formName.trim()}><Check className="h-4 w-4" />{editingFarm ? 'Update' : 'Add'} Farm</Button>
                  <Button variant="outline" size="sm" onClick={resetForm} className="gap-1.5"><X className="h-4 w-4" /> Cancel</Button>
                </div>
              </div>
            ) : (
              <Button variant="outline" onClick={() => setShowForm(true)} className="w-full gap-2 border-dashed"><Plus className="h-4 w-4" /> Add New Farm</Button>
            )}
            {farms.length === 0 && !showForm && (
              <div className="text-center py-8">
                <div className="rounded-full bg-muted p-4 mb-3 mx-auto w-fit"><Layers className="h-8 w-8 text-muted-foreground" /></div>
                <h3 className="text-base font-semibold mb-1">No farms yet</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">Define your farms to tag calculations and track seasonal performance.</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
