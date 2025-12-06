import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MonthlyData, useData } from "@/contexts/DataContext";
import { Edit } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export function EditMonthlyDialog() {
  const { monthlyData, updateMonthlyData } = useData();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<MonthlyData>(monthlyData);

  // Atualiza formData quando monthlyData mudar ou quando o diálogo abrir
  useEffect(() => {
    if (open) {
      setFormData(monthlyData);
    }
  }, [open, monthlyData]);

  const handleSave = () => {
    updateMonthlyData(formData);
    setOpen(false);
    toast.success("Dados mensais atualizados com sucesso!");
  };

  const handleChange = (section: keyof MonthlyData, field: string, value: any) => {
    setFormData((prev) => {
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

  const handleArrayChange = (arrayName: 'volumeTrend' | 'byType' | 'byChannel', index: number, field: string, value: any) => {
    setFormData((prev) => {
      const newArray = [...prev[arrayName]];
      newArray[index] = { ...newArray[index], [field]: value === '' ? 0 : value };
      return { ...prev, [arrayName]: newArray };
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" onClick={() => setFormData(monthlyData)}>
          <Edit className="mr-2 h-4 w-4" />
          Editar Dados
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Editar Relatório Mensal</DialogTitle>
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
                  <Label>Mês de Referência</Label>
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
                  <Label>Total Tickets</Label>
                  <Input
                    type="number"
                    value={formData.summary.totalTickets || ''}
                    onChange={(e) => handleChange('summary', 'totalTickets', e.target.value === '' ? '' : Number(e.target.value))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Pendentes</Label>
                  <Input
                    type="number"
                    value={formData.summary.pending || ''}
                    onChange={(e) => handleChange('summary', 'pending', e.target.value === '' ? '' : Number(e.target.value))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>SLA Compliance (%)</Label>
                  <Input
                    type="number"
                    value={formData.summary.slaCompliance || ''}
                    onChange={(e) => handleChange('summary', 'slaCompliance', e.target.value === '' ? '' : Number(e.target.value))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>FCR (%)</Label>
                  <Input
                    type="number"
                    value={formData.summary.fcr || ''}
                    onChange={(e) => handleChange('summary', 'fcr', e.target.value === '' ? '' : Number(e.target.value))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Satisfação (1-5)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.summary.satisfaction || ''}
                    onChange={(e) => handleChange('summary', 'satisfaction', e.target.value === '' ? '' : Number(e.target.value))}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">Tendência Semanal</h3>
              <div className="space-y-2">
                {formData.volumeTrend.map((week, index) => (
                  <div key={week.week} className="grid grid-cols-4 gap-2 items-center">
                    <Label className="w-20">{week.week}</Label>
                    <Input
                      placeholder="Abertos"
                      type="number"
                      value={week.opened || ''}
                      onChange={(e) => handleArrayChange('volumeTrend', index, 'opened', e.target.value === '' ? '' : Number(e.target.value))}
                    />
                    <Input
                      placeholder="Fechados"
                      type="number"
                      value={week.closed || ''}
                      onChange={(e) => handleArrayChange('volumeTrend', index, 'closed', e.target.value === '' ? '' : Number(e.target.value))}
                    />
                    <Input
                      placeholder="Pendentes"
                      type="number"
                      value={week.pending || ''}
                      onChange={(e) => handleArrayChange('volumeTrend', index, 'pending', e.target.value === '' ? '' : Number(e.target.value))}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">Volume por Tipo</h3>
              <div className="grid grid-cols-2 gap-4">
                {formData.byType.map((item, index) => (
                  <div key={item.name} className="grid gap-2">
                    <Label>{item.name}</Label>
                    <Input
                      type="number"
                      value={item.value || ''}
                      onChange={(e) => handleArrayChange('byType', index, 'value', e.target.value === '' ? '' : Number(e.target.value))}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">Volume por Canal</h3>
              <div className="grid grid-cols-2 gap-4">
                {formData.byChannel.map((item, index) => (
                  <div key={item.name} className="grid gap-2">
                    <Label>{item.name}</Label>
                    <Input
                      type="number"
                      value={item.value || ''}
                      onChange={(e) => handleArrayChange('byChannel', index, 'value', e.target.value === '' ? '' : Number(e.target.value))}
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
