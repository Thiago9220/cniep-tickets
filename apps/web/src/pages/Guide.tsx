import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy } from "lucide-react";
import { toast } from "sonner";

const respostasPadrao = [
  {
    id: "item-1",
    titulo: "1. Novo CNIEP: Migração de Dados e Status de Estabelecimentos",
    texto: `Prezado(a),

Informamos que o novo CNIEP foi lançado recentemente e, por isso, encontra-se em constante processo de atualização. Considerando a migração das informações do antigo CNIEP para o novo, esclarecemos que alguns estabelecimentos cadastrados no respectivo tribunal estão desativados.

Ressaltamos que tais registros não interferem no cadastro de inspeções, uma vez que não são exibidos nesse momento. Contudo, durante este período de atualização, os estabelecimentos vinculados ao TJxx que estão desativados poderão aparecer temporariamente no campo de consulta aos estabelecimentos, mesmo permanecendo inativos. Em que pese apareçam, os estabelecimentos não interferem para qualquer estatística do tribunal.

Quanto aos estabelecimentos que possuem jurisdição do Tribunal de Justiça Militar, informamos que eles aparecem no Estado correspondente, porém estão vinculados ao Tribunal de Justiça de xxx ou ao Superior Tribunal Militar, conforme o caso.

Atenciosamente,
Equipe de Suporte CNIEP2`,
  },
  {
    id: "item-2",
    titulo: "2. Estabelecimentos Cadastrados Incorretamente e Desativados",
    texto: `Prezado(a),

Informamos que o sistema encontra-se em constante processo de atualização.

Dessa forma, esclarecemos que os estabelecimentos cadastrados de forma incorreta e que já se encontram desativados no sistema não interferem no cadastro de inspeções, uma vez que não são exibidos nesse momento. Contudo, ressaltamos que, temporariamente, durante este período, eles ainda poderão aparecer no campo de consulta aos estabelecimentos, mesmo estando desativados.

Atenciosamente,
Equipe de Suporte CNIEP2`,
  },
  {
    id: "item-3",
    titulo: "3. Solicitação de Exclusão de Inspeção em Duplicidade",
    texto: `Prezado(a),

Informamos que será necessário encaminhar, por meio de ofício Destinado ao Departamento de Monitoramento e Fiscalização do Conselho Nacional de Justiça (DMF), a solicitação de exclusão da inspeção em duplicidade.
O documento deve conter, obrigatoriamente, as seguintes informações:

- Descrição detalhada da situação;
- Justificativa do pedido;
- Identificação do magistrado responsável pelo pedido ou do usuário com inspeção compartilhada.

Agradecemos a colaboração e permanecemos à disposição.

Atenciosamente,
Equipe de Suporte CNIEP2`,
  },
  {
    id: "item-4",
    titulo: "4. Obrigatoriedade de Inspeção em Delegacias",
    texto: `Conforme o art. 1º, §1º, da Resolução CNJ nº 593/2024, consideram-se estabelecimentos de privação de liberdade — e, portanto, passíveis de inspeção em consonância com o preconizado pela LEP — as delegacias de polícia, cadeias públicas, presídios, penitenciárias, colônias penais agrícolas e industriais, casas de albergado, hospitais de custódia e outras instituições que mantenham pessoas em situação de privação de liberdade em decorrência de processo penal.

Se for o caso da delegacia em questão, é necessário realizar a inspeção utilizando os formulários disponibilizados e registrar no CNIEP.

Caso a delegacia não mantenha pessoas nessa condição, recomenda-se, na medida do possível e dentro das condições materiais existentes, que sejam feitas inspeções, ainda que sem caráter cogente. A metodologia e seus formulários podem apoiar o(a) magistrado(a) no que couber, sem necessidade de inserção no CNIEP, e ressaltamos que as inspeções em delegacias, por ora, não repercutem no Selo CNJ de Qualidade.

Destacamos que o chamado poderá ser reaberto caso as orientações prestadas não atendam plenamente à demanda.

Atenciosamente,
Equipe de suporte CNIEP2`,
  },
  {
    id: "item-5",
    titulo: "5. Acesso ao Antigo CNIEP e Canais de Consulta",
    texto: `Prezados(as),

Comunicamos que o acesso ao antigo CNIEP foi descontinuado e, no momento, não há possibilidade de consulta via sistema, sendo possível apenas o acesso por meio dos painéis de inspeções referentes às inspeções lançadas até 05/09/2025 (competência de agosto/2025).

Os canais atualmente disponíveis são:
(a) Painel estatístico detalhado: https://paineisanalytics.cnj.jus.br/single/?appid=e28debcd-15e7-4f17-ba93-9aa3ee4d3c5d&sheet=da...
(b) Painel Geopresídios: https://www.cnj.jus.br/inspecao_penal/mapa.php

Caso as necessidades não sejam atendidas pelos canais indicados, o usuário poderá encaminhar ofício ao DMF: dmf@cnj.jus.br. O chamado poderá ser reaberto para nova análise.

Atenciosamente,
Equipe de Suporte CNIEP2`,
  },
  {
    id: "item-6",
    titulo: "6. Fluxo de Abertura, Preenchimento e Submissão",
    texto: `Prezados(as),

Informamos que a abertura e a submissão de inspeções no CNIEP são funcionalidades exclusivas do perfil de magistrados(as).

Dessa forma, o(a) juiz(a) fiscal da unidade deverá:
- Acessar o sistema.
- Abrir o formulário da inspeção.
- Compartilhar a inspeção pelo CPF do(a) servidor(a) responsável pelo preenchimento.

Os(as) servidores(as) designados(as) poderão apenas preencher os formulários após a abertura da inspeção pelo perfil do(a) magistrado(a) e a respectiva atribuição via CPF. Ainda, a submissão do formulário é atribuição do perfil de magistrado(a).

Em situações de afastamento ou gozo de férias do(a) magistrado(a) titular, recomenda-se verificar junto ao Tribunal se o(a) juiz(a) substituto(a) encontra-se devidamente vinculado(a) ao sistema para proceder com a abertura da inspeção.

As orientações detalhadas sobre este procedimento encontram-se disponíveis no Manual do CNIEP: https://docs.pdpj.jus.br/servicos-negociais/cniep/

Atenciosamente,
Equipe de Suporte CNIEP2`,
  },
  {
    id: "item-7",
    titulo: "7. Alerta Mensal para Preenchimento",
    texto: `Prezado(a),

Informamos que será necessário alertar os(as) magistrados(as) mensalmente, a fim de assegurar o correto preenchimento das inspeções no CNIEP2.

Ressaltamos que, além do registro da inspeção do estabelecimento, que é obrigatório e deve ser realizado mensalmente, será necessário preencher um dos temas que serão disponibilizados posteriormente. Informamos também que não será preciso preencher os temas que já foram abordados em meses anteriores.

Atenciosamente,
Equipe de Suporte CNIEP2`,
  },
  {
    id: "item-8",
    titulo: "8. Instabilidade do Sistema",
    texto: `Prezado(a),

Informamos que, nas últimas horas, o sistema apresentou instabilidades que impactaram o acesso e a utilização de algumas funcionalidades. Confirmamos que o sistema foi restabelecido e encontra-se operando dentro dos parâmetros normais.

Diante disso, solicitamos, por gentileza, que sejam realizados novos testes a fim de verificar se todas as funcionalidades estão funcionando conforme o esperado em seu sistema.

Caso seja observada qualquer anomalia, comportamento inesperado ou dificuldade operacional, pedimos que nos informe imediatamente para que possamos dar continuidade ao atendimento e proceder com novas análises, se necessário.

Atenciosamente,
Equipe de Suporte CNIEP2`,
  },
  {
    id: "item-9",
    titulo: "9. PIN de Preenchimento Offline",
    texto: `Prezado(a),

Informamos que o novo CNIEP foi lançado recentemente e, por esse motivo, encontra-se em contínuo processo de aprimoramento.

Nesse sentido, destacamos que a funcionalidade offline gera um código (PIN) com elevado nível de segurança, o qual não é compartilhado com nenhuma outra ferramenta ou pessoa, sendo de uso exclusivo do próprio usuário.

Esclarecemos que está em desenvolvimento uma atualização que possibilitará a alteração do PIN futuramente. Contudo, no momento, essa funcionalidade ainda não está disponível.

Dessa forma, até que a referida atualização seja implementada, não será possível realizar a troca do PIN gerado para acesso à funcionalidade offline, sendo necessário que a inspeção seja registrada por meio da versão online do sistema.

Atenciosamente,
Equipe de Suporte CNIEP2`,
  },
  {
    id: "item-10",
    titulo: "10. Problema Temporário de Sessão",
    texto: `Prezado(a),

Poderia, por gentileza, nos enviar um print da situação? Realizamos alguns testes e, por aqui, o (XXXXXX) está sendo exibido normalmente no sistema.

Pedimos também que faça logout e acesse novamente antes de realizar novos testes, para garantirmos que não se trata de um problema temporário de sessão.

Ficamos no aguardo para darmos continuidade à verificação.

Atenciosamente,
Equipe CNIEP2`,
  },
  {
    id: "item-11",
    titulo: "11. Exclusão em Andamento",
    texto: `Prezado(a),

Obrigado por entrar em contato para esclarecer suas dúvidas.
Informamos que a referida inspeção está com o status "Em andamento", o que permite a sua exclusão. Ressaltamos que a exclusão somente não é possível caso a inspeção já tenha sido submetida no sistema.

No momento, o sistema pode apresentar instabilidade devido ao elevado número de acessos simultâneos. Assim, sugerimos que realize o logout, atualize a página e tente novamente.

Caso o problema persista, solicitamos que entre em contato novamente para que possamos realizar uma nova análise.

Atenciosamente,
Equipe CNIEP2`,
  },
  {
    id: "item-12",
    titulo: "12. Solicitação de Evidências do Problema",
    texto: `Prezado(a),

Para que possamos analisar o problema com precisão, solicitamos que, por gentileza, nos envie prints da tela ou um vídeo mostrando o erro ocorrido.

Após o envio, pedimos também que saia da sua conta e faça login novamente, pois esse procedimento pode resolver inconsistências temporárias no sistema.

Ficamos à disposição para auxiliá-lo(a) no que for necessário.

Atenciosamente,
Equipe CNIEP2`,
  },
  {
    id: "item-13",
    titulo: "13. Tema \"Aspectos Gerais\" (Dez/2025)",
    texto: `Prezado(a),

Em atenção ao questionamento, informamos que, conforme as orientações da etapa inicial de implementação da Resolução CNJ nº 593/2024, recomenda-se a aplicação rotativa dos formulários temáticos durante os cinco primeiros meses de utilização da nova metodologia, considerando excepcionalmente o mês de dezembro de 2025.

Ressaltamos que, como o sistema foi implantado em 2025, não é necessário incluir excepcionalmente novamente o formulário de Aspectos Gerais neste ciclo inicial. A aplicação regular desse formulário nos meses de junho e dezembro passa a ser obrigatória apenas a partir do ano de 2026, conforme previsto no Manual da Resolução.

Permanecemos à disposição para eventuais esclarecimentos.

Atenciosamente,
Equipe CNIEP2`,
  },
];

export default function Guide() {
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Texto copiado para a área de transferência!");
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Guia de Atendimento</h2>
        <p className="text-muted-foreground">
          Textos padrões e procedimentos para atendimento ao cliente (CNIEP 2).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Respostas Padrões</CardTitle>
          <CardDescription>
            Respostas prontas para situações comuns. Copie e cole conforme necessário.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {respostasPadrao.map((resposta) => (
              <AccordionItem key={resposta.id} value={resposta.id}>
                <AccordionTrigger>{resposta.titulo}</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-muted rounded-md text-sm relative group">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleCopy(resposta.texto)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <p className="whitespace-pre-line pr-10">{resposta.texto}</p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
