import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { QuarterlyData, useData } from "@/contexts/DataContext";
import { Edit } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function EditQuarterlyDialog() {
  const { quarterlyData, updateQuarterlyData } = useData();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<QuarterlyData>(quarterlyData);

  const handleSave = () => {
    updateQuarterlyData(formData);
    setOpen(false);
    toast.success("Dados trimestrais atualizados com sucesso!");
  };

  const handleChange = (section: keyof QuarterlyData, field: string, value: any) => {
    setFormData((prev) => {
      const sectionData = prev[section];
      if (typeof sectionData === 'object' && sectionData !== null && !Array.isArray(sectionData)) {
        return {
          ...prev,
          [section]: {
            ...sectionData,
            [field]: value,
          },
        };
      }
      return prev;
    });
  };

  const handleArrayChange = (arrayName: 'rootCause' | 'jiraStatus', index: number, field: string, value: any) => {
    setFormData((prev) => {
      const newArray = [...prev[arrayName]];
      newArray[index] = { ...newArray[index], [field]: value };
      return { ...prev, [arrayName]: newArray };
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" onClick={() => setFormData(quarterlyData)}>
          <Edit className="mr-2 h-4 w-4" />
          Editar Dados
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Editar Relatório Trimestral</DialogTitle>
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
                  <Label>Trimestre de Referência</Label>
                  <Input 
                    value={formData.period} 
                    onChange={(e) => setFormData({...formData, period: e.target.value})} 
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">Integração JIRA</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Bugs Corrigidos</Label>
                  <Input 
                    type="number" 
                    value={formData.jiraIntegration.bugsFixed} 
                    onChange={(e) => handleChange('jiraIntegration', 'bugsFixed', Number(e.target.value))} 
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Melhorias Entregues</Label>
                  <Input 
                    type="number" 
                    value={formData.jiraIntegration.improvements} 
                    onChange={(e) => handleChange('jiraIntegration', 'improvements', Number(e.target.value))} 
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Redução de Tickets (Est.)</Label>
                  <Input 
                    type="number" 
                    value={formData.jiraIntegration.ticketsReduced} 
                    onChange={(e) => handleChange('jiraIntegration', 'ticketsReduced', Number(e.target.value))} 
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">Causa Raiz (%)</h3>
              <div className="grid grid-cols-2 gap-4">
                {formData.rootCause.map((item, index) => (
                  <div key={item.name} className="grid gap-2">
                    <Label>{item.name}</Label>
                    <Input 
                      type="number" 
                      value={item.value} 
                      onChange={(e) => handleArrayChange('rootCause', index, 'value', Number(e.target.value))} 
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">Status JIRA</h3>
              <div className="grid grid-cols-2 gap-4">
                {formData.jiraStatus.map((item, index) => (
                  <div key={item.name} className="grid gap-2">
                    <Label>{item.name}</Label>
                    <Input 
                      type="number" 
                      value={item.value} 
                      onChange={(e) => handleArrayChange('jiraStatus', index, 'value', Number(e.target.value))} 
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
