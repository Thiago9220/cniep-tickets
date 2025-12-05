import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useData, WeeklyData } from "@/contexts/DataContext";
import { Edit } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export function EditWeeklyDialog() {
  const { weeklyData, updateWeeklyData } = useData();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<WeeklyData>(weeklyData);

  // Atualiza formData quando weeklyData mudar ou quando o diálogo abrir
  useEffect(() => {
    if (open) {
      setFormData(weeklyData);
    }
  }, [open, weeklyData]);

  const handleSave = () => {
    updateWeeklyData(formData);
    setOpen(false);
    toast.success("Dados semanais atualizados com sucesso!");
  };

  const handleChange = (section: keyof WeeklyData, field: string, value: any) => {
    setFormData((prev) => {
      // Verifica se a seção é um objeto antes de fazer spread
      const sectionData = prev[section];
      if (typeof sectionData === 'object' && sectionData !== null && !Array.isArray(sectionData)) {
        return {
          ...prev,
          [section]: {
            ...sectionData,
            [field]: value === '' ? 0 : value,
          },
        };
      }
      return prev;
    });
  };

  const handleArrayChange = (arrayName: 'backlogByUrgency' | 'dailyVolume', index: number, field: string, value: any) => {
    setFormData((prev) => {
      const newArray = [...prev[arrayName]];
      newArray[index] = { ...newArray[index], [field]: value === '' ? 0 : value };
      return { ...prev, [arrayName]: newArray };
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" onClick={() => setFormData(weeklyData)}>
          <Edit className="mr-2 h-4 w-4" />
          Editar Dados
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Editar Relatório Semanal</DialogTitle>
          <DialogDescription>
            Atualize os indicadores manuais para a apresentação.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">Período</h3>
              <div className="grid grid-cols-1 gap-4">
                <div className="grid gap-2">
                  <Label>Intervalo de Datas</Label>
                  <Input 
                    value={formData.period} 
                    onChange={(e) => setFormData({...formData, period: e.target.value})} 
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">Resumo (KPIs)</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Abertos</Label>
                  <Input
                    type="number"
                    value={formData.summary.opened || ''}
                    onChange={(e) => handleChange('summary', 'opened', e.target.value === '' ? '' : Number(e.target.value))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Fechados</Label>
                  <Input
                    type="number"
                    value={formData.summary.closed || ''}
                    onChange={(e) => handleChange('summary', 'closed', e.target.value === '' ? '' : Number(e.target.value))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Backlog Total</Label>
                  <Input
                    type="number"
                    value={formData.summary.backlog || ''}
                    onChange={(e) => handleChange('summary', 'backlog', e.target.value === '' ? '' : Number(e.target.value))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Risco SLA</Label>
                  <Input
                    type="number"
                    value={formData.summary.slaRisk || ''}
                    onChange={(e) => handleChange('summary', 'slaRisk', e.target.value === '' ? '' : Number(e.target.value))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>TMA (Horas)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.summary.tma || ''}
                    onChange={(e) => handleChange('summary', 'tma', e.target.value === '' ? '' : Number(e.target.value))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Meta TMA</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.summary.tmaGoal || ''}
                    onChange={(e) => handleChange('summary', 'tmaGoal', e.target.value === '' ? '' : Number(e.target.value))}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">Backlog por Urgência</h3>
              <div className="grid grid-cols-2 gap-4">
                {formData.backlogByUrgency.map((item, index) => (
                  <div key={item.name} className="grid gap-2">
                    <Label>{item.name}</Label>
                    <Input
                      type="number"
                      value={item.value || ''}
                      onChange={(e) => handleArrayChange('backlogByUrgency', index, 'value', e.target.value === '' ? '' : Number(e.target.value))}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">Volume Diário</h3>
              <div className="space-y-2">
                {formData.dailyVolume.map((day, index) => (
                  <div key={day.day} className="grid grid-cols-4 gap-2 items-center">
                    <Label className="w-10">{day.day}</Label>
                    <Input
                      placeholder="Abertos"
                      type="number"
                      value={day.opened || ''}
                      onChange={(e) => handleArrayChange('dailyVolume', index, 'opened', e.target.value === '' ? '' : Number(e.target.value))}
                    />
                    <Input
                      placeholder="Fechados"
                      type="number"
                      value={day.closed || ''}
                      onChange={(e) => handleArrayChange('dailyVolume', index, 'closed', e.target.value === '' ? '' : Number(e.target.value))}
                    />
                    <Input
                      placeholder="Pendentes"
                      type="number"
                      value={day.pending || ''}
                      onChange={(e) => handleArrayChange('dailyVolume', index, 'pending', e.target.value === '' ? '' : Number(e.target.value))}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={handleSave}>Salvar Alterações</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
